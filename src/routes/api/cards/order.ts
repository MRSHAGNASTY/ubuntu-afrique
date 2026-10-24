import { createFileRoute } from "@tanstack/react-router"
import { applyPriceVersionSnapshot, createPendingCardOrder } from "../../../lib/commerceOrders.mjs"
import { persistPendingCardOrder } from "../../../lib/persistPending.server"
import { resolveUbuntuMember } from "../../../lib/persistMemberLedger.server"
import { loadCurrentPriceVersion } from "../../../lib/persistPricing.server"
import { verifyUaSession } from "../../../lib/uaSession.server"
import { getUbuntuServerClient, loadUbuntuSponsorId } from "../../../lib/ubuntuServer.server"
import {
  assertCardPublicCheckoutNamed,
  assertPublicCardKind,
  publicCardOrderResponse,
  rejectPublicCardClientOverrides,
} from "../../../lib/ubuntuPublicCardCheckout.mjs"

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || ""
  return header.startsWith("Bearer ") ? header.slice(7) : ""
}

function cardError(status: number, error: string) {
  return Response.json(
    {
      ok: false,
      error,
      checkoutEnabled: true,
      cardCheckoutEnabled: true,
      fractionCheckoutEnabled: true,
      marketplaceEnabled: true,
      nftMarketplaceEnabled: false,
    },
    { status }
  )
}

export const Route = createFileRoute("/api/cards/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        try {
          assertCardPublicCheckoutNamed()
          assertPublicCardKind(body.kind)
          rejectPublicCardClientOverrides(body)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Public CARD checkout refused"
          const forbidden = message.includes("CARD only") || message.includes("not open")
          return cardError(forbidden ? 403 : 400, message)
        }

        const token = bearerToken(request)
        if (!token) return cardError(401, "Session required")

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return cardError(500, err instanceof Error ? err.message : "Ubuntu write refused")
        }
        if (!ubuntu) return cardError(503, "Ubuntu Afrique database is not configured")

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
            if (error || !data.user) return cardError(401, "Invalid session")
            member = await resolveUbuntuMember(ubuntu, {
              authUserId: data.user.id,
              email: data.user.email || "",
            })
          }
          if (!member) return cardError(404, "Ubuntu member book not found")
          if (member.is_active !== true) return cardError(403, "Ubuntu user is not active")

          const productType = String(body.productType || "")
          const priceVersion = await loadCurrentPriceVersion(ubuntu, productType)
          const sponsorId = await loadUbuntuSponsorId(ubuntu, member.id)
          const order = applyPriceVersionSnapshot(
            createPendingCardOrder({
              orderId: crypto.randomUUID(),
              userId: String(member.id),
              productType,
              quantity: Number(body.quantity || 1),
              sponsorId,
              priceVersionId: priceVersion.id,
            }),
            priceVersion
          )
          const persisted = await persistPendingCardOrder(ubuntu, order)
          return Response.json(publicCardOrderResponse({
            order,
            persisted: true,
            idempotent: Boolean(persisted.idempotent),
          }))
        } catch (err) {
          const message = err instanceof Error ? err.message : "CARD order failed"
          const missing = message.includes("not found")
          return cardError(missing ? 404 : 400, message)
        }
      },
    },
  },
})
