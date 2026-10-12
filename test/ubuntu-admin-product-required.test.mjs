import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const admin = readFileSync(new URL("../src/routes/admin/index.tsx", import.meta.url), "utf8")
const cards = readFileSync(new URL("../src/routes/admin/cards.tsx", import.meta.url), "utf8")
const fractions = readFileSync(new URL("../src/routes/admin/fractions.tsx", import.meta.url), "utf8")
const kyc = readFileSync(new URL("../src/routes/admin/kyc.tsx", import.meta.url), "utf8")
const ranks = readFileSync(new URL("../src/routes/admin/ranks.tsx", import.meta.url), "utf8")
const kycProfile = readFileSync(new URL("../src/routes/api/admin/kyc/profile.ts", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))

test("Wave O admin shell is Ubuntu desks, not Aureus administration", () => {
  assert.match(admin, /Ubuntu Afrique administration/)
  assert.doesNotMatch(admin, /Aureus administration/)
  assert.match(admin, /FINANCE/)
  assert.match(admin, /KYC/)
  assert.match(admin, /CARD/)
  assert.match(admin, /SHARE/)
  assert.match(admin, /MARKETPLACE/)
  assert.match(admin, /SUPPORT/)
  assert.match(admin, /\/admin\/cards/)
  assert.match(admin, /\/admin\/fractions/)
  assert.match(admin, /\/admin\/kyc/)
  assert.match(admin, /\/admin\/ranks/)
  assert.match(admin, /\/admin\/finance/)
  assert.doesNotMatch(admin, /marketplace_enabled/)
  assert.doesNotMatch(admin, /nft_marketplace_enabled/)
  assert.doesNotMatch(admin, /fgubaqoftdeefcakejwu/)
})

test("Wave O card desk uses existing fulfilment and refund APIs", () => {
  assert.match(cards, /\/api\/admin\/cards\/orders/)
  assert.match(cards, /\/api\/admin\/cards\/status/)
  assert.match(cards, /\/api\/admin\/cards\/refund/)
  assert.match(cards, /x-ua-commerce-confirm/)
  assert.match(cards, /PLASTIC/)
  assert.match(cards, /METAL/)
  assert.doesNotMatch(cards, /fgubaqoftdeefcakejwu/)
})

test("Wave O fraction desk remits without treating reserve as paid", () => {
  assert.match(fractions, /\/api\/admin\/fractions\/orders/)
  assert.match(fractions, /\/api\/admin\/liability\/remit/)
  assert.match(fractions, /\/api\/admin\/fractions\/refund/)
  assert.match(fractions, /Reserved does not mean remitted/)
  assert.match(fractions, /sourceTransactionId/)
  assert.doesNotMatch(fractions, /fgubaqoftdeefcakejwu/)
})

test("Wave O KYC desk reviews Ubuntu profiles only", () => {
  assert.match(kyc, /\/api\/admin\/kyc\/profile/)
  assert.match(kyc, /\/api\/admin\/kyc\/review/)
  assert.match(kyc, /COMPLETED/)
  assert.match(kyc, /REJECTED/)
  assert.doesNotMatch(kyc, /aureusKyc/)
  assert.doesNotMatch(kyc, /kycStatusAureus/)
  assert.match(kycProfile, /authorizeUbuntuStaff/)
  assert.match(kycProfile, /checkoutEnabled: false/)
  assert.match(kycProfile, /loadKycProfile/)
  assert.doesNotMatch(kycProfile, /fgubaqoftdeefcakejwu/)
})

test("Wave O ranks desk does not auto-promote user 10", () => {
  assert.match(ranks, /\/api\/admin\/ranks\/progress/)
  assert.match(ranks, /\/api\/admin\/ranks\/promote/)
  assert.match(ranks, /does not auto-promote/)
  assert.doesNotMatch(ranks, /userId:\s*["']10["']/)
  assert.doesNotMatch(ranks, /setUserId\(["']10["']\)/)
  assert.doesNotMatch(ranks, /fgubaqoftdeefcakejwu/)
})

test("Wave O version is 0.1.61", () => {
  assert.equal(pkg.version, "0.1.61")
})
