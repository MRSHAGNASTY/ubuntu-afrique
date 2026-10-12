/** Ubuntu Afrique staging PSP. Verifies callbacks. Does not open checkout. Does not use Aureus PSP credentials. */
import { createHmac, timingSafeEqual } from "node:crypto"
import {
  assertPaymentCurrency,
  assertPaymentKind,
  assertPaymentMatchesOrder,
  recordPaymentEvent,
} from "./paymentAdapter.mjs"

export const UA_PSP_PROVIDER = "UA_PSP_STAGING"
export const AUREUS_PSP_REFUSED = "Refused. Ubuntu PSP will not use Aureus payment credentials."
export const AUREUS_PROD_REF = "fgubaqoftdeefcakejwu"
export const PSP_SIGNATURE_INVALID = "Ubuntu PSP signature is invalid"
export const PSP_SECRET_REQUIRED = "UA_PSP_WEBHOOK_SECRET is required"

function requiredText(value, field) {
  const text = String(value == null ? "" : value).trim()
  if (!text) throw new Error(field + " is required")
  return text
}

export function assertUbuntuPspSecret(secret) {
  const value = String(secret || "")
  if (!value.trim()) throw new Error(PSP_SECRET_REQUIRED)
  if (value.includes(AUREUS_PROD_REF) || value.includes("fgubaqoftdeefcakejwu")) {
    throw new Error(AUREUS_PSP_REFUSED)
  }
  if (/nowpayments|aureus[_-]?psp|nowp[_-]?ipn/i.test(value)) {
    throw new Error(AUREUS_PSP_REFUSED)
  }
  return value
}

export function canonicalPspPayload(input) {
  const kind = assertPaymentKind(input?.kind)
  return JSON.stringify({
    amount: String(input?.amount ?? "").trim(),
    currency: assertPaymentCurrency(input?.currency),
    kind,
    orderId: requiredText(input?.orderId, "orderId"),
    paymentId: requiredText(input?.paymentId, "paymentId"),
  })
}

export function signUbuntuPspWebhook(secret, payload) {
  const key = assertUbuntuPspSecret(secret)
  return createHmac("sha256", key).update(canonicalPspPayload(payload)).digest("hex")
}

function signaturesEqual(left, right) {
  const a = Buffer.from(String(left || ""), "utf8")
  const b = Buffer.from(String(right || ""), "utf8")
  if (a.length === 0 || a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function verifyUbuntuPspWebhook({ secret, signature, payload, order } = {}) {
  const key = assertUbuntuPspSecret(secret)
  const expected = signUbuntuPspWebhook(key, payload)
  if (!signaturesEqual(signature, expected)) {
    throw new Error(PSP_SIGNATURE_INVALID)
  }
  const event = recordPaymentEvent({
    orderId: payload?.orderId,
    kind: payload?.kind,
    paymentId: payload?.paymentId,
    amount: payload?.amount,
    currency: payload?.currency,
    provider: UA_PSP_PROVIDER,
    order,
  })
  if (order) {
    assertPaymentMatchesOrder(order, event.amount)
  }
  return {
    ...event,
    provider: UA_PSP_PROVIDER,
    checkoutEnabled: false,
  }
}

export function noteUbuntuPspWebhook(existing, incoming) {
  const event = verifyUbuntuPspWebhook(incoming)
  if (!existing) {
    return { idempotent: false, event, settlements: 0, checkoutEnabled: false }
  }
  if (String(existing.paymentId) !== event.paymentId) {
    throw new Error("payment_id is already recorded for a different Ubuntu payment")
  }
  if (String(existing.orderId) !== event.orderId || String(existing.kind) !== event.kind) {
    throw new Error("payment_id is already recorded for a different Ubuntu payment")
  }
  return { idempotent: true, event: existing, settlements: existing.settled === true ? 1 : 0, checkoutEnabled: false }
}

export function confirmRecordedPspPayment({ existing, order, paymentId, kind, confirm }) {
  const recorded = noteUbuntuPspWebhook(existing, {
    secret: existing?.secret,
    signature: existing?.signature,
    payload: existing?.payload || existing,
    order,
  })
  if (recorded.event.settled === true) {
    return { idempotent: true, settlements: 1, checkoutEnabled: false, order: recorded.event.order }
  }
  const paid = confirm({
    order,
    paymentId: paymentId || recorded.event.paymentId,
    kind: kind || recorded.event.kind,
  })
  return { idempotent: false, settlements: 1, checkoutEnabled: false, order: paid }
}
