import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const affiliate = readFileSync(new URL("../src/routes/affiliate/index.tsx", import.meta.url), "utf8")

test("affiliate page uses Ubuntu network and wallet APIs, not ua_commissions", () => {
  assert.match(affiliate, /\/api\/member\/network/)
  assert.match(affiliate, /\/api\/member\/wallet/)
  assert.match(affiliate, /\/auth\/register\?ref=/)
  assert.doesNotMatch(affiliate, /ua_commissions/)
  assert.doesNotMatch(affiliate, /shares_bonus/)
  assert.doesNotMatch(affiliate, /total_invested/)
  assert.doesNotMatch(affiliate, /fgubaqoftdeefcakejwu/)
})
