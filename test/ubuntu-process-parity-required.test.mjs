import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuProcessParity.mjs`
const attestPath = `${projectRoot}/src/lib/persistBscAttest.server.ts`
const verifyPath = `${projectRoot}/src/routes/api/payments/verify-bsc.ts`
const initiatePath = `${projectRoot}/src/routes/api/payments/initiate.ts`
const completePath = `${projectRoot}/src/routes/api/payments/complete.ts`
const approvePath = `${projectRoot}/src/routes/api/admin/payments/approve.ts`
const attestedPath = `${projectRoot}/src/routes/api/admin/payments/attested.ts`
const adminPage = `${projectRoot}/src/routes/admin/payments.tsx`
const payPath = `${projectRoot}/src/routes/dashboard/pay.tsx`
const settlePath = `${projectRoot}/src/lib/persistMemberPaymentSettle.server.ts`
const paystackPersist = `${projectRoot}/src/lib/persistPaystack.server.ts`
const nftOrder = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("process-parity attests the hash and refuses Aureus mint", {
  skip: !existsSync(enginePath),
}, async () => {
  const {
    APPROVE_ROLE,
    JOHAN_SETTLE_REQUIRED,
    NEXT_ADMIN_APPROVE,
    PAYSTACK_TILL_REFUSED,
    SHARE_MINT_REFUSED,
    adminApproveResponse,
    assertNoAureusShareMint,
    memberPaymentAttestResponse,
  } = await import(pathToFileURL(enginePath).href)
  assert.equal(APPROVE_ROLE, "FINANCE")
  assert.match(JOHAN_SETTLE_REQUIRED, /Johan Verify & Approve/)
  assert.equal(NEXT_ADMIN_APPROVE, "admin-approve")
  assert.match(PAYSTACK_TILL_REFUSED, /Paystack is not the Ubuntu till/)
  assert.match(SHARE_MINT_REFUSED, /does not mint Aureus shares/)
  assert.throws(() => assertNoAureusShareMint({ table: "aureus_share_purchases" }), /does not mint Aureus shares/)
  assert.throws(() => assertNoAureusShareMint({ url: "https://shopify.com/pay" }), /Aureus payment credentials/)
  const attested = memberPaymentAttestResponse({
    order: { id: "ord-1", kind: "CARD", status: "PENDING_PAYMENT", total: "100.00" },
    paymentId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    attested: true,
    idempotent: false,
    provider: "BSC_USDT",
  })
  assert.equal(attested.settled, false)
  assert.equal(attested.next, "admin-approve")
  const approved = adminApproveResponse({
    order: { id: "ord-1", kind: "CARD", status: "PAID", total: "100.00" },
    paymentId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    settled: true,
    idempotent: false,
    provider: "BSC_USDT",
  })
  assert.equal(approved.mintedAureusShares, false)
  assert.equal(approved.settled, true)
})

test("process-parity routes attest then Johan approve on ua_* only", () => {
  assert.equal(existsSync(attestPath), true)
  assert.equal(existsSync(approvePath), true)
  assert.equal(existsSync(attestedPath), true)
  assert.equal(existsSync(adminPage), true)
  const verify = readFileSync(verifyPath, "utf8")
  const initiate = readFileSync(initiatePath, "utf8")
  const complete = readFileSync(completePath, "utf8")
  const approve = readFileSync(approvePath, "utf8")
  const attested = readFileSync(attestedPath, "utf8")
  const page = readFileSync(adminPage, "utf8")
  const pay = readFileSync(payPath, "utf8")
  const settle = readFileSync(settlePath, "utf8")
  const paystack = readFileSync(paystackPersist, "utf8")
  assert.match(verify, /persistBscAttestOnPending/)
  assert.match(verify, /persistPaymentEvent/)
  assert.doesNotMatch(verify, /persistMemberPaymentSettle/)
  assert.doesNotMatch(verify, /aureus_share_purchases/)
  assert.doesNotMatch(verify, /shopify/i)
  assert.match(initiate, /UA_BSC_COMPANY_WALLET/)
  assert.doesNotMatch(initiate, /initializeUbuntuPaystackPayment/)
  assert.doesNotMatch(initiate, /UA_PAYSTACK_SECRET_KEY/)
  assert.doesNotMatch(initiate, /UA_PSP_WEBHOOK_SECRET/)
  assert.doesNotMatch(initiate, /shopify/i)
  assert.match(complete, /Johan Verify & Approve/)
  assert.doesNotMatch(complete, /persistMemberPaymentSettle/)
  assert.doesNotMatch(complete, /verifyUbuntuPaystackReference/)
  assert.match(approve, /persistJohanApprove/)
  assert.match(approve, /FINANCE/)
  assert.doesNotMatch(approve, /aureus_share_purchases/)
  assert.match(attested, /loadAttestedPendingOrders/)
  assert.match(page, /Verify & Approve/)
  assert.match(page, /does not write aureus_share_purchases/)
  assert.doesNotMatch(page, /shopify/i)
  assert.match(pay, /Waiting for Johan Verify & Approve/)
  assert.match(pay, /Verify USDT on BSC/)
  assert.doesNotMatch(pay, /Pay with Paystack/)
  assert.doesNotMatch(pay, /Pay Ubuntu staging/)
  assert.doesNotMatch(pay, /shopify/i)
  assert.match(settle, /ua_fraction_ownership/)
  assert.doesNotMatch(settle, /aureus_share_purchases/)
  assert.doesNotMatch(paystack, /persistMemberPaymentSettle/)
  assert.match(paystack, /admin-approve/)
  assert.match(nftOrder, /Public checkout is not open/)
  assert.equal(pkg.version, "0.1.70")
})
