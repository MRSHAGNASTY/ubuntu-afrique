/** Ubuntu in-app notifications. Channel is in_app until a named mail provider. */

export const NOTIFICATION_EVENTS = Object.freeze([
  "PAYMENT_SUCCESSFUL",
  "CARD_ORDER",
  "CARD_SHIPPED",
  "FRACTION_PURCHASE",
  "RANK_ACHIEVED",
  "COMMISSION_RECEIVED",
  "KYC_REVIEWED",
])

export const NOTIFICATION_CHANNEL = "in_app"

function requiredText(value, field) {
  const text = String(value == null ? "" : value).trim()
  if (!text) throw new Error(field + " is required")
  return text
}

function requiredUserId(value) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("userId must be an existing Ubuntu ua_users.id")
  }
  return String(id)
}

export function buildNotification(input) {
  const event = String(input?.event || "").toUpperCase()
  if (!NOTIFICATION_EVENTS.includes(event)) {
    throw new Error("Unsupported Ubuntu notification event")
  }
  const channel = String(input?.channel || NOTIFICATION_CHANNEL)
  if (channel !== NOTIFICATION_CHANNEL) {
    throw new Error("Ubuntu notifications are in_app only until a named mail provider")
  }
  if (String(input?.title || "").includes("fgubaqoftdeefcakejwu") || String(input?.body || "").includes("fgubaqoftdeefcakejwu")) {
    throw new Error("Notification must not target Aureus production")
  }
  return {
    userId: requiredUserId(input?.userId),
    channel: NOTIFICATION_CHANNEL,
    event,
    title: requiredText(input?.title, "title"),
    body: requiredText(input?.body, "body"),
    payload: input?.payload && typeof input.payload === "object" ? input.payload : null,
    checkoutEnabled: false,
  }
}

export function notificationForPayment(input) {
  const kind = String(input?.kind || "").toUpperCase()
  const orderId = requiredText(input?.orderId, "orderId")
  const userId = input?.userId
  const notes = []
  notes.push(buildNotification({
    userId,
    event: "PAYMENT_SUCCESSFUL",
    title: "Payment successful",
    body: "Ubuntu staging payment settled " + kind + " " + orderId,
    payload: { kind, orderId },
  }))
  if (kind === "CARD") {
    notes.push(buildNotification({
      userId,
      event: "CARD_ORDER",
      title: "Card order received",
      body: "Ubuntu CARD " + orderId + " is PAID",
      payload: { kind, orderId },
    }))
  }
  if (kind === "FRACTION") {
    notes.push(buildNotification({
      userId,
      event: "FRACTION_PURCHASE",
      title: "Fraction purchase successful",
      body: "Ubuntu FRACTION " + orderId + " is PAID",
      payload: { kind, orderId },
    }))
  }
  return notes
}

export function notificationForKycReview(input) {
  return buildNotification({
    userId: input?.userId,
    event: "KYC_REVIEWED",
    title: "KYC reviewed",
    body: "Ubuntu KYC is " + String(input?.status || "").toUpperCase(),
    payload: { status: String(input?.status || "").toUpperCase() },
  })
}

export function notificationForRank(input) {
  return buildNotification({
    userId: input?.userId,
    event: "RANK_ACHIEVED",
    title: "Rank achieved",
    body: "Ubuntu corporate rank is now " + String(input?.toRank || "").toUpperCase(),
    payload: { from: input?.fromRank, to: input?.toRank },
  })
}

export function notificationForCommission(input) {
  return buildNotification({
    userId: input?.userId,
    event: "COMMISSION_RECEIVED",
    title: "Commission received",
    body: "Ubuntu Gap Cover posted " + String(input?.amount || "0"),
    payload: { amount: String(input?.amount || "0"), sourceTransactionId: input?.sourceTransactionId || null },
  })
}
