import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuHashReuse.mjs`
const persistPath = `${projectRoot}/src/lib/persistHashReuse.server.ts`
const restPath = `${projectRoot}/src/lib/aureusAdminRest.server.ts`
const verifyPath = `${projectRoot}/src/routes/api/payments/verify-bsc.ts`
const nftPath = `${projectRoot}/src/routes/api/nft/order.ts`
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("hash-reuse engine refuses Ubuntu and Aureus collisions and allows same-order idempotent", async () => {
  assert.equal(existsSync(enginePath), true)
  const {
    HASH_REUSED_UBUNTU,
    HASH_REUSED_AUREUS,
    HASH_REUSE_AUREUS_SELECT_REQUIRED,
    HASH_REUSE_SELECT_ONLY,
    aureusHashReuseSelectPath,
    decideHashReuse,
  } = await import(pathToFileURL(enginePath).href)
  assert.match(HASH_REUSED_UBUNTU, /ua_payment_events/)
  assert.match(HASH_REUSED_AUREUS, /crypto_payment_transactions/)
  assert.match(HASH_REUSE_AUREUS_SELECT_REQUIRED, /prod SELECT/)
  assert.equal(HASH_REUSE_SELECT_ONLY, "GET")
  const hash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  const path = aureusHashReuseSelectPath(hash)
  assert.match(path, /^crypto_payment_transactions\?select=/)
  assert.match(path, /transaction_hash=ilike\./)
  assert.doesNotMatch(path, /insert|update|delete|upsert|rpc/i)
  assert.deepEqual(
    decideHashReuse({ ubuntuEvent: null, aureusRow: null, orderId: "ord-1" }),
    { ok: true, ubuntuIdempotent: false }
  )
  assert.deepEqual(
    decideHashReuse({
      ubuntuEvent: { order_id: "ord-1", payment_id: hash },
      aureusRow: null,
      orderId: "ord-1",
    }),
    { ok: true, ubuntuIdempotent: true }
  )
  assert.throws(
    () =>
      decideHashReuse({
        ubuntuEvent: { order_id: "ord-2", payment_id: hash },
        aureusRow: null,
        orderId: "ord-1",
      }),
    /ua_payment_events/
  )
  assert.throws(
    () =>
      decideHashReuse({
        ubuntuEvent: null,
        aureusRow: { id: "cpt-1", transaction_hash: hash },
        orderId: "ord-1",
      }),
    /crypto_payment_transactions/
  )
})

test("hash-reuse persist is Aureus SELECT only and verify-bsc attests after the guard", () => {
  const persist = readFileSync(persistPath, "utf8")
  const rest = readFileSync(restPath, "utf8")
  const verify = readFileSync(verifyPath, "utf8")
  const nft = readFileSync(nftPath, "utf8")
  assert.match(persist, /assertBscHashReusable/)
  assert.match(persist, /aureusRestSelect/)
  assert.match(persist, /selectAureusCryptoPaymentByHash/)
  assert.match(persist, /crypto_payment_transactions\?select=/)
  assert.doesNotMatch(persist, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
  assert.doesNotMatch(persist, /aureus_share_purchases/)
  assert.doesNotMatch(persist, /shopify/i)
  assert.match(rest, /method: "GET"|headers: restHeaders/)
  assert.doesNotMatch(rest, /method:\s*"POST"/)
  assert.match(verify, /assertBscHashReusable/)
  assert.match(verify, /persistBscAttestOnPending/)
  assert.doesNotMatch(verify, /persistMemberPaymentSettle/)
  assert.doesNotMatch(verify, /aureus_share_purchases/)
  assert.doesNotMatch(verify, /shopify/i)
  assert.match(nft, /status: 403/)
  assert.equal(pkg.version, "0.1.68")
})
