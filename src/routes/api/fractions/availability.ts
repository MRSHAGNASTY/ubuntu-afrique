import { createFileRoute } from "@tanstack/react-router"
import { phaseAvailability } from "../../../lib/fractionEngine.mjs"
import { getUbuntuServerClient, loadActiveAureusPhase, loadUnderlyingInventory } from "../../../lib/ubuntuServer.server"

export const Route = createFileRoute("/api/fractions/availability")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get("remainingUnderlying")) {
          return Response.json({
            ok: false,
            error: "remainingUnderlying is taken from Ubuntu inventory, not the client",
            checkoutEnabled: false,
          }, { status: 400 })
        }
        if (url.searchParams.get("aureusSharePrice") || url.searchParams.get("aureusPhase")) {
          return Response.json({
            ok: false,
            error: "aureusSharePrice and aureusPhase are taken from Ubuntu ua_aureus_phases, not the client",
            checkoutEnabled: false,
          }, { status: 400 })
        }

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return Response.json({ ok: false, error: err instanceof Error ? err.message : "Ubuntu read refused" }, { status: 500 })
        }
        if (!ubuntu) {
          return Response.json({ ok: false, error: "Ubuntu Afrique database is not configured", checkoutEnabled: false }, { status: 503 })
        }

        try {
          const [inventory, phase] = await Promise.all([
            loadUnderlyingInventory(ubuntu),
            loadActiveAureusPhase(ubuntu),
          ])
          return Response.json({
            ok: true,
            availability: phaseAvailability(inventory.remainingUnderlying, phase.aureusSharePrice),
            inventory,
            phase,
            checkoutEnabled: true,
            fractionCheckoutEnabled: true,
            marketplaceEnabled: true,
            nftMarketplaceEnabled: false,
          })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Availability failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }
      },
    },
  },
})