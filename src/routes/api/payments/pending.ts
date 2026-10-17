import { createFileRoute } from "@tanstack/react-router"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"
import { bearerToken, resolveSessionMember } from "../../../lib/resolveUbuntuSessionMember.server"
import { assertMemberPaymentGateNamed, memberPaymentGateFlags } from "../../../lib/ubuntuMemberPaymentGate.mjs"

function gateError(status: number, error: string) {
  return Response.json({ ok: false, error, ...memberPaymentGateFlags() }, { status })
}

export const Route = createFileRoute("/api/payments/pending")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          assertMemberPaymentGateNamed()
        } catch (err) {
          return gateError(403, err instanceof Error ? err.message : "Member payment gate refused")
        }

        const token = bearerToken(request)
        if (!token) return gateError(401, "Session required")

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return gateError(500, err instanceof Error ? err.message : "Ubuntu read refused")
        }
        if (!ubuntu) return gateError(503, "Ubuntu Afrique database is not configured")

        try {
          const member = await resolveSessionMember(ubuntu, token)
          if (!member) return gateError(404, "Ubuntu member book not found")
          if (member.is_active !== true) return gateError(403, "Ubuntu user is not active")

          const [{ data: cards, error: cardError }, { data: fractions, error: fractionError }, { data: markets, error: marketError }] = await Promise.all([
            ubuntu
              .from("ua_card_orders")
              .select("id, product_id, quantity, total, order_status, payment_id, created_at")
              .eq("user_id", member.id)
              .eq("order_status", "PENDING_PAYMENT")
              .order("created_at", { ascending: false }),
            ubuntu
              .from("ua_fraction_transactions")
              .select("id, quantity, total_amount, transaction_status, payment_id, created_at")
              .eq("buyer_id", member.id)
              .eq("transaction_status", "PENDING_PAYMENT")
              .order("created_at", { ascending: false }),
            ubuntu
              .from("ua_marketplace_orders")
              .select("id, product_id, retail_price, status, created_at")
              .eq("user_id", String(member.id))
              .eq("status", "PENDING_PAYMENT")
              .order("created_at", { ascending: false }),
          ])
          if (cardError) return gateError(500, cardError.message)
          if (fractionError) return gateError(500, fractionError.message)
          if (marketError) return gateError(500, marketError.message)

          return Response.json({
            ok: true,
            orders: [
              ...(cards || []).map((row) => ({
                id: String(row.id),
                kind: "CARD",
                productId: String(row.product_id),
                quantity: Number(row.quantity),
                total: String(row.total),
                status: String(row.order_status),
                paymentId: row.payment_id ? String(row.payment_id) : "",
                attested: Boolean(row.payment_id),
              })),
              ...(fractions || []).map((row) => ({
                id: String(row.id),
                kind: "FRACTION",
                productId: "AUREUS_FRACTION",
                quantity: Number(row.quantity),
                total: String(row.total_amount),
                status: String(row.transaction_status),
                paymentId: row.payment_id ? String(row.payment_id) : "",
                attested: Boolean(row.payment_id),
              })),
              ...(markets || []).map((row) => ({
                id: String(row.id),
                kind: "MARKETPLACE",
                productId: String(row.product_id),
                quantity: 1,
                total: String(row.retail_price),
                status: String(row.status),
              })),
            ],
            ...memberPaymentGateFlags(),
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Pending payments failed"
          const unauthorized = message.includes("Invalid session") || message.includes("expired")
          return gateError(unauthorized ? 401 : 400, message)
        }
      },
    },
  },
})
