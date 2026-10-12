/** Ubuntu Afrique UAT gate 1. Refuses Aureus. Does not open checkout or write money. */
export const AUREUS_PROD_REF = "fgubaqoftdeefcakejwu"
export const UBUNTU_REF = "rbyipalrasawbjpsppgu"
export const UAT_REFUSED = "Refused. Ubuntu UAT will not connect to Aureus production."

export const PUBLIC_CHECKOUT_PATHS = [
  "/api/cards/order",
  "/api/fractions/order",
  "/api/marketplace/order",
  "/api/marketplace/media",
  "/api/nft/order",
  "/api/nft/listings",
]

export const OPEN_PUBLIC_CHECKOUT_PATHS = ["/api/cards/order", "/api/fractions/order", "/api/marketplace/order"]
export const CLOSED_PUBLIC_CHECKOUT_PATHS = PUBLIC_CHECKOUT_PATHS.filter((path) => !OPEN_PUBLIC_CHECKOUT_PATHS.includes(path))

export const REQUIRED_FLAGS_OFF = [
  "nft_assets_enabled",
  "nft_listing_enabled",
  "nft_marketplace_enabled",
]

export function assertUbuntuUatTarget(url) {
  const target = String(url || "")
  if (!target) throw new Error("Ubuntu Afrique UAT target is required")
  if (target.includes(AUREUS_PROD_REF) || target.includes("fgubaqoftdeefcakejwu")) {
    throw new Error(UAT_REFUSED)
  }
  return target
}

export function planUbuntuUat(url) {
  const target = assertUbuntuUatTarget(url)
  return {
    target,
    checkoutEnabled: false,
    cardCheckoutEnabled: true,
    fractionCheckoutEnabled: true,
    marketplaceCheckoutEnabled: true,
    nftMarketplaceEnabled: false,
    withDataFromProduction: false,
    writesFinancialRows: false,
    steps: [
      "Refuse Aureus production",
      "Take Ubuntu database dump",
      "Confirm NFT flags remain false",
      "CARD public checkout is named-open",
      "FRACTION public checkout is named-open",
      "Marketplace public checkout is named-open",
      "Confirm NFT public order route stays 403",
      "Do not enable NFT flags",
    ],
  }
}

export function assertUatFlags(flags) {
  const missing = REQUIRED_FLAGS_OFF.filter((key) => String(flags?.[key] ?? "") !== "false")
  if (missing.length) {
    throw new Error("UAT flags must stay false: " + missing.join(", "))
  }
  return true
}

export function assertClosedCheckoutResponse(status, body) {
  if (status !== 403) throw new Error("Public checkout must stay 403")
  if (!body || body.checkoutEnabled !== false) throw new Error("checkoutEnabled must stay false")
  return true
}