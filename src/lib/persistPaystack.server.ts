import type { SupabaseClient } from "@supabase/supabase-js"
import { persistPaymentEvent } from "./persistPayment.server"
import {
  PAYSTACK_CHARGE_REQUIRED,
  assertPaystackInitializeResponse,
  assertPaystackVerifyResponse,
  assertUbuntuPaystackSecret,
  buildPaystackInitializeBody,
  parsePaystackChargeSuccess,
  verifyPaystackSignature,
} from "./ubuntuPaystack.mjs"

const PAYSTACK_API = "https://api.paystack.co"

export async function initializeUbuntuPaystackPayment(input: {
  secret: string
  email: string
  amount: string
  kind: string
  orderId: string
  paymentId: string
  callbackUrl: string
}) {
  const secret = assertUbuntuPaystackSecret(input.secret)
  const body = buildPaystackInitializeBody(input)
  const res = await fetch(PAYSTACK_API + "/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(String((json as { message?: string }).message || "Paystack initialize failed"))
  }
  return assertPaystackInitializeResponse(json)
}

export async function verifyUbuntuPaystackReference(input: { secret: string; reference: string }) {
  const secret = assertUbuntuPaystackSecret(input.secret)
  const reference = String(input.reference || "").trim()
  if (!reference) throw new Error("paymentId is required")
  const res = await fetch(PAYSTACK_API + "/transaction/verify/" + encodeURIComponent(reference), {
    headers: { Authorization: "Bearer " + secret },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(String((json as { message?: string }).message || "Paystack verify failed"))
  }
  return assertPaystackVerifyResponse(json)
}

export async function persistUbuntuPaystackWebhook(
  ubuntu: SupabaseClient,
  input: { secret: string; rawBody: string; signature: string }
) {
  verifyPaystackSignature(input.secret, input.rawBody, input.signature)
  let body: Record<string, unknown>
  try {
    body = JSON.parse(input.rawBody || "{}") as Record<string, unknown>
  } catch {
    throw new Error("Paystack webhook body is invalid")
  }
  if (String(body.event || "") && String(body.event) !== "charge.success") {
    return { ignored: true, idempotent: true, settled: false, checkoutEnabled: false as const }
  }
  let event
  try {
    event = parsePaystackChargeSuccess(body)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Paystack webhook failed"
    if (message.includes(PAYSTACK_CHARGE_REQUIRED)) {
      return { ignored: true, idempotent: true, settled: false, checkoutEnabled: false as const }
    }
    throw err
  }
  const persisted = await persistPaymentEvent(ubuntu, event)
  return {
    ...persisted,
    event,
    settled: false,
    settleIdempotent: false,
    ignored: false,
    next: "admin-approve",
    checkoutEnabled: false as const,
  }
}
