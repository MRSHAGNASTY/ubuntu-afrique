import type { SupabaseClient } from "@supabase/supabase-js"

export type MemberCardOrder = {
  id: string
  kind: "CARD"
  productId: string
  quantity: number
  total: string
  qv: string
  status: string
  paymentId: string
  trackingNumber: string
  createdAt: string
}

export type MemberFractionOrder = {
  id: string
  kind: "FRACTION"
  quantity: number
  total: string
  qv: string
  status: string
  paymentId: string
  underlyingShareEquivalent: string
  aureusPhase: string
  createdAt: string
}

export async function loadMemberOrders(ubuntu: SupabaseClient, userId: string | number) {
  const id = Number(userId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("userId must be an existing Ubuntu ua_users.id")
  }

  const [{ data: cards, error: cardError }, { data: fractions, error: fractionError }] = await Promise.all([
    ubuntu
      .from("ua_card_orders")
      .select("id, product_id, quantity, total, qv, order_status, payment_id, tracking_number, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    ubuntu
      .from("ua_fraction_transactions")
      .select("id, quantity, total_amount, qv, transaction_status, payment_id, underlying_share_equivalent, aureus_phase, created_at")
      .eq("buyer_id", id)
      .order("created_at", { ascending: false }),
  ])
  if (cardError) throw new Error(cardError.message)
  if (fractionError) throw new Error(fractionError.message)

  const cardOrders: MemberCardOrder[] = (cards || []).map((row) => ({
    id: String(row.id),
    kind: "CARD",
    productId: String(row.product_id || ""),
    quantity: Number(row.quantity) || 0,
    total: String(row.total ?? "0"),
    qv: String(row.qv ?? "0"),
    status: String(row.order_status || ""),
    paymentId: row.payment_id == null ? "" : String(row.payment_id),
    trackingNumber: row.tracking_number == null ? "" : String(row.tracking_number),
    createdAt: row.created_at == null ? "" : String(row.created_at),
  }))

  const fractionOrders: MemberFractionOrder[] = (fractions || []).map((row) => ({
    id: String(row.id),
    kind: "FRACTION",
    quantity: Number(row.quantity) || 0,
    total: String(row.total_amount ?? "0"),
    qv: String(row.qv ?? "0"),
    status: String(row.transaction_status || ""),
    paymentId: row.payment_id == null ? "" : String(row.payment_id),
    underlyingShareEquivalent: String(row.underlying_share_equivalent ?? "0"),
    aureusPhase: String(row.aureus_phase ?? ""),
    createdAt: row.created_at == null ? "" : String(row.created_at),
  }))

  return {
    userId: String(id),
    cards: cardOrders,
    fractions: fractionOrders,
    marketplaceEnabled: false,
    nftEnabled: false,
  }
}
