import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const orders = readFileSync(new URL("../src/lib/persistMemberOrders.server.ts", import.meta.url), "utf8")
const networkApi = readFileSync(new URL("../src/routes/api/member/network.ts", import.meta.url), "utf8")
const networkTree = readFileSync(new URL("../src/lib/networkTree.mjs", import.meta.url), "utf8")
const reports = readFileSync(new URL("../src/lib/reportEngine.mjs", import.meta.url), "utf8")
const nftOrder = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const closeout = readFileSync(new URL("../src/lib/ubuntuSecretAdminCloseout.mjs", import.meta.url), "utf8")

test("named-open read APIs report marketplace true and NFT false", () => {
  assert.match(orders, /marketplaceEnabled: true/)
  assert.match(orders, /nftEnabled: false/)
  assert.match(networkApi, /marketplaceEnabled: true/)
  assert.match(networkApi, /nftMarketplaceEnabled: false/)
  assert.match(networkTree, /marketplaceEnabled: true/)
  assert.match(networkTree, /nftMarketplaceEnabled: false/)
  assert.match(reports, /marketplaceEnabled: true/)
  assert.match(reports, /nftEnabled: false/)
  assert.match(closeout, /marketplaceEnabled: false/)
  assert.match(nftOrder, /status: 403/)
  assert.doesNotMatch(orders, /fgubaqoftdeefcakejwu/)
  assert.equal(pkg.version, "0.1.71")
})
