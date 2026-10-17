import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuPaystack.mjs`
const persistPath = `${projectRoot}/src/lib/persistPaystack.server.ts`
const initiatePath = `${projectRoot}/src/routes/api/payments/initiate.ts`
const completePath = `${projectRoot}/src/routes/api/payments/complete.ts`
const webhookPath = `${projectRoot}/src/routes/api/payments/webhook.ts`
const payPath = `${projectRoot}/src/routes/dashboard/pay.tsx`
const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))
const publicNft = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")

const secret = "ubuntu-paystack-test-secret"
const charge = {
  event: "charge.success",
  data: {
    status: "success",
    amount: 10000,
    currency: "USD",
    reference: "PAY-PSK-1",
    metadata: { orderId: "CARD-PSK-1", kind: "CARD", paymentId: "PAY-PSK-1" },
  },
}

test("Wave X Paystack signs webhook, maps USD cents, and refuses Aureus keys", {
  skip: !existsSync(enginePath),
}, async () => {
  const {
    UA_PAYSTACK_PROVIDER,
    assertPaystackInitializeResponse,
    assertPaystackVerifyResponse,
    assertUbuntuPaystackSecret,
    buildPaystackInitializeBody,
    parsePaystackChargeSuccess,
    paystackAmountToUsd,
    paystackConfigured,
    signPaystackWebhook,
    usdToPaystackAmount,
    verifyPaystackSignature,
  } = await import(pathToFileURL(enginePath).href)
  assert.equal(UA_PAYSTACK_PROVIDER, "PAYSTACK")
  assert.equal(usdToPaystackAmount("100.00"), 10000)
  assert.equal(paystackAmountToUsd(10000), "100.00")
  assert.equal(paystackConfigured({}), false)
  assert.equal(paystackConfigured({ UA_PAYSTACK_SECRET_KEY: secret }), true)
  const raw = JSON.stringify(charge)
  const signature = signPaystackWebhook(secret, raw)
  assert.match(signature, /^[0-9a-f]{128}$/)
  assert.equal(verifyPaystackSignature(secret, raw, signature), true)
  assert.throws(() => verifyPaystackSignature(secret, raw, "deadbeef"), /signature is invalid/)
  const event = parsePaystackChargeSuccess(charge)
  assert.equal(event.provider, "PAYSTACK")
  assert.equal(event.kind, "CARD")
  assert.equal(event.amount, "100.00")
  assert.equal(event.paymentId, "PAY-PSK-1")
  const body = buildPaystackInitializeBody({
    email: "jp.member@ubuntu-afrique.test",
    amount: "10.00",
    kind: "FRACTION",
    orderId: "FRAC-1",
    paymentId: "PAY-FRAC-1",
    callbackUrl: "https://ubuntu-afrique.vercel.app/dashboard/pay?kind=FRACTION&orderId=FRAC-1",
  })
  assert.equal(body.amount, 1000)
  assert.equal(body.currency, "USD")
  assert.equal(body.metadata.kind, "FRACTION")
  const started = assertPaystackInitializeResponse({
    status: true,
    data: { authorization_url: "https://checkout.paystack.com/abc", reference: "PAY-FRAC-1" },
  })
  assert.equal(started.provider, "PAYSTACK")
  assert.throws(
    () => assertPaystackInitializeResponse({
      status: true,
      data: { authorization_url: "https://shopify.com/pay", reference: "x" },
    }),
    /will not use Aureus payment credentials/
  )
  const verified = assertPaystackVerifyResponse({ status: true, data: charge.data })
  assert.equal(verified.orderId, "CARD-PSK-1")
  assert.throws(() => assertUbuntuPaystackSecret("https://fgubaqoftdeefcakejwu.supabase.co/sk"), /Aureus/)
  assert.throws(() => assertUbuntuPaystackSecret("nowpayments-ipn"), /Aureus/)
  assert.throws(
    () => parsePaystackChargeSuccess({
      event: "charge.success",
      data: { ...charge.data, metadata: { orderId: "NFT-1", kind: "NFT" } },
    }),
    /CARD, FRACTION, or MARKETPLACE/
  )
})

test("Wave X Paystack leftover is not the till and keeps NFT 403", () => {
  assert.equal(existsSync(persistPath), true)
  const initiate = readFileSync(initiatePath, "utf8")
  const complete = readFileSync(completePath, "utf8")
  const webhook = readFileSync(webhookPath, "utf8")
  const persist = readFileSync(persistPath, "utf8")
  const pay = readFileSync(payPath, "utf8")
  assert.doesNotMatch(initiate, /initializeUbuntuPaystackPayment/)
  assert.doesNotMatch(initiate, /UA_PAYSTACK_SECRET_KEY/)
  assert.doesNotMatch(initiate, /shopify/i)
  assert.doesNotMatch(initiate, /fgubaqoftdeefcakejwu/)
  assert.doesNotMatch(complete, /verifyUbuntuPaystackReference/)
  assert.doesNotMatch(complete, /nowpayments/i)
  assert.match(webhook, /x-paystack-signature/)
  assert.match(webhook, /persistUbuntuPaystackWebhook/)
  assert.match(webhook, /x-ua-psp-signature/)
  assert.match(webhook, /next: "confirm-payment"/)
  assert.doesNotMatch(webhook, /confirmCommercePayment/)
  assert.match(persist, /api.paystack.co/)
  assert.doesNotMatch(persist, /persistMemberPaymentSettle/)
  assert.doesNotMatch(persist, /fgubaqoftdeefcakejwu/)
  assert.doesNotMatch(pay, /Pay with Paystack/)
  assert.doesNotMatch(pay, /Pay Ubuntu staging/)
  assert.match(envExample, /UA_PAYSTACK_SECRET_KEY/)
  assert.doesNotMatch(envExample, /NOWPAYMENTS/)
  assert.doesNotMatch(envExample, /SHOPIFY/)
  assert.match(publicNft, /Public checkout is not open/)
  assert.equal(pkg.version, "0.1.68")
})
