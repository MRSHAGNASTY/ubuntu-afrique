import { createFileRoute } from "@tanstack/react-router"
import { applyRankPromotion, evaluateRankQualification } from "../../../../lib/rankEngine.mjs"
import { persistRankPromotion } from "../../../../lib/persistRank.server"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"

async function authorize(request: Request, body: Record<string, unknown>) {
  return authorizeUbuntuStaff(request, body, "SUPPORT")
}

function clientSuppliedRank(body: Record<string, unknown>) {
  const keys = ["remainingUnderlying", "aureusSharePrice", "rank", "currentRank", "qualifiedRank"] as const
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue
    const value = body[key]
    if (value == null) continue
    if (typeof value === "string" && value.trim() === "") continue
    return true
  }
  if (!Object.prototype.hasOwnProperty.call(body, "members")) return false
  const members = body.members
  if (Array.isArray(members)) return members.length > 0
  if (members == null) return false
  if (typeof members === "string" && members.trim() === "") return false
  return true
}

export const Route = createFileRoute("/api/admin/ranks/promote")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        const auth = await authorize(request, body as Record<string, unknown>)
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }
        if (clientSuppliedRank(body as Record<string, unknown>)) {
          return Response.json({
            ok: false,
            error: "Client cannot supply rank. Rank is calculated from Ubuntu.",
            checkoutEnabled: false,
          }, { status: 400 })
        }

        const userId = String((body as Record<string, unknown>).userId || "").trim()
        if (!/^\d+$/.test(userId)) {
          return Response.json({
            ok: false,
            error: "userId is required",
            checkoutEnabled: false,
          }, { status: 400 })
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

        const { data: user, error: userError } = await ubuntu
          .from("ua_users")
          .select("id, is_active")
          .eq("id", userId)
          .maybeSingle()
        if (userError) {
          return Response.json({ ok: false, error: userError.message, checkoutEnabled: false }, { status: 500 })
        }
        if (!user) {
          return Response.json({ ok: false, error: "Ubuntu user not found", checkoutEnabled: false }, { status: 404 })
        }

        const { data: rankRow, error: rankError } = await ubuntu
          .from("ua_user_ranks")
          .select("rank_code")
          .eq("user_id", userId)
          .maybeSingle()
        if (rankError) {
          return Response.json({ ok: false, error: rankError.message, checkoutEnabled: false }, { status: 500 })
        }

        const { data: volumeRow, error: volumeError } = await ubuntu
          .from("ua_team_volume")
          .select("team_qv")
          .eq("user_id", userId)
          .maybeSingle()
        if (volumeError) {
          return Response.json({ ok: false, error: volumeError.message, checkoutEnabled: false }, { status: 500 })
        }

        const { data: directs, error: directError } = await ubuntu
          .from("ua_sponsor_tree")
          .select("user_id")
          .eq("sponsor_id", userId)
        if (directError) {
          return Response.json({ ok: false, error: directError.message, checkoutEnabled: false }, { status: 500 })
        }

        const directIds = (directs || []).map((row) => String(row.user_id))
        let directRankRows: Array<{ user_id: string | number; rank_code: string }> = []
        let grandchildRows: Array<{ user_id: string | number; sponsor_id: string | number }> = []
        if (directIds.length) {
          const { data: directRanks, error: directRankError } = await ubuntu
            .from("ua_user_ranks")
            .select("user_id, rank_code")
            .in("user_id", directIds)
          if (directRankError) {
            return Response.json({ ok: false, error: directRankError.message, checkoutEnabled: false }, { status: 500 })
          }
          directRankRows = directRanks || []

          const { data: grandchildren, error: grandchildError } = await ubuntu
            .from("ua_sponsor_tree")
            .select("user_id, sponsor_id")
            .in("sponsor_id", directIds)
          if (grandchildError) {
            return Response.json({ ok: false, error: grandchildError.message, checkoutEnabled: false }, { status: 500 })
          }
          grandchildRows = grandchildren || []
        }

        let grandchildRankRows: Array<{ user_id: string | number; rank_code: string }> = []
        const grandchildIds = grandchildRows.map((row) => String(row.user_id))
        if (grandchildIds.length) {
          const { data: grandchildRanks, error: grandchildRankError } = await ubuntu
            .from("ua_user_ranks")
            .select("user_id, rank_code")
            .in("user_id", grandchildIds)
          if (grandchildRankError) {
            return Response.json({ ok: false, error: grandchildRankError.message, checkoutEnabled: false }, { status: 500 })
          }
          grandchildRankRows = grandchildRanks || []
        }

        const rankByUser = new Map<string, string>()
        for (const row of [...directRankRows, ...grandchildRankRows]) {
          rankByUser.set(String(row.user_id), String(row.rank_code || ""))
        }
        const descendantsBySponsor = new Map<string, Array<{ rank: string }>>()
        for (const row of grandchildRows) {
          const sponsorId = String(row.sponsor_id)
          const list = descendantsBySponsor.get(sponsorId) || []
          list.push({ rank: rankByUser.get(String(row.user_id)) || "" })
          descendantsBySponsor.set(sponsorId, list)
        }
        const directLegs = directIds.map((id) => ({
          rank: rankByUser.get(id) || "",
          descendants: descendantsBySponsor.get(id) || [],
        }))

        const currentRank = String(rankRow?.rank_code || "SSA").toUpperCase()
        let evaluation
        try {
          evaluation = evaluateRankQualification({
            currentRank,
            teamVolume: volumeRow?.team_qv == null ? "0" : String(volumeRow.team_qv),
            teamMemberCount: directIds.length,
            directLegs,
            isActive: user.is_active === true,
          })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Rank qualification failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }

        if (!evaluation.promoted) {
          return Response.json({
            ok: true,
            promoted: false,
            currentRank: evaluation.currentRank,
            nextRank: evaluation.nextRank,
            checkoutEnabled: false,
          })
        }

        const decision = applyRankPromotion({
          currentRank: evaluation.currentRank,
          qualifiedRank: evaluation.qualifiedRank,
        })
        if (!decision.promoted) {
          return Response.json({
            ok: true,
            promoted: false,
            currentRank: evaluation.currentRank,
            nextRank: evaluation.nextRank,
            checkoutEnabled: false,
          })
        }

        try {
          const persisted = await persistRankPromotion(ubuntu, {
            userId,
            fromRank: decision.from,
            toRank: decision.to,
            reason: "QUALIFIED",
            isActive: true,
          })
          return Response.json({
            ok: true,
            promoted: true,
            from: persisted.from,
            to: persisted.to,
            idempotent: persisted.idempotent === true,
            checkoutEnabled: false,
          })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Rank promotion failed",
            checkoutEnabled: false,
          }, { status: 500 })
        }
      },
    },
  },
})
