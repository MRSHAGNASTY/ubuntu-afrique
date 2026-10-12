import { createFileRoute } from "@tanstack/react-router"
import { rankProgress } from "../../../../lib/rankProgress.mjs"
import { loadRankProgressSnapshot } from "../../../../lib/persistRankProgress.server"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"

async function authorize(request: Request, url: URL) {
  return authorizeUbuntuStaff(request, { confirmSecret: String(url.searchParams.get("confirmSecret") || "") }, "SUPPORT")
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
  if (url.searchParams.has("rank") || url.searchParams.has("currentRank")) {
    return { ok: false, error: "rank and currentRank are taken from Ubuntu ua_user_ranks, not the client" }
  }
  if (url.searchParams.has("teamVolume")) {
    return { ok: false, error: "teamVolume is taken from Ubuntu ua_team_volume, not the client" }
  }
  if (url.searchParams.has("entitlement")) {
    return { ok: false, error: "entitlement is taken from STANDARD_25, not the client" }
  }
  return { ok: true }
}

export const Route = createFileRoute("/api/admin/ranks/progress")({
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

        const userId = String(url.searchParams.get("userId") || "").trim()
        if (!userId) {
          return Response.json({ ok: false, error: "userId is required", checkoutEnabled: false }, { status: 400 })
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
          const snapshot = await loadRankProgressSnapshot(ubuntu, userId)
          const progress = rankProgress(snapshot)
          return Response.json({ ok: true, ...progress, checkoutEnabled: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ubuntu user not found"
          const missing = message.includes("not found") || message.includes("ua_users.id")
          const unknownRank = message.includes("Unknown corporate rank")
          return Response.json({
            ok: false,
            error: message,
            checkoutEnabled: false,
          }, { status: missing ? 404 : unknownRank ? 400 : 500 })
        }
      },
    },
  },
})
