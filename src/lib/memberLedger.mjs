/** Ubuntu member book. Wallet, rank, cards, fractions only. Marketplace/NFT stay closed. */

import { addMoney, formatMoney2, parseMoney } from "./money.mjs"

const CREDIT_TYPES = new Set([
  "GAP_COMMISSION",
  "BLP",
  "DIRECT_COMMISSION",
  "NFT_SELLER",
  "NFT_SPONSOR",
  "NFT_ORIGINAL_SELLER",
  "NFT_GAP",
])

export function summarizeWalletLedger(entries) {
  let credits = parseMoney("0")
  let reversals = parseMoney("0")
  const byType = {}
  for (const row of Array.isArray(entries) ? entries : []) {
    if (String(row.status || "posted") !== "posted") continue
    const amount = parseMoney(row.amount)
    const type = String(row.entryType || "")
    if (type === "REVERSAL") {
      reversals = addMoney(reversals, amount)
      continue
    }
    if (!CREDIT_TYPES.has(type)) continue
    credits = addMoney(credits, amount)
    byType[type] = formatMoney2(addMoney(parseMoney(byType[type] || "0"), amount))
  }
  return {
    available: formatMoney2(addMoney(credits, -reversals)),
    credits: formatMoney2(credits),
    reversals: formatMoney2(reversals),
    byType,
  }
}

export function summarizeFractionOwnership(rows) {
  let quantity = 0
  let underlying = parseMoney("0")
  for (const row of Array.isArray(rows) ? rows : []) {
    quantity += Number(row.quantity) || 0
    underlying = addMoney(underlying, parseMoney(row.underlyingShareEquivalent || "0"))
  }
  return {
    quantity,
    underlying: formatMoney2(underlying),
  }
}

export function summarizeCardOrders(rows) {
  let paidCount = 0
  let paidTotal = parseMoney("0")
  for (const row of Array.isArray(rows) ? rows : []) {
    if (String(row.orderStatus || "") !== "PAID") continue
    paidCount += 1
    paidTotal = addMoney(paidTotal, parseMoney(row.total || "0"))
  }
  return {
    paidCount,
    paidTotal: formatMoney2(paidTotal),
  }
}

export function buildMemberOverview(input) {
  if (input?.investments != null || input?.aureusShares != null || input?.clientWallet != null) {
    throw new Error("Member overview rejects ua_investments, Aureus shares, and client wallet totals")
  }
  const wallet = summarizeWalletLedger(input?.walletEntries)
  const fractions = summarizeFractionOwnership(input?.fractionRows)
  const cards = summarizeCardOrders(input?.cardRows)
  const volume = {
    personalQv: formatMoney2(parseMoney(input?.personalQv || "0")),
    teamQv: formatMoney2(parseMoney(input?.teamQv || "0")),
    monthlyTeamQv: formatMoney2(parseMoney(input?.monthlyTeamQv || "0")),
  }
  return {
    book: "ubuntu",
    checkoutEnabled: false,
    cardsEnabled: true,
    fractionsEnabled: true,
    marketplaceEnabled: false,
    nftEnabled: false,
    userId: String(input?.userId || ""),
    username: String(input?.username || ""),
    email: String(input?.email || ""),
    currentRank: String(input?.currentRank || "SSA"),
    wallet,
    cards,
    fractions,
    volume,
    progress: input?.progress || null,
  }
}
