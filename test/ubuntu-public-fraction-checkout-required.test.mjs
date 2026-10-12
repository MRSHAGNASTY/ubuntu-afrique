import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuPublicFractionCheckout.mjs`
const orderPath = `${projectRoot}/src/routes/api/fractions/order.ts`
const pagePath = `${projectRoot}/src/routes/dashboard/invest.tsx`
const publicMarket = readFileSync(new URL("../src/routes/api/marketplace/order.ts", import.meta.url), "utf8")
const publicNft = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("Wave L named FRACTION checkout opens FRACTION only", {
  skip: !existsSync(enginePath),
}, async () => {
  const {
    FRACTION_PUBLIC_CHECKOUT,
    NAMED_OPEN_SENTENCE,
    assertPublicFractionKind,
    publicFractionOrderResponse,
    publicFractionCheckoutFlags,
    rejectPublicFractionClientOverrides,
  } = await import(pathToFileURL(enginePath).href)
  assert.equal(FRACTION_PUBLIC_CHECKOUT, true)
  assert.equal(NAMED_OPEN_SENTENCE, "open Ubuntu public FRACTION checkout")
  const flags = publicFractionCheckoutFlags()
  assert.equal(flags.cardCheckoutEnabled, true)
  assert.equal(flags.fractionCheckoutEnabled, true)
  assert.equal(flags.marketplaceEnabled, true)
  assert.equal(flags.nftMarketplaceEnabled, false)
  assert.doesNotThrow(() => rejectPublicFractionClientOverrides({ quantity: 1 }))
  assert.throws(() => rejectPublicFractionClientOverrides({ userId: "9" }), /userId/)
  assert.throws(() => rejectPublicFractionClientOverrides({ sponsorId: "1" }), /sponsorId/)
  assert.throws(() => rejectPublicFractionClientOverrides({ remainingUnderlying: "1" }), /remainingUnderlying/)
  assert.throws(() => rejectPublicFractionClientOverrides({ aureusSharePrice: "100.00" }), /aureusSharePrice/)
  assert.throws(() => rejectPublicFractionClientOverrides({ aureusPhase: "10" }), /aureusPhase/)
  assert.throws(() => rejectPublicFractionClientOverrides({ members: [{ userId: "1" }] }), /rank chains/)
  assert.throws(() => assertPublicFractionKind("CARD"), /FRACTION only/)
  const body = publicFractionOrderResponse({
    order: { id: "f1", productId: "AUREUS_FRACTION", quantity: 1, total: "10.00", status: "PENDING_PAYMENT" },
    persisted: true,
    idempotent: false,
  })
  assert.equal(body.checkoutEnabled, true)
  assert.equal(body.fractionCheckoutEnabled, true)
  assert.equal(body.order.status, "PENDING_PAYMENT")
  assert.doesNotMatch(JSON.stringify(body), /sponsor/)
})

test("Wave L FRACTION page and other public buy routes stay closed", () => {
  assert.equal(existsSync(orderPath), true)
  assert.equal(existsSync(pagePath), true)
  const order = readFileSync(orderPath, "utf8")
  const page = readFileSync(pagePath, "utf8")
  assert.match(order, /persistPendingFractionOrder/)
  assert.match(order, /persistFractionReserve/)
  assert.match(order, /checkoutEnabled: true/)
  assert.match(order, /rejectPublicFractionClientOverrides/)
  assert.doesNotMatch(order, /confirmCommercePayment/)
  assert.doesNotMatch(order, /fgubaqoftdeefcakejwu/)
  assert.match(page, /\/api\/fractions\/order/)
  assert.match(page, /quantity/)
  assert.doesNotMatch(page, /\/api\/marketplace\/order/)
  assert.doesNotMatch(page, /\/api\/nft\/order/)
  assert.match(publicMarket, /persistPendingMarketplaceOrder/)
  assert.match(publicNft, /Public checkout is not open/)
  assert.equal(pkg.version, "0.1.64")
})
