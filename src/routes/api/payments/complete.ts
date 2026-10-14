import { createFileRoute } from "@tanstack/react-router"
import { persistUbuntuPspWebhook } from "../../../lib/persistPsp.server"
import { persistMemberPaymentSettle } from "../../../lib/persistMemberPaymentSettle.server"
import { persistPaymentEvent } from "../../../lib/persistPayment.server"
import { verifyUbuntuPaystackReference } from "../../../lib/persistPaystack.server"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"
import { assertUbuntuPspSecret } from "../../../lib/ubuntuPsp.mjs"
import { assertUbuntuPaystackSecret, paystackConfigured, UA_PAYSTACK_PROVIDER } from "../../../lib/ubuntuPaystack.mjs"
import { bscConfigured } from "../../../lib/ubuntuBscVerify.mjs"
import { bearerToken, resolveSessionMember } from "../../../lib/resolveUbuntuSessionMember.server"
import {
  assertMemberPaymentGateNamed,
  assertMemberPaymentKind,
  bookPaymentAmount,
  memberPaymentCompleteResponse,
  memberPaymentGateFlags,
  rejectMemberPaymentClientOverrides,
} from "../../../lib/ubuntuMemberPaymentGate.mjs"

function gateError(status: number, error: string) {
  return Response.json({ ok: false, error, ...memberPaymentGateFlags() }, { status })
}

export const Route = createFileRoute("/api/payments/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        try {
          assertMemberPaymentGateNamed()
          rejectMemberPaymentClientOverrides(body)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Member payment gate refused"
          const forbidden = message.includes("only") || message.includes("not open")
          return gateError(forbidden ? 403 : 400, message)
        }

        let kind
        try {
          kind = assertMemberPaymentKind(body.kind)
        } catch (err) {
          return gateError(403, err instanceof Error ? err.message : "CARD, FRACTION, and MARKETPLACE only")
        }
        const orderId = String(body.orderId || "").trim()
        const paymentId = String(body.paymentId || "").trim()
        const signature = String(body.signature || "").trim()
        if (bscConfigured()) {
          return gateError(400, "Submit the BSC USDT hash to /api/payments/verify-bsc")
        }
        const usePaystack = paystackConfigured()
        if (!orderId || !paymentId || (!usePaystack && !signature)) {
          return gateError(400, usePaystack ? "orderId and paymentId are required" : "orderId, paymentId, and signature are required")
        }

        const token = bearerToken(request)
        if (!token) return gateError(401, "Session required")

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return gateError(500, err instanceof Error ? err.message : "Ubuntu write refused")
        }
        if (!ubuntu) return gateError(503, "Ubuntu Afrique database is not configured")

        let secret = ""
        let paystackSecret = ""
        try {
          if (usePaystack) {
            paystackSecret = assertUbuntuPaystackSecret(process.env.UA_PAYSTACK_SECRET_KEY || "")
          } else {
            secret = assertUbuntuPspSecret(process.env.UA_PSP_WEBHOOK_SECRET || "")
          }
        } catch (err) {
          return gateError(503, err instanceof Error ? err.message : "Ubuntu PSP secret is required")
        }

        try {
          const member = await resolveSessionMember(ubuntu, token)
          if (!member) return gateError(404, "Ubuntu member book not found")
          if (member.is_active !== true) return gateError(403, "Ubuntu user is not active")

          const table = kind === "CARD" ? "ua_card_orders" : kind === "FRACTION" ? "ua_fraction_transactions" : "ua_marketplace_orders"
          const ownerField = kind === "FRACTION" ? "buyer_id" : "user_id"
          const { data: existing, error } = await ubuntu.from(table).select("*").eq("id", orderId).maybeSingle()
          if (error) return gateError(500, error.message)
          if (!existing) return gateError(404, "Pending order not found")
          if (String(existing[ownerField]) !== String(member.id)) return gateError(403, "Order is not in this Ubuntu member book")

          const amount = bookPaymentAmount(
            kind === "CARD" ? existing.total : kind === "FRACTION" ? existing.total_amount : existing.retail_price
          )
          if (paystackSecret) {
            const verified = await verifyUbuntuPaystackReference({ secret: paystackSecret, reference: paymentId })
            if (verified.orderId !== orderId || verified.kind !== kind) {
              return gateError(409, "Paystack payment does not match this Ubuntu order")
            }
            if (verified.amount !== amount) {
              return gateError(409, "Paystack amount does not match the Ubuntu book")
            }
            await persistPaymentEvent(ubuntu, verified)
            const settled = await persistMemberPaymentSettle(ubuntu, {
              kind,
              orderId,
              paymentId: verified.paymentId,
              existing,
            })
            return Response.json(
              memberPaymentCompleteResponse({
                order: settled.order,
                paymentId: verified.paymentId,
                settled: true,
                idempotent: settled.idempotent === true,
                provider: UA_PAYSTACK_PROVIDER,
              })
            )
          }
          await persistUbuntuPspWebhook(ubuntu, {
            secret,
            signature,
            payload: { paymentId, orderId, kind, amount, currency: "USD" },
            order: { id: orderId, total: amount, kind },
          })
          const settled = await persistMemberPaymentSettle(ubuntu, {
            kind,
            orderId,
            paymentId,
            existing,
          })
          return Response.json(
            memberPaymentCompleteResponse({
              order: settled.order,
              paymentId,
              settled: true,
              idempotent: settled.idempotent === true,
            })
          )
        } catch (err) {
          const message = err instanceof Error ? err.message : "Payment complete failed"
          const raced = /duplicate|unique constraint|ua_qv_txn_source/i.test(message)
          if (raced) {
            const racedTable = kind === "CARD" ? "ua_card_orders" : kind === "FRACTION" ? "ua_fraction_transactions" : "ua_marketplace_orders"
            const { data: again } = await ubuntu
              .from(racedTable)
              .select("*")
              .eq("id", orderId)
              .maybeSingle()
            const statusField = kind === "CARD" ? "order_status" : kind === "FRACTION" ? "transaction_status" : "status"
            if (again && (String(again[statusField] || "") === "PAID" || String(again[statusField] || "") === "SETTLED")) {
              return Response.json(
                memberPaymentCompleteResponse({
                  order: {
                    id: orderId,
                    kind,
                    status: "PAID",
                    total: String(
                      kind === "CARD" ? again.total : kind === "FRACTION" ? again.total_amount || "" : again.retail_price || ""
                    ),
                  },
                  paymentId,
                  settled: true,
                  idempotent: true,
                })
              )
            }
          }
          const unauthorized = message.includes("Invalid session") || message.includes("signature") || message.includes("expired")
          const conflict = message.includes("already") || message.includes("not pending")
          return gateError(unauthorized ? 401 : conflict ? 409 : 400, message)
        }
      },
    },
  },
})
