import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuPublicCardCheckout.mjs`
const orderPath = `${projectRoot}/src/routes/api/cards/order.ts`
const pagePath = `${projectRoot}/src/routes/dashboard/cards.tsx`
const publicFraction = readFileSync(new URL("../src/routes/api/fractions/order.ts", import.meta.url), "utf8")
const publicMarket = readFileSync(new URL("../src/routes/api/marketplace/order.ts", import.meta.url), "utf8")
const publicNft = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("Wave L named CARD checkout opens CARD only", {
  skip: !existsSync(enginePath),
}, async () => {
  const {
    CARD_PUBLIC_CHECKOUT,
    NAMED_OPEN_SENTENCE,
    assertPublicCardKind,
    publicCardOrderResponse,
    publicCheckoutFlags,
    rejectPublicCardClientOverrides,
  } = await import(pathToFileURL(enginePath).href)
  assert.equal(CARD_PUBLIC_CHECKOUT, true)
  assert.equal(NAMED_OPEN_SENTENCE, "open Ubuntu public CARD checkout")
  const flags = publicCheckoutFlags()
  assert.equal(flags.cardCheckoutEnabled, true)
  assert.equal(flags.fractionCheckoutEnabled, true)
  assert.equal(flags.marketplaceEnabled, true)
  assert.equal(flags.nftMarketplaceEnabled, false)
  assert.doesNotThrow(() => rejectPublicCardClientOverrides({ productType: "CARD_PLASTIC", quantity: 1 }))
  assert.throws(() => rejectPublicCardClientOverrides({ userId: "9" }), /userId/)
  assert.throws(() => rejectPublicCardClientOverrides({ sponsorId: "1" }), /sponsorId/)
  assert.throws(() => rejectPublicCardClientOverrides({ retailPrice: "100.00" }), /retailPrice/)
  assert.throws(() => rejectPublicCardClientOverrides({ members: [{ userId: "1" }] }), /rank chains/)
  assert.throws(() => assertPublicCardKind("FRACTION"), /CARD only/)
  const body = publicCardOrderResponse({
    order: { id: "c1", productId: "CARD_PLASTIC", quantity: 1, total: "100.00", status: "PENDING_PAYMENT" },
    persisted: true,
    idempotent: false,
  })
  assert.equal(body.checkoutEnabled, true)
  assert.equal(body.order.status, "PENDING_PAYMENT")
  assert.doesNotMatch(JSON.stringify(body), /sponsor/)
})

test("Wave L CARD page and marketplace/NFT public buy routes stay closed", () => {
  assert.equal(existsSync(orderPath), true)
  assert.equal(existsSync(pagePath), true)
  const order = readFileSync(orderPath, "utf8")
  const page = readFileSync(pagePath, "utf8")
  assert.match(order, /persistPendingCardOrder/)
  assert.match(order, /checkoutEnabled: true/)
  assert.match(order, /rejectPublicCardClientOverrides/)
  assert.doesNotMatch(order, /confirmCommercePayment/)
  assert.doesNotMatch(order, /fgubaqoftdeefcakejwu/)
  assert.match(page, /\/api\/cards\/order/)
  assert.match(page, /productType|quantity/)
  assert.doesNotMatch(page, /\/api\/fractions\/order/)
  assert.doesNotMatch(page, /\/api\/marketplace\/order/)
  assert.doesNotMatch(page, /\/api\/nft\/order/)
  assert.match(publicFraction, /persistPendingFractionOrder/)
  assert.match(publicMarket, /persistPendingMarketplaceOrder/)
  assert.match(publicNft, /Public checkout is not open/)
  assert.equal(pkg.version, "0.1.62")
})
