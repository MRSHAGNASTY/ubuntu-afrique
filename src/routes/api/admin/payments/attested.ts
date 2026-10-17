import { createFileRoute } from "@tanstack/react-router"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { loadAttestedPendingOrders } from "../../../../lib/persistBscAttest.server"

export const Route = createFileRoute("/api/admin/payments/attested")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const auth = await authorizeUbuntuStaff(
          request,
          { confirmSecret: String(url.searchParams.get("confirmSecret") || "") },
          "FINANCE"
        )
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }
        if (!auth.ubuntu) {
          return Response.json({ ok: false, error: "Ubuntu Afrique database is not configured" }, { status: 503 })
        }
        try {
          const orders = await loadAttestedPendingOrders(auth.ubuntu)
          return Response.json({
            ok: true,
            orders,
            mintedAureusShares: false,
            nftMarketplaceEnabled: false,
            next: "admin-approve",
          })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Attested list failed",
            checkoutEnabled: false,
          }, { status: 500 })
        }
      },
    },
  },
})
