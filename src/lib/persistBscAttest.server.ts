import type { SupabaseClient } from "@supabase/supabase-js"
import { persistMemberPaymentSettle } from "./persistMemberPaymentSettle.server"
import { loadPaymentEvent } from "./persistPayment.server"
import { persistAdminAudit } from "./persistKyc.server"
import { SHARE_MINT_REFUSED } from "./ubuntuBscVerify.mjs"
import { assertNoAureusShareMint, assertProcessParityKind } from "./ubuntuProcessParity.mjs"

export function ubuntuOrderBook(kind: string) {
  const value = assertProcessParityKind(kind)
  if (value === "CARD") {
    return {
      table: "ua_card_orders",
      statusField: "order_status",
      totalField: "total",
      ownerField: "user_id",
      hasPaymentId: true,
    }
  }
  if (value === "FRACTION") {
    return {
      table: "ua_fraction_transactions",
      statusField: "transaction_status",
      totalField: "total_amount",
      ownerField: "buyer_id",
      hasPaymentId: true,
    }
  }
  return {
    table: "ua_marketplace_orders",
    statusField: "status",
    totalField: "retail_price",
    ownerField: "user_id",
    hasPaymentId: false,
  }
}

function paidStatus(status: string) {
  const value = String(status || "").toUpperCase()
  return value === "PAID" || value === "SETTLED"
}

export async function persistBscAttestOnPending(
  ubuntu: SupabaseClient,
  input: {
    kind: "CARD" | "FRACTION" | "MARKETPLACE"
    orderId: string
    paymentId: string
    existing: Record<string, unknown>
  }
) {
  assertNoAureusShareMint(input)
  const book = ubuntuOrderBook(input.kind)
  const status = String(input.existing[book.statusField] || "")
  const paymentId = String(input.paymentId)
  if (paidStatus(status)) {
    if (book.hasPaymentId && input.existing.payment_id && String(input.existing.payment_id) !== paymentId) {
      throw new Error("Order already settled against a different payment")
    }
    return { idempotent: true, attested: true, settled: true as const, status: "PAID" }
  }
  if (status !== "PENDING_PAYMENT") {
    throw new Error("Order is not pending payment")
  }
  if (book.hasPaymentId) {
    const existingHash = String(input.existing.payment_id || "")
    if (existingHash && existingHash !== paymentId) {
      throw new Error("Order already attested against a different payment")
    }
    if (existingHash === paymentId) {
      return { idempotent: true, attested: true, settled: false as const, status: "PENDING_PAYMENT" }
    }
    const { error } = await ubuntu
      .from(book.table)
      .update({ payment_id: paymentId })
      .eq("id", input.orderId)
      .eq(book.statusField, "PENDING_PAYMENT")
    if (error) throw new Error(error.message)
  }
  return { idempotent: false, attested: true, settled: false as const, status: "PENDING_PAYMENT" }
}

export async function loadAttestedPendingOrders(ubuntu: SupabaseClient) {
  const { data: events, error } = await ubuntu
    .from("ua_payment_events")
    .select("payment_id, order_id, kind, amount, provider, status, created_at")
    .eq("status", "RECORDED")
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)

  const rows = []
  for (const event of events || []) {
    const kind = String(event.kind || "").toUpperCase()
    if (kind !== "CARD" && kind !== "FRACTION" && kind !== "MARKETPLACE") continue
    const book = ubuntuOrderBook(kind)
    const { data: order, error: orderError } = await ubuntu
      .from(book.table)
      .select("*")
      .eq("id", String(event.order_id))
      .maybeSingle()
    if (orderError) throw new Error(orderError.message)
    if (!order) continue
    if (paidStatus(String(order[book.statusField] || ""))) continue
    if (String(order[book.statusField] || "") !== "PENDING_PAYMENT") continue
    rows.push({
      kind,
      orderId: String(order.id),
      paymentId: String(event.payment_id),
      amount: String(event.amount),
      provider: String(event.provider || "BSC_USDT"),
      status: "PENDING_PAYMENT",
      attested: true,
      settled: false,
      createdAt: String(event.created_at || ""),
      ownerId: String(order[book.ownerField] || ""),
    })
  }
  return rows
}

export async function persistJohanApprove(
  ubuntu: SupabaseClient,
  input: {
    kind: "CARD" | "FRACTION" | "MARKETPLACE"
    orderId: string
    paymentId: string
    actorUserId?: string | null
  }
) {
  assertNoAureusShareMint(input)
  const paymentId = String(input.paymentId)
  const recorded = await loadPaymentEvent(ubuntu, paymentId)
  if (!recorded) throw new Error("Recorded payment event is required")
  if (String(recorded.order_id) !== String(input.orderId) || String(recorded.kind).toUpperCase() !== input.kind) {
    throw new Error("Recorded payment does not match this Ubuntu order")
  }
  const book = ubuntuOrderBook(input.kind)
  const { data: existing, error } = await ubuntu.from(book.table).select("*").eq("id", input.orderId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!existing) throw new Error("Pending order not found")
  const settled = await persistMemberPaymentSettle(ubuntu, {
    kind: input.kind,
    orderId: input.orderId,
    paymentId,
    existing,
  })
  await persistAdminAudit(ubuntu, {
    actorUserId: input.actorUserId || null,
    actorVia: input.actorUserId ? "role" : "secret",
    action: "johan-verify-and-approve",
    targetType: book.table,
    targetId: input.orderId,
    detail: paymentId,
  }).catch(() => undefined)
  if (JSON.stringify(settled).includes("aureus_share_purchases")) {
    throw new Error(SHARE_MINT_REFUSED)
  }
  return settled
}
