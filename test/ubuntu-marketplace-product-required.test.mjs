import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { filterMarketplaceCatalog } from "../src/lib/ubuntuCatalog.mjs"

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const productsPage = readFileSync(new URL("../src/routes/marketplace/products.tsx", import.meta.url), "utf8")
const productPage = readFileSync(new URL("../src/routes/marketplace/product/$slug.tsx", import.meta.url), "utf8")
const categoryPage = readFileSync(new URL("../src/routes/marketplace/category/$slug.tsx", import.meta.url), "utf8")
const dashboard = readFileSync(new URL("../src/routes/marketplace/dashboard.tsx", import.meta.url), "utf8")
const admin = readFileSync(new URL("../src/routes/admin/marketplace.tsx", import.meta.url), "utf8")
const publicOrder = readFileSync(new URL("../src/routes/api/marketplace/order.ts", import.meta.url), "utf8")
const catalog = readFileSync(new URL("../src/lib/ubuntuCatalog.mjs", import.meta.url), "utf8")

test("Wave Q catalog filter uses extra fields only when present", () => {
  const plain = filterMarketplaceCatalog({
    query: "wave",
    companies: [{ id: "UAT_CO_WAVE_H", name: "Ubuntu Wave H dummy company", isActive: true }],
    products: [
      { productId: "UAT_MKT_100", companyId: "UAT_CO_WAVE_H", name: "Wave H dummy $100", retailPrice: "100.00" },
      { productId: "UAT_MKT_40", companyId: "UAT_CO_WAVE_H", name: "Wave H dummy $40", retailPrice: "40.00" },
    ],
    category: "missing",
    country: "ZA",
    featured: true,
    sort: "price",
  })
  assert.equal(plain.products.length, 2)
  assert.equal(plain.products[0].retailPrice, "40.00")
  assert.equal(plain.marketplaceEnabled, false)
  assert.equal(plain.comingSoon, true)

  const typed = filterMarketplaceCatalog({
    companies: [{ id: "CO1", name: "Co", isActive: true }],
    products: [
      { productId: "A", companyId: "CO1", name: "Alpha", retailPrice: "10.00", type: "MARKETPLACE", category: "cards" },
      { productId: "B", companyId: "CO1", name: "Beta", retailPrice: "20.00", type: "MARKETPLACE", category: "gifts" },
    ],
    category: "cards",
    type: "MARKETPLACE",
  })
  assert.equal(typed.products.length, 1)
  assert.equal(typed.products[0].productId, "A")
  const one = filterMarketplaceCatalog({
    companies: [{ id: "CO1", name: "Co", isActive: true }],
    products: [{ productId: "A", companyId: "CO1", name: "Alpha", retailPrice: "10.00" }],
    productSlug: "A",
  })
  assert.equal(one.products[0].slug, "A")
})

test("Wave Q pages browse only and keep public buy closed", () => {
  for (const source of [productsPage, productPage, categoryPage, dashboard, admin]) {
    assert.match(source, /Coming Soon|Buy stays 403|Public buy stays 403|buy stays 403/)
    assert.doesNotMatch(source, /\/api\/marketplace\/order/)
    assert.doesNotMatch(source, /\/api\/admin\/marketplace\/settle/)
    assert.doesNotMatch(source, /marketplace_enabled\s*=\s*true/)
    assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
  }
  assert.match(productsPage, /\/marketplace\/product\/\$slug/)
  assert.match(productPage, /View only/)
  assert.match(dashboard, /inventory/)
  assert.doesNotMatch(dashboard, /sponsorId|affiliateCode|settlementWallet/)
  assert.match(admin, /\/api\/admin\/marketplace\/companies/)
  assert.match(admin, /\/api\/admin\/marketplace\/products/)
  assert.match(admin, /\/api\/admin\/marketplace\/media/)
  assert.match(publicOrder, /status: 403/)
  assert.match(catalog, /featured/)
  assert.equal(existsSync(new URL("../src/routes/marketplace/products.tsx", import.meta.url)), true)
  assert.equal(pkg.version, "0.1.59")
})
