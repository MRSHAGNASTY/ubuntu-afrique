import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const runnerPath = `${projectRoot}/deploy/ubuntu-public-card-uat.mjs`
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("public CARD UAT runner is Ubuntu-only pending and does not confirm", {
  skip: !existsSync(runnerPath),
}, () => {
  const source = readFileSync(runnerPath, "utf8")
  assert.match(source, /rejectPublicCardClientOverrides/)
  assert.match(source, /PENDING_PAYMENT/)
  assert.match(source, /ua_card_orders/)
  assert.doesNotMatch(source, /confirmCommercePayment/)
  assert.doesNotMatch(source, /ua_fraction_transactions/)
  assert.doesNotMatch(source, /--with-data/)
  assert.doesNotMatch(source, /vercel --prod/)
  assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
  assert.match(source, /nft_marketplace_enabled/)
  assert.equal(pkg.version, "0.1.57")
})
