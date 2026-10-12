import { ubuntu } from "./ubuntuDb"

export function readStoredMemberToken() {
  if (typeof localStorage === "undefined") return ""
  return localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || ""
}

export async function resolveMemberToken() {
  const stored = readStoredMemberToken()
  if (stored) return stored
  const { data } = await ubuntu.auth.getSession()
  return data.session?.access_token || ""
}
