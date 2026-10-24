import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const persist = readFileSync(new URL("../src/lib/persistMemberOrders.server.ts", import.meta.url), "utf8")
const api = readFileSync(new URL("../src/routes/api/member/orders.ts", import.meta.url), "utf8")
const page = readFileSync(new URL("../src/routes/dashboard/orders.tsx", import.meta.url), "utf8")

test("member orders read ua_card_orders and ua_fraction_transactions only", () => {
  assert.match(persist, /ua_card_orders/)
  assert.match(persist, /ua_fraction_transactions/)
  assert.match(persist, /buyer_id/)
  assert.doesNotMatch(persist, /ua_investments/)
  assert.doesNotMatch(persist, /ua_commissions/)
  assert.doesNotMatch(persist, /insert\(/)
  assert.doesNotMatch(persist, /fgubaqoftdeefcakejwu/)
  assert.match(persist, /marketplaceEnabled: true/)
  assert.match(persist, /nftEnabled: false/)
})

test("member orders API is session GET and does not open marketplace or NFT", () => {
  assert.match(api, /\/api\/member\/orders/)
  assert.match(api, /loadMemberOrders/)
  assert.match(api, /Session required/)
  assert.doesNotMatch(api, /marketplace_enabled/)
  assert.doesNotMatch(api, /nft_marketplace_enabled/)
  assert.doesNotMatch(api, /fgubaqoftdeefcakejwu/)
})

test("orders page pays PENDING_PAYMENT through the member pay gate", () => {
  assert.match(page, /\/api\/member\/orders/)
  assert.match(page, /\/dashboard\/pay/)
  assert.match(page, /PENDING_PAYMENT/)
  assert.doesNotMatch(page, /ua_commissions/)
})
