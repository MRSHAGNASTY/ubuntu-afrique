/** Member network view from already-loaded Ubuntu rows. Checkout stays closed. */

import { countQualifiedLegs } from "./rankEngine.mjs"

const CLOSED_FLAGS = Object.freeze({
  checkoutEnabled: false,
  marketplaceEnabled: true,
  nftAssetsEnabled: false,
  nftListingEnabled: false,
  nftMarketplaceEnabled: false,
})

function asRank(value) {
  return String(value || "").toUpperCase()
}

function asId(value) {
  return value == null || value === "" ? "" : String(value)
}

/**
 * Page the already-loaded personal directs only.
 * Does not walk descendants or the rest of the genealogy.
 */
export function paginateDirects(directs, options) {
  const list = Array.isArray(directs) ? directs : []
  const pageSize = Math.min(100, Math.max(1, Number(options?.pageSize) || 25))
  const page = Math.max(1, Number(options?.page) || 1)
  const start = (page - 1) * pageSize
  return {
    items: list.slice(start, start + pageSize),
    page,
    pageSize,
    total: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / pageSize) || 1),
  }
}

export function buildSponsorSummary(row) {
  if (!row || !asId(row.userId || row.user_id || row.id)) return null
  return {
    userId: asId(row.userId || row.user_id || row.id),
    username: String(row.username || ""),
    email: String(row.email || ""),
    rank: asRank(row.rank || row.rank_code),
  }
}

export function buildDirectsList(rows) {
  const list = Array.isArray(rows) ? rows : []
  return list.map((row) => {
    const userId = asId(row.userId || row.user_id || row.id)
    const direct = {
      userId,
      username: String(row.username || ""),
      email: String(row.email || ""),
      rank: asRank(row.rank || row.rank_code),
    }
    if (Array.isArray(row.descendants)) {
      direct.descendants = row.descendants
    }
    return direct
  })
}

/**
 * Qualified legs from already-loaded personal directs.
 * Two ASMs under one personal leg still count as one (countQualifiedLegs).
 */
export function qualifiedLegsFromDirects(directs, requiredRank) {
  const rank = asRank(requiredRank || "ASM") || "ASM"
  return countQualifiedLegs(buildDirectsList(directs), rank)
}

/**
 * Sponsor summary + paginated directs from already-loaded rows.
 * Never recursively walks genealogy to satisfy a page request.
 */
export function buildNetworkTree(input) {
  const directs = buildDirectsList(input?.directRows)
  const paged = paginateDirects(directs, { page: input?.page, pageSize: input?.pageSize })
  const teamMemberCount = Number.isFinite(Number(input?.teamMemberCount))
    ? Number(input.teamMemberCount)
    : directs.length
  return {
    sponsor: buildSponsorSummary(input?.sponsorRow),
    directs: paged.items,
    pagination: paged,
    teamMemberCount,
    qualifiedLegs: qualifiedLegsFromDirects(directs, input?.requiredRank),
    currentRank: asRank(input?.currentRank) || "SSA",
    teamVolume: String(input?.teamVolume ?? "0"),
    ...CLOSED_FLAGS,
  }
}
