/** Ubuntu Afrique staging payment observation. Does not confirm payment. */

import { compareMoney, formatMoney, formatMoney2, parseMoney } from "./money.mjs"

const PAYMENT_TOTAL_MISMATCH = "Payment amount must match the Ubuntu price-version total"
export const RECORDED_PAYMENT_REQUIRED = "Recorded payment event is required"
export const PAYMENT_EVENT_MISMATCH = "Recorded payment event does not match the Ubuntu order"
export const PAYMENT_CURRENCY_MISMATCH = "Payment currency must be USD"
export const ALLOWED_PAYMENT_CURRENCY = "USD"

function canonicalAmount(input) {
  const scaled = parseMoney(input)
  const two = formatMoney2(scaled)
  if (compareMoney(parseMoney(two), scaled) === 0) return two
  return formatMoney(scaled)
}

export function assertPaymentMatchesOrder(order, paidAmount) {
  if (!order || order.total == null || String(order.total).trim() === "") {
    throw new Error(PAYMENT_TOTAL_MISMATCH)
  }
  let expected
  let paid
  try {
    expected = parseMoney(order.total)
    paid = parseMoney(paidAmount)
  } catch {
    throw new Error(PAYMENT_TOTAL_MISMATCH)
  }
  if (compareMoney(paid, expected) !== 0) {
    throw new Error(PAYMENT_TOTAL_MISMATCH)
  }
}

export function assertPaymentCurrency(currency) {
  if (currency == null || String(currency).trim() === "") return ALLOWED_PAYMENT_CURRENCY
  const value = String(currency).trim().toUpperCase()
  if (value !== ALLOWED_PAYMENT_CURRENCY) {
    throw new Error(PAYMENT_CURRENCY_MISMATCH)
  }
  return value
}

export function assertRecordedPaymentForConfirm({ event, order, paymentId, kind } = {}) {
  if (!event) {
    throw new Error(RECORDED_PAYMENT_REQUIRED)
  }
  const status = String(event.status || "").toUpperCase()
  if (status !== "RECORDED" && status !== "CONFIRMED") {
    throw new Error(RECORDED_PAYMENT_REQUIRED)
  }
  if (String(event.paymentId || "").trim() !== String(paymentId || "").trim()) {
    throw new Error(PAYMENT_EVENT_MISMATCH)
  }
  if (!order || String(event.orderId || "").trim() !== String(order.id || "").trim()) {
    throw new Error(PAYMENT_EVENT_MISMATCH)
  }
  if (String(event.kind || "").toUpperCase() !== String(kind || "").toUpperCase()) {
    throw new Error(PAYMENT_EVENT_MISMATCH)
  }
  assertPaymentMatchesOrder(order, event.amount)
  assertPaymentCurrency(event.currency)
  return { ok: true, paymentId: String(paymentId), orderId: String(order.id) }
}

export function assertPaymentKind(kind) {
  const value = String(kind || "").toUpperCase()
  if (value !== "CARD" && value !== "FRACTION" && value !== "MARKETPLACE") {
    throw new Error("kind must be CARD, FRACTION, or MARKETPLACE")
  }
  return value
}

export function recordPaymentEvent({ orderId, kind, paymentId, amount, provider, order, currency } = {}) {
  const normalizedKind = assertPaymentKind(kind)
  const id = String(orderId || "").trim()
  const payId = String(paymentId || "").trim()
  if (!id) throw new Error("orderId is required")
  if (!payId) throw new Error("paymentId is required")
  if (order != null) {
    assertPaymentMatchesOrder(order, amount)
  }
  const resolvedProvider = String(provider ?? "").trim() || "UA_STAGING"
  return {
    status: "RECORDED",
    orderId: id,
    kind: normalizedKind,
    paymentId: payId,
    amount: canonicalAmount(amount),
    currency: assertPaymentCurrency(currency),
    provider: resolvedProvider,
  }
}
