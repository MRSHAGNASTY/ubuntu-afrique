import { createFileRoute } from "@tanstack/react-router"
import { loadUbuntuReport } from "../../../lib/persistReports.server"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"

function authorize(request: Request, url: URL) {
  const expected = String(process.env.UA_COMMERCE_CONFIRM_SECRET || "")
  if (!expected) return { ok: false, status: 503, error: "UA_COMMERCE_CONFIRM_SECRET is not configured" }
  const header = request.headers.get("x-ua-commerce-confirm") || ""
  const fromQuery = String(url.searchParams.get("confirmSecret") || "")
  if (header !== expected && fromQuery !== expected) {
    return { ok: false, status: 401, error: "Confirm secret required" }
  }
  return { ok: true }
}

export const Route = createFileRoute("/api/admin/reports")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const auth = authorize(request, url)
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
