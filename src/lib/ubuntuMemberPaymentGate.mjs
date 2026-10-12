/** Named Ubuntu member payment gate for CARD, FRACTION, and MARKETPLACE. NFT stays closed. */

import { signUbuntuPspWebhook, UA_PSP_PROVIDER } from "./ubuntuPsp.mjs"
import { formatMoney2, parseMoney } from "./money.mjs"

export const NAMED_OPEN_SENTENCE = "open Ubuntu member payment gate for CARD and FRACTION"
export const MEMBER_PAYMENT_GATE = true

const CLIENT_OVERRIDES = ["amount", "total", "currency", "members", "remainingUnderlying", "aureusSharePrice", "aureusPhase"]

export function memberPaymentGateFlags() {
  return {
    memberPaymentGateEnabled: MEMBER_PAYMENT_GATE === true,
    cardCheckoutEnabled: true,
    fractionCheckoutEnabled: true,
    marketplaceEnabled: true,
    nftMarketplaceEnabled: false,
    checkoutEnabled: MEMBER_PAYMENT_GATE === true,
    purchaseOpen: "CARD,FRACTION,MARKETPLACE",
    provider: UA_PSP_PROVIDER,
  }
}

export function assertMemberPaymentGateNamed() {
  if (MEMBER_PAYMENT_GATE !== true) {
    throw new Error("Member payment gate is not open")
  }
  return true
}

export function assertMemberPaymentKind(kind) {
  const value = String(kind || "").toUpperCase()
  if (value !== "CARD" && value !== "FRACTION" && value !== "MARKETPLACE") {
    throw new Error("Member payment gate is open for CARD, FRACTION, and MARKETPLACE only")
  }
  return value
}

export function rejectMemberPaymentClientOverrides(body) {
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

export function bookPaymentAmount(total) {
  return formatMoney2(parseMoney(total))
}

export function signMemberPaymentTicket(secret, { paymentId, orderId, kind, amount }) {
  return signUbuntuPspWebhook(secret, {
    paymentId,
    orderId,
    kind: assertMemberPaymentKind(kind),
    amount: bookPaymentAmount(amount),
    currency: "USD",
  })
}

export function memberPaymentInitiateResponse({ paymentId, orderId, kind, amount, signature }) {
  const flags = memberPaymentGateFlags()
  return {
    ok: true,
    kind: assertMemberPaymentKind(kind),
    orderId: String(orderId),
    paymentId: String(paymentId),
    amount: bookPaymentAmount(amount),
    currency: "USD",
    signature: String(signature),
    provider: UA_PSP_PROVIDER,
    next: "complete",
    ...flags,
  }
}

export function memberPaymentCompleteResponse({ order, paymentId, settled, idempotent }) {
  return {
    ok: true,
    kind: String(order.kind || ""),
    order: {
      id: String(order.id),
      kind: String(order.kind || ""),
      status: String(order.status || "PAID"),
      total: String(order.total || ""),
      paymentId: String(paymentId),
    },
    settled: settled === true,
    idempotent: idempotent === true,
    provider: UA_PSP_PROVIDER,
    ...memberPaymentGateFlags(),
  }
}
