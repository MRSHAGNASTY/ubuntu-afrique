import { createFileRoute } from "@tanstack/react-router"
import { randomUUID } from "node:crypto"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"
import { assertUbuntuPspSecret } from "../../../lib/ubuntuPsp.mjs"
import { assertUbuntuPaystackSecret, paystackConfigured, UA_PAYSTACK_PROVIDER } from "../../../lib/ubuntuPaystack.mjs"
import { initializeUbuntuPaystackPayment } from "../../../lib/persistPaystack.server"
import { BSC_CHAIN_ID, UA_BSC_PROVIDER, bscConfigured, normalizeWallet } from "../../../lib/ubuntuBscVerify.mjs"
import { bearerToken, resolveSessionMember } from "../../../lib/resolveUbuntuSessionMember.server"
import {
  assertMemberPaymentGateNamed,
  assertMemberPaymentKind,
  bookPaymentAmount,
  memberPaymentGateFlags,
  memberPaymentInitiateResponse,
  rejectMemberPaymentClientOverrides,
  signMemberPaymentTicket,
} from "../../../lib/ubuntuMemberPaymentGate.mjs"

function gateError(status: number, error: string) {
  return Response.json({ ok: false, error, ...memberPaymentGateFlags() }, { status })
}

export const Route = createFileRoute("/api/payments/initiate")({
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
        if (!orderId) return gateError(400, "orderId is required")

        const token = bearerToken(request)
        if (!token) return gateError(401, "Session required")

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return gateError(500, err instanceof Error ? err.message : "Ubuntu write refused")
        }
        if (!ubuntu) return gateError(503, "Ubuntu Afrique database is not configured")

        const useBsc = bscConfigured()
        let secret = ""
        let paystackSecret = ""
        try {
          if (useBsc) {
            normalizeWallet(process.env.UA_BSC_COMPANY_WALLET || "")
          } else if (paystackConfigured()) {
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
          const statusField = kind === "CARD" ? "order_status" : kind === "FRACTION" ? "transaction_status" : "status"
          const totalField = kind === "CARD" ? "total" : kind === "FRACTION" ? "total_amount" : "retail_price"
          const { data: existing, error } = await ubuntu
            .from(table)
            .select(`id, ${ownerField}, ${statusField}, ${totalField}`)
            .eq("id", orderId)
            .maybeSingle()
          if (error) return gateError(500, error.message)
          if (!existing) return gateError(404, "Pending order not found")
          if (String(existing[ownerField]) !== String(member.id)) return gateError(403, "Order is not in this Ubuntu member book")
          if (String(existing[statusField] || "") !== "PENDING_PAYMENT") {
            return gateError(409, "Order is not pending payment")
          }

          const amount = bookPaymentAmount(existing[totalField])
          const paymentId = randomUUID()
          if (useBsc) {
            return Response.json(memberPaymentInitiateResponse({
              paymentId,
              orderId,
              kind,
              amount,
              signature: "",
              provider: UA_BSC_PROVIDER,
              companyWallet: normalizeWallet(process.env.UA_BSC_COMPANY_WALLET || ""),
              network: "BSC",
              token: "USDT",
              chainId: BSC_CHAIN_ID,
            }))
          }
          if (paystackSecret) {
            const origin = new URL(request.url).origin
            const started = await initializeUbuntuPaystackPayment({
              secret: paystackSecret,
              email: String(member.email || ""),
              amount,
              kind,
              orderId,
              paymentId,
              callbackUrl: `${origin}/dashboard/pay?kind=${encodeURIComponent(kind)}&orderId=${encodeURIComponent(orderId)}`,
            })
            return Response.json(memberPaymentInitiateResponse({
              paymentId: started.reference || paymentId,
              orderId,
              kind,
              amount,
              signature: "",
              provider: UA_PAYSTACK_PROVIDER,
              authorizationUrl: started.authorizationUrl,
            }))
          }
          const signature = signMemberPaymentTicket(secret, { paymentId, orderId, kind, amount })
          return Response.json(memberPaymentInitiateResponse({ paymentId, orderId, kind, amount, signature }))
        } catch (err) {
          const message = err instanceof Error ? err.message : "Payment initiate failed"
          const unauthorized = message.includes("Invalid session") || message.includes("expired")
          return gateError(unauthorized ? 401 : 400, message)
        }
      },
    },
  },
})
