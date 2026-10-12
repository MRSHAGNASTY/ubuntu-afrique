import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuFinancialUat.mjs`
const runnerPath = `${projectRoot}/deploy/ubuntu-financial-uat.mjs`
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("financial UAT refuses Aureus and keeps checkout closed", {
  skip: !existsSync(enginePath),
}, async () => {
  const { planUbuntuFinancialUat } = await import(pathToFileURL(enginePath).href)
  const plan = planUbuntuFinancialUat("https://rbyipalrasawbjpsppgu.supabase.co")
  assert.equal(plan.checkoutEnabled, false)
  assert.equal(plan.nftMarketplaceEnabled, false)
  assert.equal(plan.withDataFromProduction, false)
  assert.equal(plan.writesFinancialRows, true)
  assert.equal(plan.dummyOnly, true)
  assert.throws(
    () => planUbuntuFinancialUat("https://fgubaqoftdeefcakejwu.supabase.co"),
    /will not connect to Aureus production/
  )
})

test("financial UAT runner is Ubuntu-only dummy CARD or FRACTION path", {
  skip: !existsSync(runnerPath),
}, () => {
  const source = readFileSync(runnerPath, "utf8")
  assert.match(source, /createPendingCardOrder/)
  assert.match(source, /createPendingFractionOrder/)
  assert.match(source, /recordPaymentEvent/)
  assert.match(source, /confirmCommercePayment/)
  assert.match(source, /UA_STAGING/)
  assert.match(source, /checkoutEnabled: false/)
  assert.doesNotMatch(source, /vercel --prod/)
  assert.doesNotMatch(source, /--with-data/)
  assert.equal(pkg.version, "0.1.61")
})