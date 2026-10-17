import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuBscVerify.mjs`
const initiatePath = `${projectRoot}/src/routes/api/payments/initiate.ts`
const verifyPath = `${projectRoot}/src/routes/api/payments/verify-bsc.ts`
const payPath = `${projectRoot}/src/routes/dashboard/pay.tsx`
const nftPath = `${projectRoot}/src/routes/api/nft/order.ts`
const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))
const liveAureus = "0x82030544c8184fee4627d52aea67fc575d9bbded"
const ubuntuOnly = "0x1111111111111111111111111111111111111111"

test("dedicated Ubuntu wallet refuses live COMPANY_WALLET_BSC and accepts a distinct receive", async () => {
  assert.equal(existsSync(enginePath), true)
  const {
    AUREUS_LIVE_COMPANY_WALLET_BSC,
    BSC_WALLET_SHARED_REFUSED,
    normalizeWallet,
  } = await import(pathToFileURL(enginePath).href)
  assert.equal(AUREUS_LIVE_COMPANY_WALLET_BSC, liveAureus)
  assert.match(BSC_WALLET_SHARED_REFUSED, /must not be live COMPANY_WALLET_BSC/)
  assert.equal(normalizeWallet(ubuntuOnly.toUpperCase()), ubuntuOnly)
  assert.throws(() => normalizeWallet(liveAureus), /must not be live COMPANY_WALLET_BSC/)
  assert.throws(
    () => normalizeWallet("0x82030544C8184FEE4627D52AEA67FC575D9BBDED"),
    /must not be live COMPANY_WALLET_BSC/
  )
})

test("initiate and verify-bsc 503 the shared Aureus wallet; NFT stays 403; no Shopify", () => {
  const initiate = readFileSync(initiatePath, "utf8")
  const verify = readFileSync(verifyPath, "utf8")
  const pay = readFileSync(payPath, "utf8")
  const nft = readFileSync(nftPath, "utf8")
  assert.match(initiate, /normalizeWallet\(process\.env\.UA_BSC_COMPANY_WALLET/)
  assert.match(verify, /normalizeWallet\(process\.env\.UA_BSC_COMPANY_WALLET/)
  assert.match(verify, /must not be live COMPANY_WALLET_BSC/)
  assert.doesNotMatch(initiate, /shopify/i)
  assert.doesNotMatch(verify, /shopify/i)
  assert.doesNotMatch(verify, /aureus_share_purchases/)
  assert.match(pay, /not live Aureus COMPANY_WALLET_BSC/)
  assert.match(envExample, /Must not be live Aureus COMPANY_WALLET_BSC/)
  assert.doesNotMatch(envExample, /SHOPIFY/)
  assert.match(nft, /status: 403/)
  assert.equal(pkg.version, "0.1.69")
})