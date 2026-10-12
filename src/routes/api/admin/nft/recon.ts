import { createFileRoute } from "@tanstack/react-router"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"
import { loadNftRecon } from "../../../../lib/persistNft.server"

async function authorize(request: Request, secret: string) {
  return authorizeUbuntuStaff(request, { confirmSecret: secret }, "MARKETPLACE")
}

export const Route = createFileRoute("/api/admin/nft/recon")({
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
        const saleId = String(url.searchParams.get("saleId") || "").trim()
        const recon = await loadNftRecon(ubuntu, saleId || undefined)
        return Response.json({ ...recon, nftMarketplaceEnabled: false })
      },
    },
  },
})
