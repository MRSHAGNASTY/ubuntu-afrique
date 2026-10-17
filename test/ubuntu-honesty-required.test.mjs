import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { memberPaymentGateFlags } from "../src/lib/ubuntuMemberPaymentGate.mjs"
import { publicCheckoutFlags } from "../src/lib/ubuntuPublicCardCheckout.mjs"
import { buildMemberOverview } from "../src/lib/memberLedger.mjs"
import {
  PREVIEW_COMPLETE,
  PREVIEW_SMOKE,
  PRODUCTION_COMPLETE,
  previewSmokeClosedApis,
  previewSmokeIds,
} from "../src/lib/ubuntuPreviewSmoke.mjs"

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const cards = readFileSync(new URL("../src/routes/dashboard/cards.tsx", import.meta.url), "utf8")
const invest = readFileSync(new URL("../src/routes/dashboard/invest.tsx", import.meta.url), "utf8")
const pay = readFileSync(new URL("../src/routes/dashboard/pay.tsx", import.meta.url), "utf8")
const ledgerApi = readFileSync(new URL("../src/routes/api/member/ledger.ts", import.meta.url), "utf8")
const isolation = readFileSync(new URL("./ubuntu-afrique-db-isolation.test.mjs", import.meta.url), "utf8")
const publicMarket = readFileSync(new URL("../src/routes/api/marketplace/order.ts", import.meta.url), "utf8")
const publicNft = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")

const NS_TESTS = [
  "ubuntu-member-network-required.test.mjs",
  "ubuntu-member-wallet-page-required.test.mjs",
  "ubuntu-member-kyc-page-required.test.mjs",
  "ubuntu-member-orders-required.test.mjs",
  "ubuntu-affiliate-cutover-required.test.mjs",
  "ubuntu-admin-product-required.test.mjs",
  "ubuntu-reports-notifications-required.test.mjs",
  "ubuntu-marketplace-product-required.test.mjs",
  "ubuntu-nft-product-required.test.mjs",
  "ubuntu-civilian-onboarding-required.test.mjs",
  "ubuntu-honesty-required.test.mjs",
  "ubuntu-marketplace-checkout-required.test.mjs",
  "ubuntu-process-parity-required.test.mjs",
  "ubuntu-hash-reuse-required.test.mjs",
  "ubuntu-dedicated-wallet-required.test.mjs",
]

test("Wave T memberLedger and pay-gate flags match named CARD/FRACTION opens", () => {
  const overview = buildMemberOverview({ userId: "2", username: "uat" })
  const payFlags = memberPaymentGateFlags()
  const cardFlags = publicCheckoutFlags()
  assert.equal(overview.checkoutEnabled, true)
  assert.equal(overview.cardsEnabled, true)
  assert.equal(overview.fractionsEnabled, true)
  assert.equal(overview.marketplaceEnabled, true)
  assert.equal(overview.nftEnabled, false)
  assert.equal(payFlags.cardCheckoutEnabled, true)
  assert.equal(payFlags.fractionCheckoutEnabled, true)
  assert.equal(payFlags.marketplaceEnabled, true)
  assert.equal(payFlags.nftMarketplaceEnabled, false)
  assert.equal(cardFlags.cardCheckoutEnabled, true)
  assert.equal(cardFlags.marketplaceEnabled, true)
  assert.equal(cardFlags.nftMarketplaceEnabled, false)
  assert.match(ledgerApi, /ok: true, \.\.\.overview/)
  assert.doesNotMatch(ledgerApi, /\.\.\.overview, checkoutEnabled: false/)
})

test("Wave T CARD/FRACTION pages stay named-open and marketplace/NFT stay 403", () => {
  for (const source of [cards, invest, pay]) {
    assert.doesNotMatch(source, /checkout closed/i)
    assert.doesNotMatch(source, /Checkout is not open/)
    assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
  }
  assert.match(cards, /Named open: CARD only|Public CARD checkout/)
  assert.match(invest, /Named FRACTION checkout is open/)
  assert.match(pay, /Pay CARD, FRACTION, or MARKETPLACE/)
  assert.match(publicMarket, /persistPendingMarketplaceOrder/)
  assert.match(publicMarket, /Session required/)
  assert.match(publicNft, /status: 403/)
})

test("Wave T N-S tests, isolation, and preview smoke stay listed", () => {
  assert.equal(PREVIEW_COMPLETE, true)
  assert.equal(PRODUCTION_COMPLETE, true)
  assert.deepEqual(previewSmokeIds(), [
    "login",
    "network",
    "wallet",
    "kyc",
    "cardQuote",
    "fractionQuote",
    "marketplaceOrder",
    "nftOrder",
  ])
  assert.deepEqual(previewSmokeClosedApis(), ["/api/nft/order"])
  assert.equal(PREVIEW_SMOKE.length, 8)
  for (const name of NS_TESTS) {
    assert.equal(existsSync(new URL("./" + name, import.meta.url)), true, name)
    assert.match(pkg.scripts.test, new RegExp(name.replace(/\./g, "\\.")))
  }
  assert.match(isolation, /fgubaqoftdeefcakejwu/)
  assert.match(isolation, /Ubuntu client refuses Aureus project ref/)
  assert.match(isolation, /will not connect to Aureus production/)
  assert.equal(pkg.version, "0.1.69")
})
