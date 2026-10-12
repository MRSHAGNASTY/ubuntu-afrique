/** Ubuntu Afrique Paystack PSP. Does not use Aureus credentials. NFT stays closed. */
import { createHmac, timingSafeEqual } from "node:crypto"
import { formatMoney2, parseMoney } from "./money.mjs"
import { assertPaymentCurrency, assertPaymentKind, recordPaymentEvent } from "./paymentAdapter.mjs"

export const UA_PAYSTACK_PROVIDER = "PAYSTACK"
export const UA_PAYSTACK_NAMED = "Wave X Paystack"
export const AUREUS_PSP_REFUSED = "Refused. Ubuntu PSP will not use Aureus payment credentials."
export const PAYSTACK_SECRET_REQUIRED = "UA_PAYSTACK_SECRET_KEY is required"
export const PAYSTACK_SIGNATURE_INVALID = "Paystack signature is invalid"
export const PAYSTACK_CHARGE_REQUIRED = "Paystack charge.success is required"

const CENT_FACTOR = 1000000n

function requiredText(value, field) {
  const text = String(value == null ? "" : value).trim()
  if (!text) throw new Error(field + " is required")
  return text
}

export function assertUbuntuPaystackSecret(secret) {
  const value = String(secret || "")
  if (!value.trim()) throw new Error(PAYSTACK_SECRET_REQUIRED)
  if (value.includes("fgubaqoftdeefcakejwu")) {
    throw new Error(AUREUS_PSP_REFUSED)
  }
  if (/nowpayments|aureus[_-]?psp|nowp[_-]?ipn|shopify/i.test(value)) {
    throw new Error(AUREUS_PSP_REFUSED)
  }
  return value
}

export function paystackConfigured(env = process.env) {
  return Boolean(String(env?.UA_PAYSTACK_SECRET_KEY || "").trim())
}

export function usdToPaystackAmount(usd) {
  const scaled = parseMoney(usd)
  if (scaled <= 0n) throw new Error("Paystack amount must be positive")
  if (scaled % CENT_FACTOR !== 0n) throw new Error("Paystack amount must be whole cents")
  return Number(scaled / CENT_FACTOR)
}

export function paystackAmountToUsd(cents) {
  const value = Number(cents)
  if (!Number.isInteger(value) || value <= 0) throw new Error("Paystack amount is invalid")
  return formatMoney2(BigInt(value) * CENT_FACTOR)
}

function signaturesEqual(left, right) {
  const a = Buffer.from(String(left || ""), "utf8")
  const b = Buffer.from(String(right || ""), "utf8")
  if (a.length === 0 || a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function signPaystackWebhook(secret, rawBody) {
  const key = assertUbuntuPaystackSecret(secret)
  return createHmac("sha512", key).update(String(rawBody || ""), "utf8").digest("hex")
}

export function verifyPaystackSignature(secret, rawBody, signature) {
  const expected = signPaystackWebhook(secret, rawBody)
  if (!signaturesEqual(signature, expected)) {
    throw new Error(PAYSTACK_SIGNATURE_INVALID)
  }
  return true
}

export function buildPaystackInitializeBody({ email, amount, kind, orderId, paymentId, callbackUrl }) {
  const normalizedKind = assertPaymentKind(kind)
  return {
    email: requiredText(email, "email"),
    amount: usdToPaystackAmount(amount),
    currency: "USD",
    reference: requiredText(paymentId, "paymentId"),
    callback_url: requiredText(callbackUrl, "callbackUrl"),
    metadata: {
      orderId: requiredText(orderId, "orderId"),
      kind: normalizedKind,
      paymentId: requiredText(paymentId, "paymentId"),
    },
  }
}

export function assertPaystackInitializeResponse(json) {
  if (json?.status !== true || !json?.data?.authorization_url || !json?.data?.reference) {
    throw new Error(String(json?.message || "Paystack initialize failed"))
  }
  const url = String(json.data.authorization_url)
  if (/shopify|fgubaqoftdeefcakejwu|nowpayments/i.test(url)) {
    throw new Error(AUREUS_PSP_REFUSED)
  }
  return {
    authorizationUrl: url,
    reference: String(json.data.reference),
    provider: UA_PAYSTACK_PROVIDER,
  }
}

export function parsePaystackChargeSuccess(body) {
  const eventName = String(body?.event || "charge.success")
  if (eventName !== "charge.success") {
    throw new Error(PAYSTACK_CHARGE_REQUIRED)
  }
  const data = body?.data && typeof body.data === "object" ? body.data : body
  if (String(data?.status || "").toLowerCase() !== "success") {
    throw new Error(PAYSTACK_CHARGE_REQUIRED)
  }
  const currency = assertPaymentCurrency(data.currency)
  const meta = data.metadata && typeof data.metadata === "object" ? data.metadata : {}
  const kind = assertPaymentKind(meta.kind || meta.Kind)
  const orderId = requiredText(meta.orderId || meta.order_id, "orderId")
  const paymentId = requiredText(data.reference || meta.paymentId, "paymentId")
  const amount = paystackAmountToUsd(data.amount)
  return recordPaymentEvent({
    orderId,
    kind,
    paymentId,
    amount,
    currency,
    provider: UA_PAYSTACK_PROVIDER,
    order: { id: orderId, total: amount, kind },
  })
}

export function assertPaystackVerifyResponse(json) {
  if (json?.status !== true || !json?.data) {
    throw new Error(String(json?.message || "Paystack verify failed"))
  }
  return parsePaystackChargeSuccess({ event: "charge.success", data: json.data })
}

export function ubuntuOrderTable(kind) {
  const value = assertPaymentKind(kind)
  if (value === "CARD") {
    return { table: "ua_card_orders", statusField: "order_status", totalField: "total", ownerField: "user_id" }
  }
  if (value === "FRACTION") {
    return { table: "ua_fraction_transactions", statusField: "transaction_status", totalField: "total_amount", ownerField: "buyer_id" }
  }
  return { table: "ua_marketplace_orders", statusField: "status", totalField: "retail_price", ownerField: "user_id" }
}
