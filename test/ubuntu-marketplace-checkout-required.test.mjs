import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuPublicMarketplaceCheckout.mjs`
const orderPath = `${projectRoot}/src/routes/api/marketplace/order.ts`
const pagePath = `${projectRoot}/src/routes/marketplace/product/$slug.tsx`
const pendingPath = `${projectRoot}/src/routes/api/payments/pending.ts`
const settlePath = `${projectRoot}/src/lib/persistMemberPaymentSettle.server.ts`
const publicNft = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const schema = readFileSync(new URL("../supabase/ubuntu-only/0024_ua_marketplace_enabled.sql", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("Wave V named marketplace checkout opens MARKETPLACE only", {
  skip: !existsSync(enginePath),
}, async () => {
  const {
    MARKETPLACE_PUBLIC_CHECKOUT,
    NAMED_OPEN_SENTENCE,
    assertMarketplacePublicCheckoutNamed,
    publicMarketplaceFlags,
    publicMarketplaceOrderResponse,
    rejectPublicMarketplaceClientOverrides,
  } = await import(pathToFileURL(enginePath).href)
  assert.equal(MARKETPLACE_PUBLIC_CHECKOUT, true)
  assert.equal(NAMED_OPEN_SENTENCE, "enable Ubuntu marketplace_enabled")
  assert.doesNotThrow(() => assertMarketplacePublicCheckoutNamed())
  const flags = publicMarketplaceFlags()
  assert.equal(flags.marketplaceEnabled, true)
  assert.equal(flags.nftMarketplaceEnabled, false)
  assert.equal(flags.checkoutEnabled, true)
  assert.equal(flags.purchaseOpen, "CARD,FRACTION,MARKETPLACE")
  assert.doesNotThrow(() => rejectPublicMarketplaceClientOverrides({ productId: "UAT_MKT_100" }))
  assert.throws(() => rejectPublicMarketplaceClientOverrides({ amount: "40.00" }), /amount/)
  assert.throws(() => rejectPublicMarketplaceClientOverrides({ members: [{ userId: "1" }] }), /rank chains/)
  const body = publicMarketplaceOrderResponse({
    order: { id: "m1", productId: "UAT_MKT_100", companyId: "UAT_CO_WAVE_H", retailPrice: "100.00", status: "PENDING_PAYMENT" },
    persisted: true,
    idempotent: false,
  })
  assert.equal(body.kind, "MARKETPLACE")
  assert.equal(body.order.status, "PENDING_PAYMENT")
  assert.equal(body.marketplaceEnabled, true)
  assert.equal(body.nftMarketplaceEnabled, false)
})

test("Wave V product page posts pending then pay; NFT stays 403", () => {
  assert.equal(existsSync(orderPath), true)
  assert.equal(existsSync(pagePath), true)
  assert.equal(existsSync(pendingPath), true)
  const order = readFileSync(orderPath, "utf8")
  const page = readFileSync(pagePath, "utf8")
  const pending = readFileSync(pendingPath, "utf8")
  const settle = readFileSync(settlePath, "utf8")
  assert.match(order, /persistPendingMarketplaceOrder/)
  assert.match(order, /Session required/)
  assert.match(order, /marketError\(401/)
  assert.match(order, /marketplaceEnabled: true/)
  assert.doesNotMatch(order, /fgubaqoftdeefcakejwu/)
  assert.match(page, /\/api\/marketplace\/order/)
  assert.match(page, /kind: "MARKETPLACE"/)
  assert.match(page, /\/dashboard\/pay/)
  assert.match(pending, /ua_marketplace_orders/)
  assert.match(pending, /kind: "MARKETPLACE"/)
  assert.match(settle, /persistMarketplaceMemberPay/)
  assert.match(settle, /settleMarketplaceOrder/)
  assert.match(schema, /rbyipalrasawbjpsppgu/)
  assert.match(schema, /fgubaqoftdeefcakejwu/)
  assert.match(schema, /marketplace_enabled/)
  assert.match(schema, /NEVER run this on Aureus production/)
  assert.doesNotMatch(schema, /nft_marketplace_enabled', 'true'/)
  assert.match(publicNft, /Public checkout is not open/)
  assert.match(publicNft, /status: 403/)
  assert.equal(pkg.version, "0.1.63")
})