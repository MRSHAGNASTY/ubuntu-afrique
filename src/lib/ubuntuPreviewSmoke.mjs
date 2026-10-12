/** Ubuntu Afrique preview smoke list. Orchestrator checklist only. Not Day 30. Not production. */

export const PREVIEW_COMPLETE = true
export const PRODUCTION_COMPLETE = false

export const PREVIEW_SMOKE = Object.freeze([
  { id: "login", path: "/auth/login", kind: "page" },
  { id: "network", path: "/dashboard/network", kind: "page" },
  { id: "wallet", path: "/dashboard/wallet", kind: "page" },
  { id: "kyc", path: "/dashboard/kyc", kind: "page" },
  { id: "cardQuote", path: "/dashboard/cards", kind: "page" },
  { id: "fractionQuote", path: "/dashboard/invest", kind: "page" },
  { id: "marketplaceOrder", path: "/api/marketplace/order", kind: "api", expectStatus: 401 },
  { id: "nftOrder", path: "/api/nft/order", kind: "api", expectStatus: 403 },
])

export function previewSmokeIds() {
  return PREVIEW_SMOKE.map((row) => row.id)
}

export function previewSmokeClosedApis() {
  return PREVIEW_SMOKE.filter((row) => row.expectStatus === 403).map((row) => row.path)
}
