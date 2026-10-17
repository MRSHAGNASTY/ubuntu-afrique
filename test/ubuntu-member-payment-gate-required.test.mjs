import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuMemberPaymentGate.mjs`
const initiatePath = `${projectRoot}/src/routes/api/payments/initiate.ts`
const completePath = `${projectRoot}/src/routes/api/payments/complete.ts`
const pendingPath = `${projectRoot}/src/routes/api/payments/pending.ts`
const payPath = `${projectRoot}/src/routes/dashboard/pay.tsx`
const publicMarket = readFileSync(new URL("../src/routes/api/marketplace/order.ts", import.meta.url), "utf8")
const publicNft = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("named member payment gate opens CARD and FRACTION only", {
  skip: !existsSync(enginePath),
}, async () => {
  const {
    MEMBER_PAYMENT_GATE,
    NAMED_OPEN_SENTENCE,
    assertMemberPaymentKind,
    bookPaymentAmount,
    memberPaymentCompleteResponse,
    memberPaymentGateFlags,
    memberPaymentInitiateResponse,
    rejectMemberPaymentClientOverrides,
    signMemberPaymentTicket,
  } = await import(pathToFileURL(enginePath).href)
  assert.equal(MEMBER_PAYMENT_GATE, true)
  assert.equal(NAMED_OPEN_SENTENCE, "open Ubuntu member payment gate for CARD and FRACTION")
  const flags = memberPaymentGateFlags()
  assert.equal(flags.memberPaymentGateEnabled, true)
  assert.equal(flags.cardCheckoutEnabled, true)
  assert.equal(flags.fractionCheckoutEnabled, true)
  assert.equal(flags.marketplaceEnabled, true)
  assert.equal(flags.nftMarketplaceEnabled, false)
  assert.equal(assertMemberPaymentKind("card"), "CARD")
  assert.equal(assertMemberPaymentKind("FRACTION"), "FRACTION")
  assert.equal(assertMemberPaymentKind("MARKETPLACE"), "MARKETPLACE")
  assert.throws(() => assertMemberPaymentKind("NFT"), /CARD, FRACTION, and MARKETPLACE only/)
  assert.throws(() => rejectMemberPaymentClientOverrides({ amount: "10.00" }), /amount/)
  assert.throws(() => rejectMemberPaymentClientOverrides({ members: [{ userId: "1" }] }), /rank chains/)
  assert.equal(bookPaymentAmount(100), "100.00")
  const signature = signMemberPaymentTicket("ubuntu-psp-staging-secret", {
    paymentId: "pay-1",
    orderId: "ord-1",
    kind: "FRACTION",
    amount: "10.00",
  })
  assert.match(signature, /^[0-9a-f]{64}$/)
  const initiated = memberPaymentInitiateResponse({
    paymentId: "pay-1",
    orderId: "ord-1",
    kind: "FRACTION",
    amount: "10.00",
    signature,
  })
  assert.equal(initiated.next, "complete")
  assert.equal(initiated.amount, "10.00")
  const completed = memberPaymentCompleteResponse({
    order: { id: "ord-1", kind: "FRACTION", status: "PAID", total: "10.00" },
    paymentId: "pay-1",
    settled: true,
    idempotent: false,
  })
  assert.equal(completed.settled, true)
  assert.equal(completed.order.status, "PAID")
})

test("member payment routes stay Ubuntu-only and do not open marketplace or NFT", () => {
  assert.equal(existsSync(initiatePath), true)
  assert.equal(existsSync(completePath), true)
  assert.equal(existsSync(pendingPath), true)
  assert.equal(existsSync(payPath), true)
  const initiate = readFileSync(initiatePath, "utf8")
  const complete = readFileSync(completePath, "utf8")
  const pending = readFileSync(pendingPath, "utf8")
  const pay = readFileSync(payPath, "utf8")
  assert.match(initiate, /UA_BSC_COMPANY_WALLET/)
  assert.match(initiate, /bscConfigured/)
  assert.doesNotMatch(initiate, /fgubaqoftdeefcakejwu/)
  assert.match(complete, /Johan Verify & Approve/)
  assert.doesNotMatch(complete, /persistMemberPaymentSettle/)
  assert.doesNotMatch(complete, /persistUbuntuPspWebhook/)
  assert.doesNotMatch(complete, /nowpayments/i)
  const persistGap = readFileSync(`${projectRoot}/src/lib/persistGap.server.ts`, "utf8")
  const persistVolume = readFileSync(`${projectRoot}/src/lib/persistVolume.server.ts`, "utf8")
  assert.match(persistGap, /existingWallet/)
  assert.match(persistGap, /GAP_COMMISSION/)
  assert.match(persistGap, /status", "posted"/)
  const walletUnique = readFileSync(`${projectRoot}/supabase/ubuntu-only/0022_ua_wallet_gap_posted_unique.sql`, "utf8")
  assert.match(walletUnique, /ua_wallet_gap_posted_unique/)
  assert.match(walletUnique, /rbyipalrasawbjpsppgu/)
  assert.match(walletUnique, /fgubaqoftdeefcakejwu/)
  assert.doesNotMatch(walletUnique, /marketplace_enabled/)
  assert.match(persistVolume, /ua_qv_txn_source/)
  assert.match(persistVolume, /idempotent: true/)
  assert.match(pending, /PENDING_PAYMENT/)
  assert.match(pending, /ua_marketplace_orders/)
  assert.match(pay, /\/api\/payments\/initiate/)
  assert.match(pay, /\/api\/payments\/verify-bsc/)
  assert.match(pay, /Verify USDT on BSC/)
  assert.match(pay, /Johan Verify & Approve/)
  assert.doesNotMatch(pay, /Pay Ubuntu staging/)
  assert.match(pay, /ua_session/)
  assert.match(pay, /\/auth\/login/)
  assert.doesNotMatch(pay, /\/api\/marketplace\/order/)
  assert.doesNotMatch(pay, /\/api\/nft\/order/)
  assert.match(publicMarket, /persistPendingMarketplaceOrder/)
  assert.match(publicMarket, /Session required/)
  assert.match(publicNft, /Public checkout is not open/)
  assert.equal(pkg.version, "0.1.68")
})
