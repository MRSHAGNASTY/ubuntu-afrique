/** Ubuntu Afrique civilian onboarding. Sister book only. Does not write Aureus. */

export const AUREUS_ONBOARD_REFUSED =
  "Civilian onboard refuses Aureus writes. Ubuntu ua_users and ua_sponsor_tree only."
export const RESERVED_CIVILIAN_USERNAME = "AA777"

export function assertNoAureusOnboard(input) {
  if (!input || typeof input !== "object") return true
  for (const key of ["aureusUserId", "aureus_user_id", "aureusKycId", "user_projects"]) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      throw new Error(AUREUS_ONBOARD_REFUSED)
    }
  }
  return true
}

export function normalizeCivilianEmail(value) {
  const email = String(value || "").trim().toLowerCase()
  if (!email || !email.includes("@")) {
    throw new Error("email is required")
  }
  return email
}

export function normalizeCivilianUsername(value) {
  const username = String(value || "").trim()
  if (!username) throw new Error("username is required")
  if (username.toUpperCase() === RESERVED_CIVILIAN_USERNAME) {
    throw new Error("Civilian register is for new Ubuntu users, not AA777")
  }
  if (!/^[a-zA-Z0-9_]{3,40}$/.test(username)) {
    throw new Error("username must be 3-40 letters, numbers, or underscore")
  }
  return username
}

export function resolveSponsorRef(ref, users) {
  const needle = String(ref || "").trim()
  if (!needle) return null
  const list = Array.isArray(users) ? users : []
  if (/^\d+$/.test(needle)) {
    const byId = list.find((row) => String(row.id) === needle)
    if (byId) return { id: String(byId.id), username: String(byId.username || "") }
  }
  const lower = needle.toLowerCase()
  const byName = list.find((row) => String(row.username || "").toLowerCase() === lower)
  if (byName) return { id: String(byName.id), username: String(byName.username || "") }
  throw new Error("Ubuntu sponsor not found")
}

export function buildCivilianOnboard(input) {
  assertNoAureusOnboard(input)
  const email = normalizeCivilianEmail(input?.email)
  const username = normalizeCivilianUsername(input?.username)
  const authUserId = String(input?.authUserId || "").trim()
  if (!authUserId) throw new Error("authUserId is required")
  const sponsorId = input?.sponsorId == null || input?.sponsorId === "" ? null : String(input.sponsorId)
  const userId = input?.userId == null || input?.userId === "" ? null : String(input.userId)
  if (sponsorId && userId && sponsorId === userId) {
    throw new Error("Self-sponsor is refused")
  }
  return {
    email,
    username,
    authUserId,
    identitySource: "ubuntu",
    pendingAureusProvision: false,
    aureusUserId: null,
    sponsorId,
    sponsorCode: input?.sponsorCode == null ? null : String(input.sponsorCode).trim() || null,
    isActive: true,
    checkoutEnabled: false,
  }
}

export function firstRunPath() {
  return {
    login: "/auth/login",
    dashboard: "/dashboard",
    kyc: "/dashboard/kyc",
    cards: "/dashboard/cards",
    invest: "/dashboard/invest",
    kycGatesPay: false,
  }
}
