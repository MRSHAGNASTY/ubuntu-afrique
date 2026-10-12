import type { SupabaseClient } from "@supabase/supabase-js"
import {
  assignAdminRole,
  buildAdminAudit,
  reviewKycProfile,
  submitKycProfile,
} from "./ubuntuKyc.mjs"
import { loadUbuntuUser } from "./ubuntuServer.server"

function mapKyc(row: {
  user_id: unknown
  status: unknown
  full_name: unknown
  country: unknown
  reason: unknown
  submitted_at: unknown
  reviewed_at: unknown
  reviewer_user_id: unknown
}) {
  return {
    userId: String(row.user_id),
    status: String(row.status),
    fullName: String(row.full_name),
    country: String(row.country),
    reason: row.reason == null ? null : String(row.reason),
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewerUserId: row.reviewer_user_id == null ? null : String(row.reviewer_user_id),
    checkoutEnabled: false as const,
  }
}

export async function persistAdminAudit(
  ubuntu: SupabaseClient,
  input: {
    actorUserId?: string | null
    actorVia: string
    action: string
    targetType: string
    targetId?: string | null
    detail?: string | null
  }
) {
  const audit = buildAdminAudit(input)
  const { error } = await ubuntu.from("ua_admin_audit_log").insert({
    actor_user_id: audit.actorUserId ? Number(audit.actorUserId) : null,
    actor_via: audit.actorVia,
    action: audit.action,
    target_type: audit.targetType,
    target_id: audit.targetId,
    detail: audit.detail,
  })
  if (error) throw new Error(error.message)
  return audit
}

export async function loadKycProfile(ubuntu: SupabaseClient, userId: string | number) {
  await loadUbuntuUser(ubuntu, userId)
  const { data, error } = await ubuntu
    .from("ua_kyc_profiles")
    .select("user_id, status, full_name, country, reason, submitted_at, reviewed_at, reviewer_user_id")
    .eq("user_id", Number(userId))
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return mapKyc(data)
}

export async function persistKycSubmit(
  ubuntu: SupabaseClient,
  input: { userId: string | number; fullName: string; country: string; status?: unknown }
) {
  const submitted = submitKycProfile(input)
  await loadUbuntuUser(ubuntu, submitted.userId)
  const existing = await loadKycProfile(ubuntu, submitted.userId)
  if (existing?.status === "COMPLETED") {
    throw new Error("Completed Ubuntu KYC cannot be resubmitted")
  }
  const row = {
    user_id: Number(submitted.userId),
    status: "PENDING",
    full_name: submitted.fullName,
    country: submitted.country,
    reason: null,
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    reviewer_user_id: null,
    updated_at: new Date().toISOString(),
  }
  const { error } = existing
    ? await ubuntu.from("ua_kyc_profiles").update(row).eq("user_id", Number(submitted.userId))
    : await ubuntu.from("ua_kyc_profiles").insert(row)
  if (error) throw new Error(error.message)
  return loadKycProfile(ubuntu, submitted.userId)
}

export async function persistKycReview(
  ubuntu: SupabaseClient,
  input: {
    userId: string | number
    decision: string
    reason?: string
    reviewerUserId?: string | null
    actorVia: string
  }
) {
  const current = await loadKycProfile(ubuntu, input.userId)
  if (!current) throw new Error("Ubuntu KYC profile not found")
  const reviewed = reviewKycProfile({
    userId: input.userId,
    currentStatus: current.status,
    decision: input.decision,
    reason: input.reason,
    reviewerUserId: input.reviewerUserId,
  })
  const { error } = await ubuntu.from("ua_kyc_profiles").update({
    status: reviewed.status,
    reason: reviewed.reason,
    reviewed_at: new Date().toISOString(),
    reviewer_user_id: reviewed.reviewerUserId ? Number(reviewed.reviewerUserId) : null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", Number(reviewed.userId))
  if (error) throw new Error(error.message)
  await persistAdminAudit(ubuntu, {
    actorUserId: reviewed.reviewerUserId,
    actorVia: input.actorVia,
    action: "KYC_" + reviewed.status,
    targetType: "ua_kyc_profiles",
    targetId: reviewed.userId,
    detail: reviewed.reason,
  })
  const { persistNotificationQuiet } = await import("./persistNotification.server")
  const { notificationForKycReview } = await import("./notificationEngine.mjs")
  await persistNotificationQuiet(ubuntu, notificationForKycReview({
    userId: reviewed.userId,
    status: reviewed.status,
  }))
  return loadKycProfile(ubuntu, reviewed.userId)
}

export async function loadAdminRoles(ubuntu: SupabaseClient, userId: string | number) {
  const { data, error } = await ubuntu
    .from("ua_admin_roles")
    .select("role")
    .eq("user_id", Number(userId))
  if (error) throw new Error(error.message)
  return (data || []).map((row) => String(row.role).toUpperCase())
}

export async function persistAdminRoleAssign(
  ubuntu: SupabaseClient,
  input: { userId: string | number; role: string; grantedByUserId?: string | null; actorVia: string }
) {
  const assigned = assignAdminRole(input)
  await loadUbuntuUser(ubuntu, assigned.userId)
  const { error } = await ubuntu.from("ua_admin_roles").upsert({
    user_id: Number(assigned.userId),
    role: assigned.role,
    granted_by_user_id: assigned.grantedByUserId ? Number(assigned.grantedByUserId) : null,
  }, { onConflict: "user_id,role" })
  if (error) throw new Error(error.message)
  await persistAdminAudit(ubuntu, {
    actorUserId: assigned.grantedByUserId,
    actorVia: input.actorVia,
    action: "ROLE_GRANT",
    targetType: "ua_admin_roles",
    targetId: assigned.userId,
    detail: assigned.role,
  })
  return { userId: assigned.userId, role: assigned.role, checkoutEnabled: false as const }
}
