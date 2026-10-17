import { createFileRoute } from "@tanstack/react-router"
import { persistBscAttestOnPending } from "../../../lib/persistBscAttest.server"
import { assertBscHashReusable } from "../../../lib/persistHashReuse.server"
import { persistPaymentEvent } from "../../../lib/persistPayment.server"
import { verifyUbuntuBscHash } from "../../../lib/persistBsc.server"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"
import { bearerToken, resolveSessionMember } from "../../../lib/resolveUbuntuSessionMember.server"
import {
  BSC_TX_NOT_FOUND,
  UA_BSC_PROVIDER,
  bscConfigured,
  normalizeTxHash,
} from "../../../lib/ubuntuBscVerify.mjs"
import {
  assertNoAureusShareMint,
  memberPaymentAttestResponse,
} from "../../../lib/ubuntuProcessParity.mjs"
import {
  assertMemberPaymentGateNamed,
  assertMemberPaymentKind,
  bookPaymentAmount,
  memberPaymentGateFlags,
  rejectMemberPaymentClientOverrides,
} from "../../../lib/ubuntuMemberPaymentGate.mjs"

function gateError(status: number, error: string) {
  return Response.json({ ok: false, error, ...memberPaymentGateFlags() }, { status })
}

export const Route = createFileRoute("/api/payments/verify-bsc")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        try {
          assertMemberPaymentGateNamed()
          rejectMemberPaymentClientOverrides(body)
          assertNoAureusShareMint(body)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Member payment gate refused"
          const forbidden = message.includes("only") || message.includes("not open") || message.includes("does not mint")
          return gateError(forbidden ? 403 : 400, message)
        }

        if (!bscConfigured()) {
          return gateError(503, "UA_BSC_COMPANY_WALLET is required")
        }

        let kind
        try {
          kind = assertMemberPaymentKind(body.kind)
        } catch (err) {
          return gateError(403, err instanceof Error ? err.message : "CARD, FRACTION, and MARKETPLACE only")
        }

        const orderId = String(body.orderId || "").trim()
        let txHash = ""
        try {
          txHash = normalizeTxHash(body.txHash || body.paymentId)
        } catch (err) {
          return gateError(400, err instanceof Error ? err.message : "BSC transaction hash is invalid")
        }
        if (!orderId) return gateError(400, "orderId and txHash are required")

        const token = bearerToken(request)
        if (!token) return gateError(401, "Session required")

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return gateError(500, err instanceof Error ? err.message : "Ubuntu write refused")
        }
        if (!ubuntu) return gateError(503, "Ubuntu Afrique database is not configured")

        try {
          const member = await resolveSessionMember(ubuntu, token)
          if (!member) return gateError(404, "Ubuntu member book not found")
          if (member.is_active !== true) return gateError(403, "Ubuntu user is not active")

          const table = kind === "CARD" ? "ua_card_orders" : kind === "FRACTION" ? "ua_fraction_transactions" : "ua_marketplace_orders"
          const ownerField = kind === "FRACTION" ? "buyer_id" : "user_id"
          const statusField = kind === "CARD" ? "order_status" : kind === "FRACTION" ? "transaction_status" : "status"
          const { data: existing, error } = await ubuntu.from(table).select("*").eq("id", orderId).maybeSingle()
          if (error) return gateError(500, error.message)
          if (!existing) return gateError(404, "Pending order not found")
          if (String(existing[ownerField]) !== String(member.id)) {
            return gateError(403, "Order is not in this Ubuntu member book")
          }

          await assertBscHashReusable(ubuntu, { paymentId: txHash, orderId })

          const amount = bookPaymentAmount(
            kind === "CARD" ? existing.total : kind === "FRACTION" ? existing.total_amount : existing.retail_price
          )
          const verified = await verifyUbuntuBscHash({
            txHash,
            expectedAmount: amount,
            orderId,
            kind,
          })
          await persistPaymentEvent(ubuntu, verified)
          const attested = await persistBscAttestOnPending(ubuntu, {
            kind,
            orderId,
            paymentId: verified.paymentId,
            existing,
          })
          return Response.json(
            memberPaymentAttestResponse({
              order: {
                id: orderId,
                kind,
                status: attested.settled ? "PAID" : String(existing[statusField] || "PENDING_PAYMENT"),
                total: amount,
              },
              paymentId: verified.paymentId,
              attested: true,
              idempotent: attested.idempotent === true,
              provider: UA_BSC_PROVIDER,
            })
          )
        } catch (err) {
          const message = err instanceof Error ? err.message : "BSC verify failed"
          const unauthorized = message.includes("Invalid session") || message.includes("expired")
          const notFound = message.includes(BSC_TX_NOT_FOUND) || message.includes("not found")
          const conflict = message.includes("already") || message.includes("not pending") || message.includes("different Ubuntu")
          const unavailable = message.includes("prod SELECT is required")
          return gateError(unauthorized ? 401 : notFound ? 404 : conflict ? 409 : unavailable ? 503 : 400, message)
        }
      },
    },
  },
})
