/** Named Ubuntu public CARD checkout. Marketplace and NFT stay closed. */

export const NAMED_OPEN_SENTENCE = "open Ubuntu public CARD checkout"
export const CARD_PUBLIC_CHECKOUT = true

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
]

export function publicCheckoutFlags() {
  return {
    cardCheckoutEnabled: CARD_PUBLIC_CHECKOUT === true,
    fractionCheckoutEnabled: true,
    marketplaceEnabled: true,
    nftMarketplaceEnabled: false,
    checkoutEnabled: CARD_PUBLIC_CHECKOUT === true,
    purchaseOpen: "CARD",
  }
}

export function assertCardPublicCheckoutNamed() {
  if (CARD_PUBLIC_CHECKOUT !== true) {
    throw new Error("Public checkout is not open")
  }
  return true
}

export function assertPublicCardKind(kind) {
  if (kind == null || String(kind).trim() === "") return true
  if (String(kind).toUpperCase() !== "CARD") {
    throw new Error("Public checkout is open for CARD only")
  }
  return true
}

export function rejectPublicCardClientOverrides(body) {
  const input = body && typeof body === "object" ? body : {}
  if (Array.isArray(input.members) && input.members.length) {
    throw new Error("Client-supplied rank chains are rejected")
  }
  for (const key of CLIENT_OVERRIDES) {
    if (key === "member") continue
    if (input[key] != null && String(input[key]).trim() === "") continue
    if (input[key] != null && String(input[key]).trim() !== "") {
      throw new Error(key + " is taken from the Ubuntu book, not the client")
    }
  }
  return true
}

export function publicCardOrderResponse({ order, persisted, idempotent }) {
  return {
    ok: true,
    kind: "CARD",
    order: {
      id: String(order.id),
      kind: "CARD",
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
