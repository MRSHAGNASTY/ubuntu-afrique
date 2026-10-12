/** Named Ubuntu public marketplace checkout. NFT stays closed. */

export const NAMED_OPEN_SENTENCE = "enable Ubuntu marketplace_enabled"
export const MARKETPLACE_PUBLIC_CHECKOUT = true

const CLIENT_OVERRIDES = [
  "amount",
  "total",
  "retailPrice",
  "companyPayout",
  "commissionableValue",
  "qv",
  "gapSchedule",
  "members",
  "userId",
  "sponsorId",
]

export function publicMarketplaceFlags() {
  return {
    marketplaceEnabled: MARKETPLACE_PUBLIC_CHECKOUT === true,
    nftMarketplaceEnabled: false,
    checkoutEnabled: MARKETPLACE_PUBLIC_CHECKOUT === true,
    cardCheckoutEnabled: true,
    fractionCheckoutEnabled: true,
    purchaseOpen: "CARD,FRACTION,MARKETPLACE",
  }
}

export function assertMarketplacePublicCheckoutNamed() {
  if (MARKETPLACE_PUBLIC_CHECKOUT !== true) {
    throw new Error("Public marketplace checkout is not open")
  }
  return true
}

export function rejectPublicMarketplaceClientOverrides(body) {
  const input = body && typeof body === "object" ? body : {}
  if (Array.isArray(input.members) && input.members.length) {
    throw new Error("Client-supplied rank chains are rejected")
  }
  for (const key of CLIENT_OVERRIDES) {
    if (key === "members") continue
    if (input[key] != null && String(input[key]).trim() !== "") {
      throw new Error(key + " is taken from the Ubuntu book, not the client")
    }
  }
  return true
}

export function publicMarketplaceOrderResponse({ order, persisted, idempotent }) {
  return {
    ok: true,
    kind: "MARKETPLACE",
    order: {
      id: String(order.id),
      kind: "MARKETPLACE",
      productId: String(order.productId),
      companyId: String(order.companyId),
      total: String(order.retailPrice),
      status: String(order.status || "PENDING_PAYMENT"),
    },
    persisted: persisted === true,
    idempotent: idempotent === true,
    ...publicMarketplaceFlags(),
  }
}