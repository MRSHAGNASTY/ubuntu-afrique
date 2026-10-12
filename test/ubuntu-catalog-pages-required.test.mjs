import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuCatalog.mjs`
const marketPage = `${projectRoot}/src/routes/marketplace/index.tsx`
const companyPage = `${projectRoot}/src/routes/marketplace/company/$slug.tsx`
const companyDash = `${projectRoot}/src/routes/marketplace/dashboard.tsx`
const nftPage = `${projectRoot}/src/routes/nft/index.tsx`
const nftDash = `${projectRoot}/src/routes/dashboard/nft.tsx`
const publicMarketOrder = readFileSync(new URL("../src/routes/api/marketplace/order.ts", import.meta.url), "utf8")
const publicNftOrder = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("Wave K catalog search and company slug render from Ubuntu data", {
  skip: !existsSync(enginePath),
}, async () => {
  const { filterMarketplaceCatalog, filterNftPreview, assertNoAffiliateLeak, catalogFlags } = await import(pathToFileURL(enginePath).href)
  const catalog = filterMarketplaceCatalog({
    query: "wave",
    companies: [
      { id: "UAT_CO_WAVE_H", name: "Ubuntu Wave H dummy company", settlementWallet: "UAT-WAVE-H", isActive: true },
      { id: "OTHER", name: "Other Co", isActive: true },
    ],
    products: [
      { productId: "UAT_MKT_100", companyId: "UAT_CO_WAVE_H", name: "Wave H dummy $100", retailPrice: "100.00" },
    ],
  })
  assert.equal(catalog.companies.length, 1)
  assert.equal(catalog.companies[0].id, "UAT_CO_WAVE_H")
  assert.equal(catalog.products[0].retailPrice, "100.00")
  assert.equal(catalog.checkoutEnabled, false)
  assert.equal(catalog.marketplaceEnabled, false)
  assert.doesNotThrow(() => catalog.companies.forEach(assertNoAffiliateLeak))
  assert.throws(
    () => assertNoAffiliateLeak({ id: "X", settlementWallet: "hidden" }),
    /Affiliate fields/
  )
  const company = filterMarketplaceCatalog({
    slug: "UAT_CO_WAVE_H",
    companies: [{ id: "UAT_CO_WAVE_H", name: "Ubuntu Wave H dummy company", isActive: true }],
    products: [{ productId: "UAT_MKT_100", companyId: "UAT_CO_WAVE_H", name: "Wave H dummy $100", retailPrice: "100.00" }],
  })
  assert.equal(company.products.length, 1)
  const nft = filterNftPreview([
    { id: "L1", nftId: "NFT-1", sellerId: "A", sponsorId: "SP", price: "1000.00", status: "LISTED" },
  ])
  assert.equal(nft.listings[0].price, "1000.00")
  assert.equal(nft.nftMarketplaceEnabled, false)
  assert.equal(nft.purchaseOpen, false)
  assert.doesNotMatch(JSON.stringify(nft.listings[0]), /sponsor/)
  assert.equal(catalogFlags({ marketplaceEnabled: false, nftMarketplaceEnabled: false }).comingSoon, true)
})

test("Wave K pages stay Coming Soon and do not open buy routes", () => {
  for (const path of [marketPage, companyPage, companyDash, nftPage, nftDash]) {
    assert.equal(existsSync(path), true)
    const source = readFileSync(path, "utf8")
    assert.match(source, /Coming Soon/)
    assert.doesNotMatch(source, /\/api\/marketplace\/order/)
    assert.doesNotMatch(source, /\/api\/nft\/order/)
    assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
  }
  assert.match(readFileSync(marketPage, "utf8"), /\/api\/marketplace\/companies/)
  assert.match(readFileSync(nftPage, "utf8"), /\/api\/nft\/listings/)
  assert.match(readFileSync(nftDash, "utf8"), /\/api\/nft\/my-assets/)
  assert.match(publicMarketOrder, /status: 403/)
  assert.match(publicNftOrder, /status: 403/)
  assert.equal(pkg.version, "0.1.60")
})
