import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { NFT_PRODUCTION_DISABLED, quoteNftDistribution } from "../src/lib/nftDistribution.mjs"

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const shareholder = readFileSync(new URL("../src/routes/dashboard/nft.tsx", import.meta.url), "utf8")
const listings = readFileSync(new URL("../src/routes/nft/index.tsx", import.meta.url), "utf8")
const listing = readFileSync(new URL("../src/routes/nft/listing/$id.tsx", import.meta.url), "utf8")
const admin = readFileSync(new URL("../src/routes/admin/nft.tsx", import.meta.url), "utf8")
const assetsApi = readFileSync(new URL("../src/routes/api/admin/nft/assets.ts", import.meta.url), "utf8")
const publicOrder = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const persist = readFileSync(new URL("../src/lib/persistNft.server.ts", import.meta.url), "utf8")

test("Wave R quote is read-only 5/5/5/5/80", () => {
  const quote = quoteNftDistribution("1000.00")
  assert.equal(quote.aureus, "50.00")
  assert.equal(quote.sun, "50.00")
  assert.equal(quote.special, "50.00")
  assert.equal(quote.networkGap, "50.00")
  assert.equal(quote.currentSeller, "800.00")
  assert.equal(quote.nftMarketplaceEnabled, false)
  assert.equal(quote.checkoutEnabled, false)
  assert.match(NFT_PRODUCTION_DISABLED, /1,400,000/)
})

test("Wave R pages preview only and do not buy or transfer", () => {
  for (const source of [shareholder, listings, listing, admin]) {
    assert.match(source, /Coming Soon|Buy stays 403|Purchase stays 403|buy stays 403/)
    assert.doesNotMatch(source, /\/api\/nft\/order/)
    assert.doesNotMatch(source, /\/api\/admin\/nft\/settle/)
    assert.doesNotMatch(source, /persistNftSettlement/)
    assert.doesNotMatch(source, /nft_marketplace_enabled\s*=\s*true/)
    assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
  }
  assert.match(shareholder, /\/api\/nft\/my-assets/)
  assert.match(shareholder, /owned assets/)
  assert.match(listings, /quoteNftDistribution/)
  assert.match(listings, /disabled/)
  assert.match(listing, /Confirm disabled/)
  assert.match(listing, /NFT_PRODUCTION_DISABLED/)
  assert.match(admin, /\/api\/admin\/nft\/assets/)
  assert.match(admin, /\/api\/admin\/nft\/recon/)
  assert.match(assetsApi, /GET:/)
  assert.match(assetsApi, /loadNftAssets/)
  assert.match(persist, /export async function loadNftAssets/)
  assert.match(publicOrder, /status: 403/)
  assert.equal(existsSync(new URL("../src/routes/admin/nft.tsx", import.meta.url)), true)
  assert.equal(pkg.version, "0.1.65")
})
