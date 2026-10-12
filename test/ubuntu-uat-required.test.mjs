import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuUat.mjs`
const runnerPath = `${projectRoot}/deploy/ubuntu-uat.mjs`
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("UAT gate 1 refuses Aureus and keeps non-CARD checkout closed", {
  skip: !existsSync(enginePath),
}, async () => {
  const { planUbuntuUat, assertUatFlags, assertClosedCheckoutResponse, PUBLIC_CHECKOUT_PATHS, OPEN_PUBLIC_CHECKOUT_PATHS, CLOSED_PUBLIC_CHECKOUT_PATHS } = await import(pathToFileURL(enginePath).href)
  const ubuntu = "https://rbyipalrasawbjpsppgu.supabase.co"
  const plan = planUbuntuUat(ubuntu)
  assert.equal(plan.checkoutEnabled, false)
  assert.equal(plan.cardCheckoutEnabled, true)
  assert.equal(plan.fractionCheckoutEnabled, true)
  assert.equal(plan.nftMarketplaceEnabled, false)
  assert.equal(plan.withDataFromProduction, false)
  assert.equal(plan.writesFinancialRows, false)
  assert.match(plan.steps.join(" "), /Refuse Aureus/)
  assert.throws(
    () => planUbuntuUat("https://fgubaqoftdeefcakejwu.supabase.co"),
    /will not connect to Aureus production/
  )
  assert.doesNotThrow(() => assertUatFlags({
    cards_enabled: "false",
    fractions_enabled: "false",
    marketplace_enabled: "false",
    nft_assets_enabled: "false",
    nft_listing_enabled: "false",
    nft_marketplace_enabled: "false",
  }))
  assert.throws(() => assertUatFlags({ nft_marketplace_enabled: "true" }), /flags must stay false/)
  assert.doesNotThrow(() => assertClosedCheckoutResponse(403, { checkoutEnabled: false }))
  assert.throws(() => assertClosedCheckoutResponse(200, { checkoutEnabled: false }), /403/)
  assert.ok(PUBLIC_CHECKOUT_PATHS.includes("/api/cards/order"))
  assert.ok(OPEN_PUBLIC_CHECKOUT_PATHS.includes("/api/cards/order"))
  assert.ok(OPEN_PUBLIC_CHECKOUT_PATHS.includes("/api/fractions/order"))
  assert.ok(CLOSED_PUBLIC_CHECKOUT_PATHS.includes("/api/nft/order"))
  assert.ok(CLOSED_PUBLIC_CHECKOUT_PATHS.includes("/api/marketplace/order"))
  assert.ok(!CLOSED_PUBLIC_CHECKOUT_PATHS.includes("/api/fractions/order"))
  assert.ok(PUBLIC_CHECKOUT_PATHS.includes("/api/nft/order"))
})

test("UAT runner is Ubuntu-only", {
  skip: !existsSync(runnerPath),
}, () => {
  const source = readFileSync(runnerPath, "utf8")
  assert.match(source, /planUbuntuUat/)
  assert.match(source, /Refuses Aureus production/)
  assert.doesNotMatch(source, /--with-data/)
  assert.doesNotMatch(source, /vercel --prod/)
  assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
  assert.equal(pkg.version, "0.1.59")
})