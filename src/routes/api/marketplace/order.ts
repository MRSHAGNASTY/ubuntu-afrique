import { createFileRoute } from "@tanstack/react-router"
import { persistPendingMarketplaceOrder } from "../../../lib/persistMarketplaceSettlement.server"
import { resolveUbuntuMember } from "../../../lib/persistMemberLedger.server"
import { verifyUaSession } from "../../../lib/uaSession.server"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"
import {
  assertMarketplacePublicCheckoutNamed,
  publicMarketplaceOrderResponse,
  rejectPublicMarketplaceClientOverrides,
} from "../../../lib/ubuntuPublicMarketplaceCheckout.mjs"

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || ""
  return header.startsWith("Bearer ") ? header.slice(7) : ""
}

function marketError(status: number, error: string) {
  return Response.json(
    {
      ok: false,
      error,
      checkoutEnabled: true,
      marketplaceEnabled: true,
      nftMarketplaceEnabled: false,
    },
    { status }
  )
}

export const Route = createFileRoute("/api/marketplace/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>
        try {
          assertMarketplacePublicCheckoutNamed()
          rejectPublicMarketplaceClientOverrides(body)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Public marketplace checkout refused"
          const forbidden = message.includes("not open")
          return marketError(forbidden ? 403 : 400, message)
        }

        const token = bearerToken(request)
        if (!token) return marketError(401, "Session required")

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return marketError(500, err instanceof Error ? err.message : "Ubuntu write refused")
        }
        if (!ubuntu) return marketError(503, "Ubuntu Afrique database is not configured")

        try {
          let member = null
          try {
            const session = verifyUaSession(token)
            member = await resolveUbuntuMember(ubuntu, {
              email: session.email,
              aureusUserId: session.aureusUserId,
            })
          } catch {
            const { data, error } = await ubuntu.auth.getUser(token)
            if (error || !data.user) return marketError(401, "Invalid session")
            member = await resolveUbuntuMember(ubuntu, {
              authUserId: data.user.id,
              email: data.user.email || "",
            })
          }
          if (!member) return marketError(404, "Ubuntu member book not found")
          if (member.is_active !== true) return marketError(403, "Ubuntu user is not active")

          const persisted = await persistPendingMarketplaceOrder(ubuntu, {
            orderId: crypto.randomUUID(),
            userId: String(member.id),
            productId: String(body.productId || body.slug || ""),
          })
          return Response.json(publicMarketplaceOrderResponse(persisted))
        } catch (err) {
          const message = err instanceof Error ? err.message : "Marketplace order failed"
          const missing = message.includes("not found")
          return marketError(missing ? 404 : 400, message)
        }
      },
    },
  },
})
