import type { SupabaseClient } from "@supabase/supabase-js"
import { confirmCommercePayment, orderFromCardRow, orderFromFractionRow } from "./commerceOrders.mjs"
import { persistGapCoverResult } from "./persistGap.server"
import { persistConfirmVolume } from "./persistVolume.server"
import { persistFractionInventory } from "./persistInventory.server"
import { assertRecordedPaymentForConfirm } from "./paymentAdapter.mjs"
import { loadPaymentEvent } from "./persistPayment.server"
import { loadGapCoverMembers } from "./ubuntuServer.server"
import { addMoney, formatMoney2, parseMoney } from "./money.mjs"

export async function persistMemberPaymentSettle(
  ubuntu: SupabaseClient,
  input: { kind: "CARD" | "FRACTION"; orderId: string; paymentId: string; existing: Record<string, unknown> }
) {
  const kind = input.kind
  const paymentId = String(input.paymentId)
  const orderId = String(input.orderId)
  const existing = input.existing
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
