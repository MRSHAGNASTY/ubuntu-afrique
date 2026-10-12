import type { SupabaseClient } from "@supabase/supabase-js"
import { confirmCommercePayment, orderFromCardRow, orderFromFractionRow } from "./commerceOrders.mjs"
import { persistGapCoverResult } from "./persistGap.server"
import { persistConfirmVolume } from "./persistVolume.server"
import { persistFractionInventory } from "./persistInventory.server"
import { persistMarketplaceSettlement } from "./persistMarketplaceSettlement.server"
import { settleMarketplaceOrder } from "./marketplaceSettlement.mjs"
import { creditConfirmVolume } from "./volumeEngine.mjs"
import { assertRecordedPaymentForConfirm } from "./paymentAdapter.mjs"
import { loadPaymentEvent } from "./persistPayment.server"
import { loadGapCoverMembers, loadUbuntuSponsorId } from "./ubuntuServer.server"
import { addMoney, formatMoney2, parseMoney } from "./money.mjs"

export async function persistMemberPaymentSettle(
  ubuntu: SupabaseClient,
  input: { kind: "CARD" | "FRACTION" | "MARKETPLACE"; orderId: string; paymentId: string; existing: Record<string, unknown> }
) {
  const kind = input.kind
  const paymentId = String(input.paymentId)
  const orderId = String(input.orderId)
  const existing = input.existing
  if (kind === "MARKETPLACE") {
    return persistMarketplaceMemberPay(ubuntu, { orderId, paymentId, existing })
  }
  const statusField = kind === "CARD" ? "order_status" : "transaction_status"
  const recordedTotal = kind === "CARD" ? existing.total : existing.total_amount

  const recorded = await loadPaymentEvent(ubuntu, paymentId)
  assertRecordedPaymentForConfirm({
    event: recorded
      ? {
          paymentId: String(recorded.payment_id),
          orderId: String(recorded.order_id),
          kind: String(recorded.kind),
          amount: String(recorded.amount),
          status: String(recorded.status),
        }
      : null,
    order: { id: orderId, total: recordedTotal == null ? "" : String(recordedTotal) },
    paymentId,
    kind,
  })

  if (String(existing[statusField] || "") === "PAID") {
    if (existing.payment_id && String(existing.payment_id) !== paymentId) {
      throw new Error("Order already settled against a different payment")
    }
    return { idempotent: true, order: { id: orderId, kind, status: "PAID", total: String(recordedTotal || ""), paymentId } }
  }

  let order
  if (kind === "CARD") {
    order = orderFromCardRow(existing)
  } else {
    const { data: inventory } = await ubuntu
      .from("ua_underlying_inventory")
      .select("remaining_underlying, sold_underlying")
      .eq("id", "AUREUS_100K")
      .maybeSingle()
    const { data: reserve, error: reserveError } = await ubuntu
      .from("ua_aureus_liability_ledger")
      .select("amount")
      .eq("source_transaction_id", orderId)
      .eq("entry_type", "FRACTION_RESERVE")
      .maybeSingle()
    if (reserveError && !String(reserveError.message || "").includes("does not exist")) {
      throw new Error(reserveError.message)
    }
    let remainingForRebuild =
      inventory?.remaining_underlying != null ? String(inventory.remaining_underlying) : undefined
    if (reserve?.amount != null && remainingForRebuild != null) {
      remainingForRebuild = formatMoney2(addMoney(parseMoney(remainingForRebuild), parseMoney(String(reserve.amount))))
    }
    order = orderFromFractionRow(existing, remainingForRebuild)
    if (inventory?.sold_underlying != null) {
      order.soldUnderlying = String(inventory.sold_underlying)
    }
  }

  const sellerId = String(order.sponsorId || order.userId)
  const members = await loadGapCoverMembers(ubuntu, sellerId)
  const confirmed = confirmCommercePayment({
    order,
    paymentId,
    members,
    uplineUserIds: [sellerId, ...members.map((row) => row.userId)],
  })

  if (confirmed.gapCover) {
    await persistGapCoverResult(ubuntu, confirmed.id, sellerId, confirmed.productId, {
      commissionableValue: confirmed.commissionableValue,
      compPlanVersion: confirmed.gapCover.compPlanVersion,
      payments: confirmed.gapCover.payments,
    })
    if (kind === "CARD") {
      const { error } = await ubuntu
        .from("ua_card_orders")
        .update({
          order_status: "PAID",
          payment_id: paymentId,
          fulfilment_status: confirmed.fulfilmentStatus || "PROCESSING",
          fulfilment_at: new Date().toISOString(),
        })
        .eq("id", confirmed.id)
        .eq("order_status", "PENDING_PAYMENT")
      if (error) throw new Error(error.message)
    } else {
      await persistFractionInventory(ubuntu, {
        sourceTransactionId: confirmed.id,
        underlyingShareEquivalent: confirmed.ownership.underlyingShareEquivalent,
      })
      const { error } = await ubuntu
        .from("ua_fraction_transactions")
        .update({
          transaction_status: "PAID",
          payment_id: paymentId,
        })
        .eq("id", confirmed.id)
        .eq("transaction_status", "PENDING_PAYMENT")
      if (error) throw new Error(error.message)
      if (confirmed.ownership && Number.isInteger(Number(confirmed.userId))) {
        await ubuntu.from("ua_fraction_ownership").insert({
          user_id: Number(confirmed.userId),
          source_transaction_id: confirmed.id,
          quantity: confirmed.quantity,
          aureus_phase: confirmed.aureusPhase,
          aureus_share_price: confirmed.aureusSharePrice,
          underlying_share_equivalent: confirmed.underlyingShareEquivalent,
        })
      }
    }
    if (confirmed.volume) {
      await persistConfirmVolume(ubuntu, confirmed.volume)
    }
    const { persistNotificationQuiet } = await import("./persistNotification.server")
    const { notificationForCommission, notificationForPayment } = await import("./notificationEngine.mjs")
    const buyerId = Number(confirmed.userId)
    if (Number.isInteger(buyerId) && buyerId > 0) {
      for (const note of notificationForPayment({ kind, orderId: confirmed.id, userId: buyerId })) {
        await persistNotificationQuiet(ubuntu, note)
      }
    }
    for (const payment of confirmed.gapCover.payments || []) {
      const recipientId = Number(payment.recipientId || payment.userId)
      if (!Number.isInteger(recipientId) || recipientId <= 0) continue
      await persistNotificationQuiet(ubuntu, notificationForCommission({
        userId: recipientId,
        amount: payment.amount,
        sourceTransactionId: confirmed.id,
      }))
    }
  }

  return { idempotent: false, order: confirmed }
}

async function persistMarketplaceMemberPay(
  ubuntu: SupabaseClient,
  input: { orderId: string; paymentId: string; existing: Record<string, unknown> }
) {
  const orderId = String(input.orderId)
  const paymentId = String(input.paymentId)
  const existing = input.existing
  const recordedTotal = existing.retail_price
  const recorded = await loadPaymentEvent(ubuntu, paymentId)
  assertRecordedPaymentForConfirm({
    event: recorded
      ? {
          paymentId: String(recorded.payment_id),
          orderId: String(recorded.order_id),
          kind: String(recorded.kind),
          amount: String(recorded.amount),
          status: String(recorded.status),
        }
      : null,
    order: { id: orderId, total: recordedTotal == null ? "" : String(recordedTotal) },
    paymentId,
    kind: "MARKETPLACE",
  })

  if (String(existing.status || "") === "PAID" || String(existing.status || "") === "SETTLED") {
    return {
      idempotent: true,
      order: { id: orderId, kind: "MARKETPLACE", status: "PAID", total: String(recordedTotal || ""), paymentId },
    }
  }

  const buyerIdRaw = String(existing.user_id || "")
  const sponsorId = await loadUbuntuSponsorId(ubuntu, buyerIdRaw)
  const sellerId = String(sponsorId || buyerIdRaw)
  const members = await loadGapCoverMembers(ubuntu, sellerId)
  const settled = settleMarketplaceOrder({
    order: {
      id: orderId,
      total: String(existing.retail_price || "0"),
      commissionableValue: String(existing.commissionable_value || existing.retail_price || "0"),
      companyPayout: String(existing.company_payout || "0"),
      gapSchedule: "STANDARD_25",
    },
    members,
    company: { id: String(existing.company_id || ""), isActive: true },
  })
  if (settled.gapCover) {
    await persistGapCoverResult(ubuntu, orderId, sellerId, String(existing.product_id || ""), {
      commissionableValue: String(existing.commissionable_value || existing.retail_price || "0"),
      compPlanVersion: settled.gapCover.compPlanVersion,
      payments: settled.gapCover.payments,
    })
  }
  await persistMarketplaceSettlement(ubuntu, {
    order: {
      id: orderId,
      companyId: String(existing.company_id || ""),
      productId: String(existing.product_id || ""),
      retailPrice: String(existing.retail_price || "0"),
      companyPayout: String(existing.company_payout || "0"),
      commissionableValue: String(existing.commissionable_value || existing.retail_price || "0"),
      qv: String(existing.qv || existing.retail_price || "0"),
      userId: String(existing.user_id || ""),
    },
    companyPayout: String(existing.company_payout || "0"),
    status: "PAID",
  })
  const volume = creditConfirmVolume({
    order: {
      id: orderId,
      userId: String(existing.user_id || ""),
      qv: String(existing.qv || existing.retail_price || "0"),
      commissionableValue: String(existing.commissionable_value || existing.retail_price || "0"),
    },
    uplineUserIds: members.map((row) => row.userId),
  })
  await persistConfirmVolume(ubuntu, volume)

  const { persistNotificationQuiet } = await import("./persistNotification.server")
  const { notificationForCommission, notificationForPayment } = await import("./notificationEngine.mjs")
  const buyerId = Number(existing.user_id)
  if (Number.isInteger(buyerId) && buyerId > 0) {
    for (const note of notificationForPayment({ kind: "MARKETPLACE", orderId, userId: buyerId })) {
      await persistNotificationQuiet(ubuntu, note)
    }
  }
  for (const payment of settled.gapCover?.payments || []) {
    const recipientId = Number(payment.recipientId || payment.userId)
    if (!Number.isInteger(recipientId) || recipientId <= 0) continue
    await persistNotificationQuiet(ubuntu, notificationForCommission({
      userId: recipientId,
      amount: payment.amount,
      sourceTransactionId: orderId,
    }))
  }

  return {
    idempotent: false,
    order: { id: orderId, kind: "MARKETPLACE", status: "PAID", total: String(recordedTotal || ""), paymentId },
  }
}
