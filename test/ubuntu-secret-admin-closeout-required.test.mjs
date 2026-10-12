import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"
import { settleMarketplaceOrder } from "../src/lib/marketplaceSettlement.mjs"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuSecretAdminCloseout.mjs`
const runnerPath = `${projectRoot}/deploy/ubuntu-secret-admin-closeout.mjs`
const schema8 = readFileSync(new URL("../supabase/ubuntu-only/0008_ua_price_version_seeds.sql", import.meta.url), "utf8")
const persistPricing = readFileSync(new URL("../src/lib/persistPricing.server.ts", import.meta.url), "utf8")
const persistLiability = readFileSync(new URL("../src/lib/persistLiability.server.ts", import.meta.url), "utf8")
const remitApi = readFileSync(new URL("../src/routes/api/admin/liability/remit.ts", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("Wave H closeout refuses Aureus and keeps checkout closed", {
  skip: !existsSync(enginePath),
}, async () => {
  const {
    planUbuntuSecretAdminCloseout,
    assertCloseoutFlags,
    assertMarketplaceDummySettle,
    assertReservedNotRemitted,
    assertRequiredPriceVersions,
  } = await import(pathToFileURL(enginePath).href)

  const plan = planUbuntuSecretAdminCloseout("https://rbyipalrasawbjpsppgu.supabase.co")
  assert.equal(plan.checkoutEnabled, false)
  assert.equal(plan.marketplaceEnabled, false)
  assert.equal(plan.nftMarketplaceEnabled, false)
  assert.equal(plan.withDataFromProduction, false)
  assert.equal(plan.writesFinancialRows, true)
  assert.equal(plan.dummyOnly, true)
  assert.match(plan.steps.join(" "), /0008/)
  assert.match(plan.steps.join(" "), /persistLiabilityRemitted/)
  assert.throws(
    () => planUbuntuSecretAdminCloseout("https://fgubaqoftdeefcakejwu.supabase.co"),
    /will not connect to Aureus production/
  )
  assert.doesNotThrow(() => assertCloseoutFlags({
    marketplace_enabled: "false",
    nft_assets_enabled: "false",
    nft_listing_enabled: "false",
    nft_marketplace_enabled: "false",
  }))
  assert.throws(
    () => assertCloseoutFlags({
      marketplace_enabled: "true",
      nft_assets_enabled: "false",
      nft_listing_enabled: "false",
      nft_marketplace_enabled: "false",
    }),
    /flags must stay false/
  )
  assert.doesNotThrow(() => assertRequiredPriceVersions(["CARD_PLASTIC", "CARD_METAL", "AUREUS_FRACTION"]))
  assert.throws(() => assertRequiredPriceVersions(["CARD_PLASTIC"]), /0008 price versions missing/)
  assert.doesNotThrow(() => assertReservedNotRemitted({ remitted: "10.00", reservedEqualsRemitted: false }))
  assert.doesNotThrow(() => assertMarketplaceDummySettle({
    retailPrice: "100.00",
    checkoutEnabled: false,
    gapCover: { totalPaid: "25.00", compPlanVersion: "GAP_COVER_V1" },
  }))
})

test("Wave H marketplace dummy settle is $100 / Gap $25", () => {
  const settled = settleMarketplaceOrder({
    order: {
      id: "UAT-MKT-100",
      total: "100.00",
      commissionableValue: "100.00",
      companyPayout: "40.00",
      gapSchedule: "STANDARD_25",
    },
    members: [{ userId: "vp", rank: "VP", isActive: true }],
    company: { id: "UAT_CO", isActive: true, payout: "40.00" },
  })
  assert.equal(settled.gapCover.totalPaid, "25.00")
  assert.equal(settled.companyPayout, "40.00")
  assert.equal(settled.checkoutEnabled, false)
})

test("Wave H remit API, 0008 seeds, and runner stay Ubuntu-only", {
  skip: !existsSync(runnerPath),
}, () => {
  const source = readFileSync(runnerPath, "utf8")
  assert.match(source, /planUbuntuSecretAdminCloseout/)
  assert.match(source, /0008/)
  assert.match(source, /FRACTION_REMITTED/)
  assert.match(source, /settleMarketplaceOrder/)
  assert.match(source, /checkoutEnabled: false/)
  assert.doesNotMatch(source, /vercel --prod/)
  assert.doesNotMatch(source, /--with-data/)
  assert.match(schema8, /NEVER run on Aureus fgubaqoftdeefcakejwu/)
  assert.match(persistPricing, /applyMissingOpenPriceVersions/)
  assert.match(persistLiability, /remitPaidFractionLiability/)
  assert.match(persistLiability, /persistLiabilityRemitted/)
  assert.match(remitApi, /authorizeUbuntuStaff/)
  assert.match(remitApi, /taken from the paid Ubuntu fraction/)
  assert.equal(pkg.version, "0.1.65")
})
