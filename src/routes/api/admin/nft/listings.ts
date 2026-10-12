import { createFileRoute } from "@tanstack/react-router"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"
import { loadNftListings, persistNftListing } from "../../../../lib/persistNft.server"

async function authorize(request: Request, secret: string) {
  return authorizeUbuntuStaff(request, { confirmSecret: secret }, "MARKETPLACE")
}

export const Route = createFileRoute("/api/admin/nft/listings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const auth = await authorize(request, String(url.searchParams.get("confirmSecret") || ""))
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }
        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Ubuntu read refused",
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
        const listings = await loadNftListings(ubuntu)
        return Response.json({ ok: true, listings, checkoutEnabled: false, nftMarketplaceEnabled: false })
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>
        const auth = await authorize(request, String(body.confirmSecret || ""))
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
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
          const listing = await persistNftListing(ubuntu, {
            id: body.id,
            nftId: body.nftId,
            sellerId: body.sellerId,
            sponsorId: body.sponsorId,
            price: body.price,
          })
          return Response.json({ ok: true, listing, checkoutEnabled: false, nftMarketplaceEnabled: false })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "NFT listing persist failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }
      },
    },
  },
})
