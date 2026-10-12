import type { SupabaseClient } from "@supabase/supabase-js"
import { applyRankPromotion } from "./rankEngine.mjs"

function promotionsTableMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = String(error.message || "")
  return (
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    error.code === "PGRST205" ||
    error.code === "42P01"
  )
}

export async function persistRankPromotion(
  ubuntu: SupabaseClient,
  input: {
    userId: string
    fromRank: string
    toRank: string
    reason?: string
    isActive: boolean
  }
) {
  const userId = String(input?.userId || "").trim()
  if (!userId) throw new Error("userId is required")
  if (input?.isActive !== true) throw new Error("Ubuntu user is not active")

  const decision = applyRankPromotion({
    currentRank: input.fromRank,
    qualifiedRank: input.toRank,
  })
  if (!decision.promoted) throw new Error("Rank promotion refused")

  const { data: stored, error: readError } = await ubuntu
    .from("ua_user_ranks")
    .select("rank_code")
    .eq("user_id", userId)
    .maybeSingle()
  if (readError) throw new Error(readError.message)

  const storedRank = stored?.rank_code ? String(stored.rank_code).toUpperCase() : ""
  if (storedRank === decision.to) {
    return { idempotent: true, from: decision.from, to: decision.to, promoted: false }
  }
  if (storedRank) {
    const againstStored = applyRankPromotion({ currentRank: storedRank, qualifiedRank: decision.to })
    if (!againstStored.promoted) throw new Error("Rank promotion refused")
  }

  const reason = String(input.reason || "").trim() || "QUALIFIED"
  const { error: upsertError } = await ubuntu.from("ua_user_ranks").upsert(
    {
      user_id: userId,
      rank_code: decision.to,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (upsertError) throw new Error(upsertError.message)

  const { error: historyError } = await ubuntu.from("ua_rank_history").insert({
    user_id: userId,
    rank_code: decision.to,
    reason,
  })
  if (historyError) throw new Error(historyError.message)

  const { error: promotionError } = await ubuntu.from("ua_rank_promotions").insert({
    user_id: userId,
    from_rank: decision.from,
    to_rank: decision.to,
    reason,
  })
  if (promotionError && !promotionsTableMissing(promotionError)) {
    throw new Error(promotionError.message)
  }

  const { persistNotificationQuiet } = await import("./persistNotification.server")
  const { notificationForRank } = await import("./notificationEngine.mjs")
  await persistNotificationQuiet(ubuntu, notificationForRank({
    userId,
    fromRank: decision.from,
    toRank: decision.to,
  }))

  return { idempotent: false, from: decision.from, to: decision.to, promoted: true }
}
