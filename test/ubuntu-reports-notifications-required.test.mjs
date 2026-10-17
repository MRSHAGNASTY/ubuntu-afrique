import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import {
  buildNotification,
  notificationForPayment,
  notificationForKycReview,
} from "../src/lib/notificationEngine.mjs"
import { buildReport, resolveReportRange } from "../src/lib/reportEngine.mjs"

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const schema = readFileSync(new URL("../supabase/ubuntu-only/0023_ua_notifications.sql", import.meta.url), "utf8")
const notifyPersist = readFileSync(new URL("../src/lib/persistNotification.server.ts", import.meta.url), "utf8")
const reportPersist = readFileSync(new URL("../src/lib/persistReports.server.ts", import.meta.url), "utf8")
const memberApi = readFileSync(new URL("../src/routes/api/member/notifications.ts", import.meta.url), "utf8")
const adminApi = readFileSync(new URL("../src/routes/api/admin/reports.ts", import.meta.url), "utf8")
const notifyPage = readFileSync(new URL("../src/routes/dashboard/notifications.tsx", import.meta.url), "utf8")
const reportPage = readFileSync(new URL("../src/routes/admin/reports.tsx", import.meta.url), "utf8")
const settle = readFileSync(new URL("../src/lib/persistMemberPaymentSettle.server.ts", import.meta.url), "utf8")

test("notification engine is in_app only and refuses Aureus", () => {
  const note = buildNotification({
    userId: 10,
    event: "PAYMENT_SUCCESSFUL",
    title: "Payment successful",
    body: "Ubuntu staging payment settled",
  })
  assert.equal(note.channel, "in_app")
  assert.equal(note.checkoutEnabled, false)
  assert.throws(
    () => buildNotification({ userId: 10, event: "PAYMENT_SUCCESSFUL", title: "x", body: "fgubaqoftdeefcakejwu" }),
    /Aureus production/
  )
  assert.throws(
    () => buildNotification({ userId: 10, event: "PAYMENT_SUCCESSFUL", title: "x", body: "y", channel: "email" }),
    /in_app only/
  )
  const paid = notificationForPayment({ userId: 4, kind: "CARD", orderId: "ord-1" })
  assert.equal(paid.length, 2)
  assert.equal(notificationForKycReview({ userId: 4, status: "COMPLETED" }).event, "KYC_REVIEWED")
})

test("report range and paid sales use fixed-point money", () => {
  const weekly = resolveReportRange({ preset: "weekly" }, new Date("2026-10-12T12:00:00.000Z"))
  assert.equal(weekly.preset, "weekly")
  const report = buildReport({
    range: { preset: "custom", from: "2026-10-01T00:00:00.000Z", to: "2026-10-12T23:59:59.000Z" },
    cardRows: [
      { createdAt: "2026-10-07T00:00:00.000Z", total: "100.00", qv: "100.00", orderStatus: "PAID" },
      { createdAt: "2026-10-07T00:00:00.000Z", total: "150.00", qv: "150.00", orderStatus: "PENDING_PAYMENT" },
    ],
    fractionRows: [
      { createdAt: "2026-10-07T00:00:00.000Z", total: "10.00", qv: "10.00", transactionStatus: "PAID" },
    ],
    commissionRows: [
      {
        createdAt: "2026-10-07T00:00:00.000Z",
        amount: "25.00",
        status: "posted",
        sourceTransactionId: "card-1",
        commissionableValue: "100.00",
      },
    ],
    walletRows: [{ createdAt: "2026-10-07T00:00:00.000Z", amount: "25.00", status: "posted", entryType: "GAP_COMMISSION" }],
    settlementRows: [],
    nftSaleRows: [],
    liabilityRows: [{ entry_type: "FRACTION_RESERVE", amount: "5.00" }],
    remainingUnderlying: "99997.90",
    userRankCount: 1,
    teamVolumeRows: 1,
  })
  assert.equal(report.cardSales.count, 1)
  assert.equal(report.cardSales.amount, "100.00")
  assert.equal(report.fractionSales.amount, "10.00")
  assert.equal(report.salesTotal, "110.00")
  assert.equal(report.gapPaid, "25.00")
  assert.equal(report.unclaimedGap, "0.00")
  assert.equal(report.nftSalesCount, 0)
  assert.equal(report.marketplaceEnabled, false)
  assert.equal(report.nftEnabled, false)
})

test("Wave P sources stay on Ubuntu and do not write money", () => {
  assert.match(schema, /NEVER run this on Aureus production/)
  assert.match(schema, /ua_notifications/)
  assert.match(notifyPersist, /ua_notifications/)
  assert.match(notifyPersist, /persistNotificationQuiet/)
  assert.doesNotMatch(reportPersist, /\.insert\(/)
  assert.doesNotMatch(reportPersist, /\.update\(/)
  assert.match(reportPersist, /ua_card_orders/)
  assert.match(reportPersist, /ua_nft_sales/)
  assert.match(memberApi, /Session required/)
  assert.match(adminApi, /authorizeUbuntuStaff/)
  assert.match(notifyPage, /\/api\/member\/notifications/)
  assert.match(reportPage, /\/api\/admin\/reports/)
  assert.match(reportPage, /Daily/)
  assert.match(settle, /notificationForPayment/)
  assert.doesNotMatch(schema, /INSERT INTO public\.users/)
  assert.doesNotMatch(adminApi, /fgubaqoftdeefcakejwu/)
  assert.equal(pkg.version, "0.1.69")
})
