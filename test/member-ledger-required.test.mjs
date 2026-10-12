import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { buildMemberOverview, summarizeCardOrders, summarizeFractionOwnership, summarizeWalletLedger } from "../src/lib/memberLedger.mjs"

test("wallet credits minus reversals stay separate", () => {
  const wallet = summarizeWalletLedger([
    { entryType: "GAP_COMMISSION", amount: "25.00", status: "posted" },
    { entryType: "BLP", amount: "5.00", status: "posted" },
    { entryType: "REVERSAL", amount: "5.00", status: "posted" },
  ])
  assert.equal(wallet.credits, "30.00")
  assert.equal(wallet.reversals, "5.00")
  assert.equal(wallet.available, "25.00")
  assert.equal(wallet.byType.GAP_COMMISSION, "25.00")
  assert.equal(wallet.byType.BLP, "5.00")
})

test("fraction ownership sums underlying without using ua_investments", () => {
  const fractions = summarizeFractionOwnership([
    { quantity: 1, underlyingShareEquivalent: "0.10" },
    { quantity: 2, underlyingShareEquivalent: "0.20" },
  ])
  assert.equal(fractions.quantity, 3)
  assert.equal(fractions.underlying, "0.30")
})

test("card summary counts PAID only", () => {
  const cards = summarizeCardOrders([
    { orderStatus: "PAID", total: "100.00" },
    { orderStatus: "PENDING_PAYMENT", total: "150.00" },
  ])
  assert.equal(cards.paidCount, 1)
  assert.equal(cards.paidTotal, "100.00")
})

test("member overview rejects investments and Aureus share totals", () => {
  assert.throws(
    () => buildMemberOverview({ investments: [{ amount: 100 }] }),
    /rejects ua_investments/
  )
  assert.throws(
    () => buildMemberOverview({ aureusShares: 12 }),
    /Aureus shares/
  )
  const overview = buildMemberOverview({
    userId: "2",
    username: "uat",
    currentRank: "SSA",
    walletEntries: [{ entryType: "GAP_COMMISSION", amount: "2.50", status: "posted" }],
    fractionRows: [{ quantity: 1, underlyingShareEquivalent: "0.10" }],
    cardRows: [{ orderStatus: "PAID", total: "100.00" }],
    personalQv: "10",
    teamQv: "10",
    monthlyTeamQv: "10",
  })
  assert.equal(overview.book, "ubuntu")
  assert.equal(overview.checkoutEnabled, false)
  assert.equal(overview.cardsEnabled, true)
  assert.equal(overview.fractionsEnabled, true)
  assert.equal(overview.marketplaceEnabled, false)
  assert.equal(overview.nftEnabled, false)
  assert.equal(overview.wallet.available, "2.50")
  assert.equal(overview.fractions.underlying, "0.10")
  assert.equal(overview.cards.paidCount, 1)
  assert.equal(overview.volume.personalQv, "10.00")
})

test("member ledger API and dashboard stay on the Ubuntu book", () => {
  const api = readFileSync(new URL("../src/routes/api/member/ledger.ts", import.meta.url), "utf8")
  assert.match(api, /checkoutEnabled: false/)
  assert.match(api, /loadMemberLedgerSnapshot/)
  assert.match(api, /verifyUaSession/)
  assert.doesNotMatch(api, /ua_investments/)
  assert.doesNotMatch(api, /ua_commissions/)
  assert.doesNotMatch(api, /fgubaqoftdeefcakejwu/)
  assert.match(api, /taken from the Ubuntu book, not the client/)

  const persist = readFileSync(new URL("../src/lib/persistMemberLedger.server.ts", import.meta.url), "utf8")
  assert.match(persist, /ua_wallet_ledger/)
  assert.match(persist, /ua_card_orders/)
  assert.match(persist, /ua_fraction_ownership/)
  assert.match(persist, /ua_team_volume/)
  assert.doesNotMatch(persist, /ua_investments/)
  assert.doesNotMatch(persist, /insert\(/)

  const dashboard = readFileSync(new URL("../src/routes/dashboard/index.tsx", import.meta.url), "utf8")
  assert.match(dashboard, /\/api\/member\/ledger/)
  assert.doesNotMatch(dashboard, /ua_investments/)
  assert.doesNotMatch(dashboard, /ua_commissions/)
  assert.doesNotMatch(dashboard, /1\.125/)
  assert.doesNotMatch(dashboard, /Purchase More Shares/)
})