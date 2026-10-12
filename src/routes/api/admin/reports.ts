import { createFileRoute } from "@tanstack/react-router"
import { loadUbuntuReport } from "../../../lib/persistReports.server"
import { authorizeUbuntuStaff } from "../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"

async function authorize(request: Request, url: URL) {
  return authorizeUbuntuStaff(request, { confirmSecret: String(url.searchParams.get("confirmSecret") || "") }, "FINANCE")
}

export const Route = createFileRoute("/api/admin/reports")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const auth = await authorize(request, url)
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
          return Response.json({ ok: false, error: "Ubuntu Afrique database is not configured", checkoutEnabled: false }, { status: 503 })
        }
        try {
          const report = await loadUbuntuReport(ubuntu, {
            preset: url.searchParams.get("preset") || "weekly",
            from: url.searchParams.get("from") || undefined,
            to: url.searchParams.get("to") || undefined,
          })
          return Response.json({ ok: true, report, checkoutEnabled: false })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Ubuntu report failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }
      },
    },
  },
})
