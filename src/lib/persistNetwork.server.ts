import type { SupabaseClient } from "@supabase/supabase-js"
import { buildNetworkTree } from "./networkTree.mjs"

/**
 * READ ONLY Ubuntu snapshot for the member network page.
 * Directs are ua_sponsor_tree rows where sponsor_id = userId (one level).
 * Downline depth is not walked. Never writes. Never touches Aureus.
 */
export async function loadNetworkSnapshot(
  ubuntu: SupabaseClient,
  userId: string | number,
  options?: { page?: number; pageSize?: number; requiredRank?: string }
) {
  const id = Number(userId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("userId must be an existing Ubuntu ua_users.id")
  }

  const { data: user, error: userError } = await ubuntu
    .from("ua_users")
    .select("id, username, email, is_active")
    .eq("id", id)
    .maybeSingle()
  if (userError) throw new Error(userError.message)
  if (!user) {
    throw new Error("Ubuntu user not found")
  }

  const { data: rankRow, error: rankError } = await ubuntu
    .from("ua_user_ranks")
    .select("rank_code")
    .eq("user_id", id)
    .maybeSingle()
  if (rankError) throw new Error(rankError.message)

  const { data: ownTree, error: ownTreeError } = await ubuntu
    .from("ua_sponsor_tree")
    .select("user_id, sponsor_id")
    .eq("user_id", id)
    .maybeSingle()
  if (ownTreeError) throw new Error(ownTreeError.message)

  let sponsorRow = null
  const sponsorId = ownTree?.sponsor_id ? Number(ownTree.sponsor_id) : 0
  if (Number.isInteger(sponsorId) && sponsorId > 0) {
    const { data: sponsorUser, error: sponsorUserError } = await ubuntu
      .from("ua_users")
      .select("id, username, email")
      .eq("id", sponsorId)
      .maybeSingle()
    if (sponsorUserError) throw new Error(sponsorUserError.message)
    const { data: sponsorRank, error: sponsorRankError } = await ubuntu
      .from("ua_user_ranks")
      .select("rank_code")
      .eq("user_id", sponsorId)
      .maybeSingle()
    if (sponsorRankError) throw new Error(sponsorRankError.message)
    sponsorRow = {
      userId: String(sponsorUser?.id || sponsorId),
      username: String(sponsorUser?.username || ""),
      email: String(sponsorUser?.email || ""),
      rank: String(sponsorRank?.rank_code || ""),
    }
  }

  const { data: legs, error: legsError } = await ubuntu
    .from("ua_sponsor_tree")
    .select("user_id, sponsor_id")
    .eq("sponsor_id", id)
  if (legsError) throw new Error(legsError.message)

  const directIds = (legs || [])
    .map((row) => Number(row.user_id))
    .filter((childId) => Number.isInteger(childId) && childId > 0)

  const usersById = new Map<string, { username: string; email: string }>()
  const ranksById = new Map<string, string>()
  if (directIds.length) {
    const { data: users, error: usersError } = await ubuntu
      .from("ua_users")
      .select("id, username, email")
      .in("id", directIds)
    if (usersError) throw new Error(usersError.message)
    for (const row of users || []) {
      usersById.set(String(row.id), {
        username: String(row.username || ""),
        email: String(row.email || ""),
      })
    }

    const { data: ranks, error: ranksError } = await ubuntu
      .from("ua_user_ranks")
      .select("user_id, rank_code")
      .in("user_id", directIds)
    if (ranksError) throw new Error(ranksError.message)
    for (const row of ranks || []) {
      ranksById.set(String(row.user_id), String(row.rank_code || ""))
    }
  }

  const { data: volumeRow, error: volumeError } = await ubuntu
    .from("ua_team_volume")
    .select("team_qv")
    .eq("user_id", String(id))
    .maybeSingle()
  if (volumeError) throw new Error(volumeError.message)

  const directRows = directIds.map((childId) => {
    const key = String(childId)
    const profile = usersById.get(key)
    return {
      userId: key,
      username: profile?.username || "",
      email: profile?.email || "",
      rank: ranksById.get(key) || "",
    }
  })

  const tree = buildNetworkTree({
    sponsorRow,
    directRows,
    teamMemberCount: (legs || []).length,
    currentRank: String(rankRow?.rank_code || "SSA"),
    teamVolume: String(volumeRow?.team_qv || "0"),
    page: options?.page,
    pageSize: options?.pageSize,
    requiredRank: options?.requiredRank,
  })

  return {
    userId: String(user.id),
    ...tree,
  }
}
