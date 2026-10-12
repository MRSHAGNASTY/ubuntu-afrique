import { createFileRoute } from "@tanstack/react-router"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"
import { loadFinanceSummary } from "../../../../lib/persistFinanceRead.server"

async function authorize(request: Request, url: URL) {
  return authorizeUbuntuStaff(request, { confirmSecret: String(url.searchParams.get("confirmSecret") || "") }, "FINANCE")
}

function rejectClientCommerceFields(url: URL) {
  if (url.searchParams.has("remainingUnderlying")) {
    return { ok: false, error: "remainingUnderlying is taken from Ubuntu inventory, not the client" }
  }
  if (url.searchParams.has("aureusSharePrice")) {
    return { ok: false, error: "aureusSharePrice and aureusPhase are taken from Ubuntu ua_aureus_phases, not the client" }
  }
  if (url.searchParams.has("members")) {
    return { ok: false, error: "Client-supplied rank chains are rejected" }
  }
  return { ok: true }
}

export const Route = createFileRoute("/api/admin/finance/summary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const auth = await authorize(request, url)
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }

        const rejected = rejectClientCommerceFields(url)
        if (!rejected.ok) {
          return Response.json({ ok: false, error: rejected.error, checkoutEnabled: false }, { status: 400 })
        }

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return Response.json(
            {
              ok: false,
              error: err instanceof Error ? err.message : "Ubuntu read refused",
              checkoutEnabled: false,
            },
            { status: 500 },
          )
        }
        if (!ubuntu) {
          return Response.json(
            { ok: false, error: "Ubuntu Afrique database is not configured", checkoutEnabled: false },
            { status: 503 },
          )
        }

        const summary = await loadFinanceSummary(ubuntu)
        return Response.json({ ok: true, checkoutEnabled: false, summary })
      },
    },
  },
})
