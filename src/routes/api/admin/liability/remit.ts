import { createFileRoute } from "@tanstack/react-router"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"
import { remitPaidFractionLiability } from "../../../../lib/persistLiability.server"

async function authorize(request: Request, body: Record<string, unknown>) {
  return authorizeUbuntuStaff(request, body, "SHARE")
}

export const Route = createFileRoute("/api/admin/liability/remit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>
        const auth = await authorize(request, body)
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }
        if (Object.prototype.hasOwnProperty.call(body, "amount") || Object.prototype.hasOwnProperty.call(body, "total")) {
          return Response.json({
            ok: false,
            error: "Remittance amount is taken from the paid Ubuntu fraction, not the client",
            checkoutEnabled: false,
          }, { status: 400 })
        }
        if (
          Object.prototype.hasOwnProperty.call(body, "remainingUnderlying") ||
          Object.prototype.hasOwnProperty.call(body, "aureusSharePrice")
        ) {
          return Response.json({
            ok: false,
            error: "remainingUnderlying and aureusSharePrice are taken from Ubuntu, not the client",
            checkoutEnabled: false,
          }, { status: 400 })
        }
        if (Object.prototype.hasOwnProperty.call(body, "members") || Object.prototype.hasOwnProperty.call(body, "rank")) {
          return Response.json({
            ok: false,
            error: "Client-supplied rank chains are rejected",
            checkoutEnabled: false,
          }, { status: 400 })
        }

        const sourceTransactionId = String(body.sourceTransactionId || body.orderId || "").trim()
        if (!sourceTransactionId) {
          return Response.json({
            ok: false,
            error: "sourceTransactionId is required",
            checkoutEnabled: false,
          }, { status: 400 })
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
          return Response.json({
            ok: false,
            error: "Ubuntu Afrique database is not configured",
            checkoutEnabled: false,
          }, { status: 503 })
        }

        try {
          const remitted = await remitPaidFractionLiability(ubuntu, sourceTransactionId)
          return Response.json({
            ok: true,
            remitted: true,
            reservedEqualsRemitted: false,
            checkoutEnabled: false,
            ...remitted,
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Liability remittance failed"
          const reserved = message.includes("Reserved does not mean paid")
          const missing = message.includes("not found") || message.includes("required")
          return Response.json({
            ok: false,
            error: message,
            reservedEqualsRemitted: false,
            checkoutEnabled: false,
          }, { status: reserved || missing ? 409 : 400 })
        }
      },
    },
  },
})
