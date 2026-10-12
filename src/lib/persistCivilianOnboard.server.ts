import type { SupabaseClient } from "@supabase/supabase-js"
import {
  assertNoAureusOnboard,
  buildCivilianOnboard,
  resolveSponsorRef,
} from "./ubuntuOnboarding.mjs"

const MEMBER_SELECT =
  "id, email, username, is_active, pending_aureus_provision, aureus_user_id, auth_user_id, identity_source, sponsor_code"

function throwIf(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Ubuntu civilian onboard refused")
}

export async function resolveUbuntuSponsor(ubuntu: SupabaseClient, ref?: string | null) {
  const needle = String(ref || "").trim()
  if (!needle) return null
  if (/^\d+$/.test(needle)) {
    const { data, error } = await ubuntu.from("ua_users").select("id, username").eq("id", Number(needle)).maybeSingle()
    throwIf(error)
    if (data) return { id: String(data.id), username: String(data.username || "") }
  }
  const { data: exact, error: exactError } = await ubuntu
    .from("ua_users")
    .select("id, username")
    .eq("username", needle)
    .maybeSingle()
  throwIf(exactError)
  if (exact) return { id: String(exact.id), username: String(exact.username || "") }
  const { data: users, error: listError } = await ubuntu.from("ua_users").select("id, username")
  throwIf(listError)
  return resolveSponsorRef(needle, users || [])
}

export async function persistCivilianOnboard(
  ubuntu: SupabaseClient,
  input: {
    email: string
    username: string
    authUserId: string
    sponsorCode?: string | null
  }
) {
  assertNoAureusOnboard(input)
  const draft = buildCivilianOnboard({
    email: input.email,
    username: input.username,
    authUserId: input.authUserId,
    sponsorCode: input.sponsorCode,
  })

  const sponsor = await resolveUbuntuSponsor(ubuntu, draft.sponsorCode)
  if (draft.sponsorCode && !sponsor) {
    throw new Error("Ubuntu sponsor not found")
  }

  const byAuth = await ubuntu.from("ua_users").select(MEMBER_SELECT).eq("auth_user_id", draft.authUserId).maybeSingle()
  throwIf(byAuth.error)
  const byEmail = await ubuntu.from("ua_users").select(MEMBER_SELECT).eq("email", draft.email).maybeSingle()
  throwIf(byEmail.error)
  const byUsername = await ubuntu.from("ua_users").select(MEMBER_SELECT).eq("username", draft.username).maybeSingle()
  throwIf(byUsername.error)

  const existing = byAuth.data || byEmail.data || null
  if (existing?.aureus_user_id || existing?.identity_source === "aureus") {
    throw new Error("This email is already an Aureus-linked Ubuntu member. Sign in.")
  }
  if (byUsername.data && (!existing || Number(byUsername.data.id) !== Number(existing.id))) {
    throw new Error("Ubuntu username is already taken")
  }
  if (byEmail.data && byAuth.data && Number(byEmail.data.id) !== Number(byAuth.data.id)) {
    throw new Error("Ubuntu email is already taken")
  }

  let member = existing
  if (member) {
    const { data, error } = await ubuntu
      .from("ua_users")
      .update({
        email: draft.email,
        username: draft.username,
        sponsor_code: draft.sponsorCode,
        identity_source: "ubuntu",
        pending_aureus_provision: false,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id)
      .select(MEMBER_SELECT)
      .single()
    throwIf(error)
    member = data
  } else {
    const { data, error } = await ubuntu
      .from("ua_users")
      .insert({
        auth_user_id: draft.authUserId,
        email: draft.email,
        username: draft.username,
        sponsor_code: draft.sponsorCode,
        identity_source: "ubuntu",
        pending_aureus_provision: false,
        is_active: true,
      })
      .select(MEMBER_SELECT)
      .single()
    throwIf(error)
    member = data
  }

  if (sponsor) {
    if (String(sponsor.id) === String(member.id)) {
      throw new Error("Self-sponsor is refused")
    }
    const existingTree = await ubuntu
      .from("ua_sponsor_tree")
      .select("user_id, sponsor_id")
      .eq("user_id", member.id)
      .maybeSingle()
    throwIf(existingTree.error)
    if (!existingTree.data) {
      const { error: treeError } = await ubuntu.from("ua_sponsor_tree").insert({
        user_id: member.id,
        sponsor_id: Number(sponsor.id),
      })
      throwIf(treeError)
    }
  }

  const rank = await ubuntu.from("ua_user_ranks").select("rank_code").eq("user_id", member.id).maybeSingle()
  throwIf(rank.error)
  if (!rank.data) {
    const { error: rankError } = await ubuntu.from("ua_user_ranks").insert({
      user_id: member.id,
      rank_code: "SSA",
      updated_at: new Date().toISOString(),
    })
    throwIf(rankError)
  }

  return {
    userId: String(member.id),
    username: String(member.username),
    email: String(member.email),
    sponsorId: sponsor ? sponsor.id : null,
    identitySource: "ubuntu" as const,
    pendingAureusProvision: false,
    checkoutEnabled: false as const,
  }
}
