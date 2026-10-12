/** Read-only Ubuntu report math. Date range required. No money writes. */

import { addMoney, formatMoney2, parseMoney, percentOf } from "./money.mjs"

export const REPORT_PRESETS = Object.freeze(["daily", "weekly", "monthly", "custom"])

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function resolveReportRange(input, now = new Date()) {
  const preset = String(input?.preset || "weekly").toLowerCase()
  if (!REPORT_PRESETS.includes(preset)) {
    throw new Error("Report preset must be daily, weekly, monthly, or custom")
  }
  const current = now instanceof Date ? now : new Date(now)
  if (Number.isNaN(current.getTime())) throw new Error("Report now is invalid")

  if (preset === "custom") {
    const from = new Date(String(input?.from || ""))
    const to = new Date(String(input?.to || ""))
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new Error("Custom report requires from and to")
    }
    if (from.getTime() > to.getTime()) throw new Error("Report from must be before to")
    return { preset, from: from.toISOString(), to: to.toISOString() }
  }

  const end = current
  const start = startOfUtcDay(current)
  if (preset === "weekly") start.setUTCDate(start.getUTCDate() - 6)
  if (preset === "monthly") start.setUTCDate(start.getUTCDate() - 29)
  return { preset, from: start.toISOString(), to: end.toISOString() }
}

function inRange(createdAt, from, to) {
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return false
  return t >= new Date(from).getTime() && t <= new Date(to).getTime()
}

function sumField(rows, field, statusField, paidStatus) {
  let total = parseMoney("0")
  let count = 0
  for (const row of Array.isArray(rows) ? rows : []) {
    if (paidStatus && String(row[statusField] || "") !== paidStatus) continue
    total = addMoney(total, parseMoney(row[field] || "0"))
    count += 1
  }
  return { count, amount: formatMoney2(total) }
}

export function buildReport(input) {
  const range = resolveReportRange(input?.range || input, input?.now)
  const cards = (input?.cardRows || []).filter((row) => inRange(row.createdAt || row.created_at, range.from, range.to))
  const fractions = (input?.fractionRows || []).filter((row) => inRange(row.createdAt || row.created_at, range.from, range.to))
  const commissions = (input?.commissionRows || []).filter((row) => inRange(row.createdAt || row.created_at, range.from, range.to))
  const wallet = (input?.walletRows || []).filter((row) => inRange(row.createdAt || row.created_at, range.from, range.to))
  const settlements = (input?.settlementRows || []).filter((row) => inRange(row.createdAt || row.created_at, range.from, range.to))
  const nftSales = (input?.nftSaleRows || []).filter((row) => inRange(row.createdAt || row.created_at, range.from, range.to))
  const liability = input?.liabilityRows || []

  const cardSales = sumField(cards, "total", "orderStatus", "PAID")
  const fractionSales = sumField(fractions, "total", "transactionStatus", "PAID")
  const salesTotal = formatMoney2(addMoney(parseMoney(cardSales.amount), parseMoney(fractionSales.amount)))

  let gapPaid = parseMoney("0")
  let expected = parseMoney("0")
  const seen = new Set()
  for (const row of commissions) {
    if (String(row.status || "posted") !== "posted") continue
    gapPaid = addMoney(gapPaid, parseMoney(row.amount || "0"))
    const source = String(row.sourceTransactionId || row.source_transaction_id || "")
    if (source && !seen.has(source)) {
      seen.add(source)
      expected = addMoney(expected, percentOf(parseMoney(row.commissionableValue || row.commissionable_value || "0"), "25"))
    }
  }
  const unclaimed = expected > gapPaid ? expected - gapPaid : parseMoney("0")

  let walletLiability = parseMoney("0")
  for (const row of wallet) {
    if (String(row.status || "posted") !== "posted") continue
    if (String(row.entryType || row.entry_type || "") === "REVERSAL") {
      walletLiability = addMoney(walletLiability, -parseMoney(row.amount || "0"))
      continue
    }
    walletLiability = addMoney(walletLiability, parseMoney(row.amount || "0"))
  }

  const liabilityByType = {}
  for (const row of liability) {
    const type = String(row.entryType || row.entry_type || "UNKNOWN")
    liabilityByType[type] = formatMoney2(addMoney(parseMoney(liabilityByType[type] || "0"), parseMoney(row.amount || "0")))
  }

  let qv = parseMoney("0")
  for (const row of cards) {
    if (String(row.orderStatus || row.order_status || "") !== "PAID") continue
    qv = addMoney(qv, parseMoney(row.qv || "0"))
  }
  for (const row of fractions) {
    if (String(row.transactionStatus || row.transaction_status || "") !== "PAID") continue
    qv = addMoney(qv, parseMoney(row.qv || "0"))
  }

  let settlementTotal = parseMoney("0")
  for (const row of settlements) {
    settlementTotal = addMoney(settlementTotal, parseMoney(row.amount || "0"))
  }

  return {
    range,
    cardSales,
    fractionSales,
    salesTotal,
    qv: formatMoney2(qv),
    gapPaid: formatMoney2(gapPaid),
    unclaimedGap: formatMoney2(unclaimed),
    walletLiability: formatMoney2(walletLiability),
    remainingUnderlying: String(input?.remainingUnderlying || "0"),
    userRankCount: Number(input?.userRankCount || 0),
    teamVolumeRows: Number(input?.teamVolumeRows || 0),
    liabilityByType,
    marketplaceSettlement: formatMoney2(settlementTotal),
    nftSalesCount: nftSales.length,
    checkoutEnabled: false,
    marketplaceEnabled: false,
    nftEnabled: false,
  }
}
