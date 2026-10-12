import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { summarizeWalletLedger } from "../src/lib/memberLedger.mjs"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const persistPath = `${projectRoot}/src/lib/persistWalletRead.server.ts`
const apiPath = `${projectRoot}/src/routes/api/member/wallet.ts`
const pagePath = `${projectRoot}/src/routes/dashboard/wallet.tsx`

const aureusTableNames = [
  /from\(["']users["']\)/,
  /from\(["']investments["']\)/,
  /from\(["']share_sales["']\)/,
  /from\(["']share_transactions["']\)/,
  /from\(["']client_wallets["']\)/,
  /from\(["']commissions["']\)/,
  /ua_investments/,
  /fgubaqoftdeefcakejwu/,
]

test("summarizeWalletLedger is the wallet available source", () => {
  const wallet = summarizeWalletLedger([
    { entryType: "GAP_COMMISSION", amount: "25.00", status: "posted" },
    { entryType: "BLP", amount: "5.00", status: "posted" },
    { entryType: "REVERSAL", amount: "5.00", status: "posted" },
    { entryType: "GAP_COMMISSION", amount: "9.00", status: "voided" },
  ])
  assert.equal(wallet.credits, "30.00")
  assert.equal(wallet.reversals, "5.00")
  assert.equal(wallet.available, "25.00")
})

test("wallet persist, API, and page stay Ubuntu read-only", () => {
  assert.equal(existsSync(persistPath), true)
  assert.equal(existsSync(apiPath), true)
  assert.equal(existsSync(pagePath), true)

  const persist = readFileSync(persistPath, "utf8")
  const api = readFileSync(apiPath, "utf8")
  const page = readFileSync(pagePath, "utf8")

  assert.match(persist, /summarizeWalletLedger/)
  assert.match(persist, /from\(["']ua_wallet_ledger["']\)/)
  assert.match(persist, /\.in\(["']status["'], \["posted", "voided"\]\)/)
  assert.doesNotMatch(persist, /\.insert\(/)
  assert.doesNotMatch(persist, /\.update\(/)
  assert.doesNotMatch(persist, /\.upsert\(/)
  assert.doesNotMatch(persist, /\.delete\(/)

  assert.match(api, /import \{ summarizeWalletLedger \}/)
  assert.match(api, /summarizeWalletLedger\(snapshot\.entries\)/)
  assert.match(api, /loadWalletLedger/)
  assert.match(api, /bearerToken/)
  assert.match(api, /status: 401/)
  assert.match(api, /Session required/)
  assert.doesNotMatch(api, /wallet_balance/)
  assert.doesNotMatch(api, /\.insert\(/)
  assert.doesNotMatch(api, /\.update\(/)

  assert.match(page, /createFileRoute\(["']\/dashboard\/wallet["']\)/)
  assert.match(page, /\/api\/member\/wallet/)
  assert.match(page, /summary\?\.available/)
  assert.match(page, /summary\?\.credits/)
  assert.match(page, /summary\?\.reversals/)
  assert.match(page, /byType/)
  assert.match(page, /<table/)
  assert.doesNotMatch(page, /wallet_balance/)
  assert.doesNotMatch(page, /<input/)

  for (const source of [persist, api, page]) {
    for (const banned of aureusTableNames) {
      assert.doesNotMatch(source, banned)
    }
    assert.doesNotMatch(source, /wallet_balance/)
  }
})
