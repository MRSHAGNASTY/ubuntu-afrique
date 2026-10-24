import { createFileRoute } from "@tanstack/react-router"
import { applyPriceVersionSnapshot, createPendingFractionOrder } from "../../../lib/commerceOrders.mjs"
import { persistPendingFractionOrder } from "../../../lib/persistPending.server"
import { persistFractionReserve } from "../../../lib/persistInventory.server"
import { resolveUbuntuMember } from "../../../lib/persistMemberLedger.server"
import { loadCurrentPriceVersion } from "../../../lib/persistPricing.server"
import { verifyUaSession } from "../../../lib/uaSession.server"
import { getUbuntuServerClient, loadActiveAureusPhase, loadUbuntuSponsorId, loadUnderlyingInventory } from "../../../lib/ubuntuServer.server"
import {
  assertFractionPublicCheckoutNamed,
  assertPublicFractionKind,
  publicFractionOrderResponse,
  rejectPublicFractionClientOverrides,
} from "../../../lib/ubuntuPublicFractionCheckout.mjs"

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || ""
  return header.startsWith("Bearer ") ? header.slice(7) : ""
}

function fractionError(status: number, error: string) {
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

export const Route = createFileRoute("/api/fractions/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        try {
          assertFractionPublicCheckoutNamed()
          assertPublicFractionKind(body.kind)
          rejectPublicFractionClientOverrides(body)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Public FRACTION checkout refused"
          const forbidden = message.includes("FRACTION only") || message.includes("not open")
          return fractionError(forbidden ? 403 : 400, message)
        }

        const token = bearerToken(request)
        if (!token) return fractionError(401, "Session required")

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return fractionError(500, err instanceof Error ? err.message : "Ubuntu write refused")
        }
        if (!ubuntu) return fractionError(503, "Ubuntu Afrique database is not configured")

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
            if (error || !data.user) return fractionError(401, "Invalid session")
            member = await resolveUbuntuMember(ubuntu, {
              authUserId: data.user.id,
              email: data.user.email || "",
            })
          }
          if (!member) return fractionError(404, "Ubuntu member book not found")
          if (member.is_active !== true) return fractionError(403, "Ubuntu user is not active")

          const [inventory, phase, priceVersion] = await Promise.all([
            loadUnderlyingInventory(ubuntu),
            loadActiveAureusPhase(ubuntu),
            loadCurrentPriceVersion(ubuntu, "AUREUS_FRACTION"),
          ])
          const sponsorId = await loadUbuntuSponsorId(ubuntu, member.id)
          const order = applyPriceVersionSnapshot(
            createPendingFractionOrder({
              orderId: crypto.randomUUID(),
              userId: String(member.id),
              quantity: Number(body.quantity || 1),
              aureusSharePrice: phase.aureusSharePrice,
              aureusPhase: phase.phase,
              remainingUnderlying: inventory.remainingUnderlying,
              sponsorId,
              priceVersion: priceVersion.id,
            }),
            priceVersion
          )
          const persisted = await persistPendingFractionOrder(ubuntu, order)
          const reserved = await persistFractionReserve(ubuntu, {
            sourceTransactionId: order.id,
            underlyingShareEquivalent: order.underlyingShareEquivalent,
          })
          return Response.json(
            publicFractionOrderResponse({
              order,
              persisted: true,
              idempotent: Boolean(persisted.idempotent || reserved.idempotent),
            })
          )
        } catch (err) {
          const message = err instanceof Error ? err.message : "FRACTION order failed"
          const missing = message.includes("not found")
          const soldThrough = message.toLowerCase().includes("exceeds remaining")
          return fractionError(soldThrough ? 409 : missing ? 404 : 400, message)
        }
      },
    },
  },
})
