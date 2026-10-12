import { createFileRoute } from "@tanstack/react-router"
import { loadKycProfile } from "../../../../lib/persistKyc.server"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { assertNoAureusKycInput } from "../../../../lib/ubuntuKyc.mjs"

export const Route = createFileRoute("/api/admin/kyc/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const body = { confirmSecret: url.searchParams.get("confirmSecret") || "" }
        try {
          assertNoAureusKycInput(Object.fromEntries(url.searchParams.entries()))
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Aureus KYC refused",
            checkoutEnabled: false,
          }, { status: 400 })
        }
        const auth = await authorizeUbuntuStaff(request, body, "KYC")
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }
        if (!auth.ubuntu) {
          return Response.json({
            ok: false,
            error: "Ubuntu Afrique database is not configured",
            checkoutEnabled: false,
          }, { status: 503 })
        }
        const userId = String(url.searchParams.get("userId") || "").trim()
        if (!userId) {
          return Response.json({ ok: false, error: "userId is required", checkoutEnabled: false }, { status: 400 })
        }
        try {
          const kyc = await loadKycProfile(auth.ubuntu, userId)
          return Response.json({ ok: true, userId, kyc, via: auth.via, checkoutEnabled: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ubuntu KYC load failed"
          const missing = message.includes("not found")
          return Response.json({ ok: false, error: message, checkoutEnabled: false }, { status: missing ? 404 : 400 })
        }
      },
    },
  },
})
