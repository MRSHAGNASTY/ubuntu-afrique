import { ubuntuDb } from "./supabase"

export async function ubuntuStaffToken() {
  if (typeof localStorage === "undefined") return ""
  const stored = localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || ""
  if (stored) return stored
  const { data } = await ubuntuDb.auth.getSession()
  return data.session?.access_token || ""
}

export async function ubuntuStaffHeaders(confirmSecret = "") {
  const token = await ubuntuStaffToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = "Bearer " + token
  const secret = String(confirmSecret || "").trim()
  if (secret) headers["x-ua-commerce-confirm"] = secret
  return headers
}

export function hasUbuntuRole(roles: string[] | undefined, required?: string) {
  const have = (roles || []).map((row) => String(row).toUpperCase())
  if (!required) return have.length > 0
  return have.includes(String(required).toUpperCase())
}

export async function loadUbuntuStaffMe() {
  const token = await ubuntuStaffToken()
  if (!token) {
    return { ok: false as const, status: 401, error: "Session required", roles: [] as string[] }
  }
  const res = await fetch("/api/admin/roles", { headers: { Authorization: "Bearer " + token } })
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean
    error?: string
    userId?: string
    username?: string
    email?: string
    roles?: string[]
  } | null
  return {
    ok: Boolean(json?.ok),
    status: res.status,
    error: json?.error || "",
    userId: json?.userId || "",
    username: json?.username || "",
    email: json?.email || "",
    roles: Array.isArray(json?.roles) ? json.roles : [],
  }
}

export async function gateUbuntuAdminPage(
  navigate: (opts: { to: "/auth/login" }) => void,
  requiredRole?: string
) {
  const me = await loadUbuntuStaffMe()
  if (me.status === 401 || !me.ok) {
    navigate({ to: "/auth/login" })
    return null
  }
  if (!hasUbuntuRole(me.roles, requiredRole)) {
    return {
      ...me,
      allowed: false as const,
      error: requiredRole
        ? "Ubuntu admin role required: " + requiredRole
        : "This account is not an administrator.",
    }
  }
  return { ...me, allowed: true as const, error: "" }
}
