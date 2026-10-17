import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import {
  AUREUS_ONBOARD_REFUSED,
  assertNoAureusOnboard,
  buildCivilianOnboard,
  firstRunPath,
  resolveSponsorRef,
} from "../src/lib/ubuntuOnboarding.mjs"

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const registerPage = readFileSync(new URL("../src/routes/auth/register.tsx", import.meta.url), "utf8")
const registerApi = readFileSync(new URL("../src/routes/api/auth/register.ts", import.meta.url), "utf8")
const persist = readFileSync(new URL("../src/lib/persistCivilianOnboard.server.ts", import.meta.url), "utf8")
const dashboard = readFileSync(new URL("../src/routes/dashboard/index.tsx", import.meta.url), "utf8")
const affiliate = readFileSync(new URL("../src/routes/affiliate/index.tsx", import.meta.url), "utf8")
const supabase = readFileSync(new URL("../src/lib/supabase.ts", import.meta.url), "utf8")
const cards = readFileSync(new URL("../src/routes/dashboard/cards.tsx", import.meta.url), "utf8")
const invest = readFileSync(new URL("../src/routes/dashboard/invest.tsx", import.meta.url), "utf8")
const kyc = readFileSync(new URL("../src/routes/dashboard/kyc.tsx", import.meta.url), "utf8")

test("Wave S engine resolves username or id and refuses Aureus / AA777 / self-sponsor", () => {
  const sponsor = resolveSponsorRef("SunLead", [
    { id: 12, username: "SunLead" },
    { id: 99, username: "other" },
  ])
  assert.equal(sponsor.id, "12")
  const byId = resolveSponsorRef("99", [{ id: 99, username: "other" }])
  assert.equal(byId.username, "other")
  assert.equal(resolveSponsorRef("", [{ id: 1, username: "a" }]), null)
  assert.throws(() => resolveSponsorRef("missing", [{ id: 1, username: "a" }]), /sponsor not found/)
  assert.throws(() => assertNoAureusOnboard({ aureusUserId: 7 }), new RegExp(AUREUS_ONBOARD_REFUSED))
  assert.throws(() => buildCivilianOnboard({
    email: "new@example.com",
    username: "AA777",
    authUserId: "00000000-0000-4000-8000-000000000001",
  }), /not AA777/)
  assert.throws(() => buildCivilianOnboard({
    email: "new@example.com",
    username: "new_user",
    authUserId: "00000000-0000-4000-8000-000000000001",
    userId: "12",
    sponsorId: "12",
  }), /Self-sponsor/)
  const row = buildCivilianOnboard({
    email: "New@Example.com",
    username: "new_user",
    authUserId: "00000000-0000-4000-8000-000000000001",
    sponsorCode: "SunLead",
    sponsorId: "12",
  })
  assert.equal(row.email, "new@example.com")
  assert.equal(row.identitySource, "ubuntu")
  assert.equal(row.pendingAureusProvision, false)
  assert.equal(row.aureusUserId, null)
  assert.equal(row.checkoutEnabled, false)
  const path = firstRunPath()
  assert.equal(path.login, "/auth/login")
  assert.equal(path.dashboard, "/dashboard")
  assert.equal(path.kyc, "/dashboard/kyc")
  assert.equal(path.cards, "/dashboard/cards")
  assert.equal(path.invest, "/dashboard/invest")
  assert.equal(path.kycGatesPay, false)
})

test("Wave S register, persist, and first-run stay Ubuntu-only and do not gate pay", () => {
  assert.match(supabase, /\/api\/auth\/register/)
  assert.doesNotMatch(supabase, /ubuntu\.from\(["']ua_users["']\)\.insert/)
  assert.match(registerApi, /persistCivilianOnboard/)
  assert.match(registerApi, /admin.createUser/)
  assert.doesNotMatch(registerApi, /fgubaqoftdeefcakejwu/)
  assert.match(persist, /ua_sponsor_tree/)
  assert.match(persist, /pending_aureus_provision: false/)
  assert.doesNotMatch(persist, /aureus_user_id:/)
  assert.doesNotMatch(persist, /from\("users"\)/)
  assert.match(registerPage, /id="sponsorCode"/)
  assert.match(registerPage, /type="checkbox"/)
  assert.match(registerPage, /KYC does not block/)
  assert.match(dashboard, /\/api\/member\/kyc/)
  assert.match(dashboard, /KYC status/)
  assert.match(dashboard, /\/dashboard\/kyc/)
  assert.match(dashboard, /\/dashboard\/cards/)
  assert.match(dashboard, /\/dashboard\/invest/)
  assert.doesNotMatch(dashboard, /kycStatus === "COMPLETED"/)
  assert.match(affiliate, /username \|\| userId/)
  assert.match(affiliate, /\/auth\/register\?ref=/)
  assert.match(kyc, /auth_token/)
  assert.match(cards, /auth_token/)
  assert.match(invest, /auth_token/)
  assert.doesNotMatch(cards, /kycStatus/)
  assert.doesNotMatch(invest, /kycStatus/)
  assert.equal(existsSync(new URL("../src/lib/ubuntuOnboarding.mjs", import.meta.url)), true)
  assert.equal(pkg.version, "0.1.69")
})
