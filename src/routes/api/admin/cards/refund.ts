import { createFileRoute } from "@tanstack/react-router"
import { confirmCommercePayment, orderFromCardRow, reverseCardOrder } from "../../../../lib/commerceOrders.mjs"
import { persistCardRefund } from "../../../../lib/persistRefund.server"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient, loadGapCoverMembers } from "../../../../lib/ubuntuServer.server"

async function authorize(request: Request, body: Record<string, unknown>) {
  return authorizeUbuntuStaff(request, body, "CARD")
}

export const Route = createFileRoute("/api/admin/cards/refund")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        const auth = await authorize(request, body)
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }

        const orderId = String(body.orderId || "").trim()
        const reason = String(body.reason || "").trim()
        if (!orderId) {
          return Response.json({ ok: false, error: "orderId is required", checkoutEnabled: false }, { status: 400 })
        }

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Ubuntu write refused",
            checkoutEnabled: false,
          }, { status: 500 })
        }
        if (!ubuntu) {
          return Response.json({ ok: false, error: "Ubuntu Afrique database is not configured", checkoutEnabled: false }, { status: 503 })
        }

        const { data: existing, error: existingError } = await ubuntu
          .from("ua_card_orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle()
        if (existingError) {
          return Response.json({ ok: false, error: existingError.message, checkoutEnabled: false }, { status: 500 })
        }
        if (!existing) {
          return Response.json({ ok: false, error: "Card order not found", checkoutEnabled: false }, { status: 404 })
        }
        if (String(existing.order_status || "") === "REFUNDED") {
          return Response.json({
            ok: true,
            orderId,
            orderStatus: "REFUNDED",
            fulfilmentStatus: existing.fulfilment_status || "REFUNDED",
            idempotent: true,
            checkoutEnabled: false,
          })
        }
        if (String(existing.order_status || "") !== "PAID") {
          return Response.json({ ok: false, error: "Card refund requires a PAID order", checkoutEnabled: false }, { status: 409 })
        }
        if (!existing.fulfilment_status) {
          return Response.json({ ok: false, error: "Card refund requires fulfilment to exist", checkoutEnabled: false }, { status: 409 })
        }

        const { data: commissions, error: commissionError } = await ubuntu
          .from("ua_commission_transactions")
          .select("recipient_user_id, recipient_rank, commission_type, previous_entitlement, new_entitlement, gap_percentage, amount, comp_plan_version")
          .eq("source_transaction_id", orderId)
          .eq("commission_type", "GAP_COMMISSION")
        if (commissionError) {
          return Response.json({ ok: false, error: commissionError.message, checkoutEnabled: false }, { status: 500 })
        }

        let order
        try {
          order = orderFromCardRow(existing)
          order.status = "PAID"
          order.paymentId = String(existing.payment_id || "REFUND")
          order.fulfilmentStatus = String(existing.fulfilment_status)
          if (commissions && commissions.length) {
            order.gapCover = {
              payments: commissions.map((row) => ({
                recipientId: String(row.recipient_user_id),
                recipientRank: String(row.recipient_rank || ""),
                commissionType: String(row.commission_type),
                previousEntitlement: String(row.previous_entitlement || "0"),
                newEntitlement: String(row.new_entitlement || "0"),
                gapPercentage: String(row.gap_percentage || "0"),
                amount: String(row.amount),
                compPlanVersion: String(row.comp_plan_version || "GAP_COVER_V1"),
              })),
            }
          } else {
            const sellerId = String(existing.sponsor_id || order.sponsorId || order.userId)
            const members = await loadGapCoverMembers(ubuntu, sellerId)
            const rebuilt = confirmCommercePayment({
              order: { ...order, status: "PENDING_PAYMENT" },
              paymentId: String(existing.payment_id || "REFUND"),
              members,
            })
            order.gapCover = rebuilt.gapCover
            order.volume = rebuilt.volume
            order.blpAccrual = rebuilt.blpAccrual
          }
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Refund rebuild failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }

        if (!order.volume) {
          const sellerId = String(existing.sponsor_id || order.sponsorId || order.userId)
          const members = await loadGapCoverMembers(ubuntu, sellerId)
          const rebuilt = confirmCommercePayment({
            order: { ...order, status: "PENDING_PAYMENT", gapCover: undefined, fulfilmentStatus: undefined },
            paymentId: String(existing.payment_id || "REFUND"),
            members,
          })
          order.volume = rebuilt.volume
          order.blpAccrual = rebuilt.blpAccrual
          if (!order.gapCover) order.gapCover = rebuilt.gapCover
        }

        let refunded
        try {
          refunded = reverseCardOrder({ order, reason })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Refund failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }

        try {
          const persisted = await persistCardRefund(ubuntu, refunded)
          return Response.json({
            ok: true,
            order: refunded,
            persisted: true,
            idempotent: Boolean(persisted.idempotent),
            checkoutEnabled: false,
          })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Refund persist failed",
            checkoutEnabled: false,
          }, { status: 500 })
        }
      },
    },
  },
})