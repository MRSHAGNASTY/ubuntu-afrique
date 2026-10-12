import { authorizeUbuntuAdmin } from "./ubuntuKyc.mjs"
import { verifyUaSession } from "./uaSession.server"
import { getUbuntuServerClient } from "./ubuntuServer.server"
import { resolveUbuntuMember } from "./persistMemberLedger.server"
import { loadAdminRoles } from "./persistKyc.server"

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || ""
  return header.startsWith("Bearer ") ? header.slice(7) : ""
}

export function secretMatches(request: Request, body: Record<string, unknown> = {}) {
  const expected = String(process.env.UA_COMMERCE_CONFIRM_SECRET || "")
  if (!expected) return { configured: false, ok: false }
  const header = request.headers.get("x-ua-commerce-confirm") || ""
  const fromBody = String(body.confirmSecret || "")
  const url = new URL(request.url)
  const fromQuery = String(url.searchParams.get("confirmSecret") || "")
  return { configured: true, ok: header === expected || fromBody === expected || fromQuery === expected }
}

export async function resolveUbuntuStaffSession(request: Request) {
  let ubuntu
  try {
    ubuntu = getUbuntuServerClient()
  } catch (err) {
    return { ok: false as const, status: 500, error: err instanceof Error ? err.message : "Ubuntu read refused" }
  }
  if (!ubuntu) {
    return { ok: false as const, status: 503, error: "Ubuntu Afrique database is not configured" }
  }

  const token = bearerToken(request)
  if (!token) {
    return { ok: false as const, status: 401, error: "Session required" }
  }

  let member = null
  try {
    const session = verifyUaSession(token)
    member = await resolveUbuntuMember(ubuntu, { email: session.email, aureusUserId: session.aureusUserId })
  } catch {
    const { data, error } = await ubuntu.auth.getUser(token)
    if (error || !data.user) {
      return { ok: false as const, status: 401, error: "Invalid session" }
    }
    member = await resolveUbuntuMember(ubuntu, { authUserId: data.user.id, email: data.user.email || "" })
  }
  if (!member) {
    return { ok: false as const, status: 403, error: "Ubuntu admin member not found" }
  }

  const roles = await loadAdminRoles(ubuntu, member.id)
  return {
    ok: true as const,
    status: 200,
    ubuntu,
    actorUserId: String(member.id),
    username: String(member.username || ""),
    email: String(member.email || ""),
    roles,
  }
}

export async function authorizeUbuntuStaff(
  request: Request,
  body: Record<string, unknown>,
  requiredRole: string | null
) {
  const secret = secretMatches(request, body)
  if (!secret.configured && requiredRole == null) {
    return { ok: false as const, status: 503, error: "UA_COMMERCE_CONFIRM_SECRET is not configured" }
  }
  if (secret.ok) {
    return { ok: true as const, via: "secret" as const, actorUserId: null as string | null, ubuntu: getUbuntuClient() }
  }
  if (requiredRole == null) {
    return { ok: false as const, status: 401, error: "Confirm secret required" }
  }

  const session = await resolveUbuntuStaffSession(request)
  if (!session.ok) {
    return { ok: false as const, status: session.status, error: session.error }
  }

  try {
    authorizeUbuntuAdmin({ secretOk: false, roles: session.roles, requiredRole })
  } catch (err) {
    return { ok: false as const, status: 403, error: err instanceof Error ? err.message : "Ubuntu admin role required" }
  }
  return { ok: true as const, via: "role" as const, actorUserId: session.actorUserId, ubuntu: session.ubuntu }
}

function getUbuntuClient() {
  try {
    return getUbuntuServerClient()
  } catch {
    return null
  }
}
