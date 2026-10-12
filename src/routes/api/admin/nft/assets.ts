import { createFileRoute } from "@tanstack/react-router"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"
import { loadNftAssets, persistNftAsset } from "../../../../lib/persistNft.server"

function authorize(request: Request, body: Record<string, unknown>) {
  const expected = String(process.env.UA_COMMERCE_CONFIRM_SECRET || "")
  if (!expected) return { ok: false, status: 503, error: "UA_COMMERCE_CONFIRM_SECRET is not configured" }
  const header = request.headers.get("x-ua-commerce-confirm") || ""
  const fromBody = String(body.confirmSecret || "")
  if (header !== expected && fromBody !== expected) {
    return { ok: false, status: 401, error: "Confirm secret required" }
  }
  return { ok: true }
}

export const Route = createFileRoute("/api/admin/nft/assets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const auth = authorize(request, { confirmSecret: String(url.searchParams.get("confirmSecret") || "") })
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
        const assets = await loadNftAssets(ubuntu)
        return Response.json({ ok: true, assets, checkoutEnabled: false, nftMarketplaceEnabled: false })
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>
        const auth = authorize(request, body)
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
          const asset = await persistNftAsset(ubuntu, { id: body.id, ownerId: body.ownerId })
          return Response.json({ ok: true, asset, checkoutEnabled: false, nftMarketplaceEnabled: false })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "NFT asset persist failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }
      },
    },
  },
})
