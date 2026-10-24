import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"
import { confirmCommercePayment } from "../src/lib/commerceOrders.mjs"
import { assertRecordedPaymentForConfirm } from "../src/lib/paymentAdapter.mjs"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuPsp.mjs`
const webhookPath = `${projectRoot}/src/routes/api/payments/webhook.ts`
const persistPath = `${projectRoot}/src/lib/persistPsp.server.ts`
const confirmPath = `${projectRoot}/src/routes/api/admin/commerce/confirm-payment.ts`
const publicOrder = readFileSync(new URL("../src/routes/api/cards/order.ts", import.meta.url), "utf8")
const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

const secret = "ubuntu-psp-staging-secret"
const order = { id: "CARD-PSP-1", kind: "CARD", total: "100.00" }
const payload = {
  paymentId: "PAY-PSP-1",
  orderId: order.id,
  kind: "CARD",
  amount: "100.00",
  currency: "USD",
}

test("Wave J PSP verifies signature, amount, currency, and order ref", {
  skip: !existsSync(enginePath),
}, async () => {
  const { signUbuntuPspWebhook, verifyUbuntuPspWebhook, UA_PSP_PROVIDER } = await import(pathToFileURL(enginePath).href)
  const signature = signUbuntuPspWebhook(secret, payload)
  const event = verifyUbuntuPspWebhook({ secret, signature, payload, order })
  assert.equal(event.status, "RECORDED")
  assert.equal(event.provider, UA_PSP_PROVIDER)
  assert.equal(event.checkoutEnabled, false)
  assert.throws(
    () => verifyUbuntuPspWebhook({ secret, signature: "deadbeef", payload, order }),
    /signature is invalid/
  )
  assert.throws(
    () => verifyUbuntuPspWebhook({
      secret,
      signature: signUbuntuPspWebhook(secret, { ...payload, amount: "1.00" }),
      payload: { ...payload, amount: "1.00" },
      order,
    }),
    /price-version total/
  )
  assert.throws(
    () => verifyUbuntuPspWebhook({
      secret,
      signature: signUbuntuPspWebhook(secret, { ...payload, currency: "EUR" }),
      payload: { ...payload, currency: "EUR" },
      order,
    }),
    /USD/
  )
  assert.throws(
    () => signUbuntuPspWebhook("https://fgubaqoftdeefcakejwu.supabase.co/secret", payload),
    /will not use Aureus payment credentials/
  )
})

test("Wave J duplicate webhook records once and settles once", {
  skip: !existsSync(enginePath),
}, async () => {
  const { signUbuntuPspWebhook, noteUbuntuPspWebhook, confirmRecordedPspPayment } = await import(pathToFileURL(enginePath).href)
  const signature = signUbuntuPspWebhook(secret, payload)
  const incoming = { secret, signature, payload, order }
  const first = noteUbuntuPspWebhook(null, incoming)
  const second = noteUbuntuPspWebhook(first.event, incoming)
  const third = noteUbuntuPspWebhook(first.event, incoming)
  assert.equal(first.idempotent, false)
  assert.equal(second.idempotent, true)
  assert.equal(third.idempotent, true)
  assert.equal(first.event.paymentId, "PAY-PSP-1")

  const members = [{ userId: "9", rank: "VP", isActive: true }]
  const paidOrder = {
    id: order.id,
    kind: "CARD",
    userId: "9",
    productId: "CARD_PLASTIC",
    productType: "CARD_PLASTIC",
    quantity: 1,
    total: "100.00",
    commissionableValue: "100.00",
    qv: "100.00",
    gapSchedule: "STANDARD_25",
    status: "PENDING_PAYMENT",
    sponsorId: "9",
  }
  assertRecordedPaymentForConfirm({
    event: first.event,
    order: paidOrder,
    paymentId: "PAY-PSP-1",
    kind: "CARD",
  })
  const settled = confirmRecordedPspPayment({
    existing: { ...first.event, secret, signature, payload },
    order: paidOrder,
    paymentId: "PAY-PSP-1",
    kind: "CARD",
    confirm: ({ order: next, paymentId }) => confirmCommercePayment({ order: next, paymentId, members }),
  })
  assert.equal(settled.settlements, 1)
  assert.equal(settled.checkoutEnabled, false)
  const again = confirmRecordedPspPayment({
    existing: { ...first.event, settled: true, order: settled.order, secret, signature, payload },
    order: paidOrder,
    paymentId: "PAY-PSP-1",
    kind: "CARD",
    confirm: () => {
      throw new Error("confirm must not run twice")
    },
  })
  assert.equal(again.idempotent, true)
  assert.equal(again.settlements, 1)
})

test("Wave J webhook stays Ubuntu-only and checkout stays closed", {
  skip: !existsSync(webhookPath),
}, () => {
  const webhook = readFileSync(webhookPath, "utf8")
  const persist = readFileSync(persistPath, "utf8")
  const confirm = readFileSync(confirmPath, "utf8")
  assert.match(webhook, /persistUbuntuPspWebhook/)
  assert.match(webhook, /x-ua-psp-signature/)
  assert.match(webhook, /checkoutEnabled: false/)
  assert.match(webhook, /next: "confirm-payment"/)
  assert.doesNotMatch(webhook, /confirmCommercePayment/)
  assert.doesNotMatch(webhook, /fgubaqoftdeefcakejwu/)
  assert.match(persist, /persistPaymentEvent/)
  assert.match(persist, /verifyUbuntuPspWebhook/)
  assert.match(confirm, /assertRecordedPaymentForConfirm/)
  assert.match(publicOrder, /persistPendingCardOrder/)
  assert.match(publicOrder, /checkoutEnabled: true/)
  assert.match(envExample, /UA_PSP_WEBHOOK_SECRET/)
  assert.doesNotMatch(envExample, /NOWPAYMENTS/)
  assert.equal(pkg.version, "0.1.70")
})

test("Wave U dummy PSP signs MARKETPLACE and refuses NFT", {
  skip: !existsSync(enginePath),
}, async () => {
  const { signUbuntuPspWebhook } = await import(pathToFileURL(enginePath).href)
  const { assertPaymentKind, recordPaymentEvent } = await import(pathToFileURL(`${projectRoot}/src/lib/paymentAdapter.mjs`).href)
  const market = {
    paymentId: "PAY-MKT-1",
    orderId: "MKT-1",
    kind: "MARKETPLACE",
    amount: "100.00",
    currency: "USD",
  }
  assert.equal(assertPaymentKind("MARKETPLACE"), "MARKETPLACE")
  assert.throws(() => assertPaymentKind("NFT"), /CARD, FRACTION, or MARKETPLACE/)
  assert.equal(recordPaymentEvent({ ...market, provider: "UA_PSP_STAGING" }).kind, "MARKETPLACE")
  assert.match(signUbuntuPspWebhook(secret, market), /^[0-9a-f]{64}$/)
  assert.throws(() => signUbuntuPspWebhook(secret, { ...market, kind: "NFT" }), /CARD, FRACTION, or MARKETPLACE/)
})
