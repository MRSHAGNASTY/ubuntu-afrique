/** Named Ubuntu public FRACTION checkout. Marketplace and NFT stay closed. */

export const NAMED_OPEN_SENTENCE = "open Ubuntu public FRACTION checkout"
export const FRACTION_PUBLIC_CHECKOUT = true

const CLIENT_OVERRIDES = [
  "userId",
  "sponsorId",
  "sponsor_id",
  "member",
  "orderId",
  "priceVersionId",
  "priceVersion",
  "retailPrice",
  "unitPrice",
  "remainingUnderlying",
  "aureusSharePrice",
  "aureusPhase",
]

export function publicFractionCheckoutFlags() {
  return {
    cardCheckoutEnabled: true,
    fractionCheckoutEnabled: FRACTION_PUBLIC_CHECKOUT === true,
    marketplaceEnabled: true,
    nftMarketplaceEnabled: false,
    checkoutEnabled: FRACTION_PUBLIC_CHECKOUT === true,
    purchaseOpen: "FRACTION",
  }
}

export function assertFractionPublicCheckoutNamed() {
  if (FRACTION_PUBLIC_CHECKOUT !== true) {
    throw new Error("Public checkout is not open")
  }
  return true
}

export function assertPublicFractionKind(kind) {
  if (kind == null || String(kind).trim() === "") return true
  if (String(kind).toUpperCase() !== "FRACTION") {
    throw new Error("Public checkout is open for FRACTION only")
  }
  return true
}

export function rejectPublicFractionClientOverrides(body) {
  const input = body && typeof body === "object" ? body : {}
  if (Array.isArray(input.members) && input.members.length) {
    throw new Error("Client-supplied rank chains are rejected")
  }
  for (const key of CLIENT_OVERRIDES) {
    if (key === "member") continue
    if (input[key] != null && String(input[key]).trim() !== "") {
      throw new Error(key + " is taken from the Ubuntu book, not the client")
    }
  }
  return true
}

export function publicFractionOrderResponse({ order, persisted, idempotent }) {
  return {
    ok: true,
    kind: "FRACTION",
    order: {
      id: String(order.id),
      kind: "FRACTION",
      productId: String(order.productId),
      quantity: Number(order.quantity),
      total: String(order.total),
      status: String(order.status),
    },
    persisted: persisted === true,
    idempotent: idempotent === true,
    checkoutEnabled: true,
    cardCheckoutEnabled: true,
    fractionCheckoutEnabled: true,
    marketplaceEnabled: true,
    nftMarketplaceEnabled: false,
  }
}
