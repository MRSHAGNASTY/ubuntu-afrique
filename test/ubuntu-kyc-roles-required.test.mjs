import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuKyc.mjs`
const schema20 = readFileSync(new URL("../supabase/ubuntu-only/0020_ua_kyc_admin_roles.sql", import.meta.url), "utf8")
const persist = readFileSync(new URL("../src/lib/persistKyc.server.ts", import.meta.url), "utf8")
const memberApi = readFileSync(new URL("../src/routes/api/member/kyc.ts", import.meta.url), "utf8")
const reviewApi = readFileSync(new URL("../src/routes/api/admin/kyc/review.ts", import.meta.url), "utf8")
const rolesApi = readFileSync(new URL("../src/routes/api/admin/roles.ts", import.meta.url), "utf8")
const auth = readFileSync(new URL("../src/lib/ubuntuAdminAuthorize.server.ts", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("Wave I KYC states are pending, completed, and rejected on Ubuntu", {
  skip: !existsSync(enginePath),
}, async () => {
  const { submitKycProfile, reviewKycProfile, assertNoAureusKycInput } = await import(pathToFileURL(enginePath).href)
  const pending = submitKycProfile({ userId: 3, fullName: "Ada Ubuntu", country: "za" })
  assert.equal(pending.status, "PENDING")
  assert.equal(pending.country, "ZA")
  assert.equal(pending.checkoutEnabled, false)
  assert.throws(() => submitKycProfile({ userId: 3, fullName: "Ada", country: "ZA", status: "COMPLETED" }), /PENDING/)
  assert.throws(() => submitKycProfile({ userId: 3, fullName: "Ada", country: "ZA", aureusKycId: "1" }), /Aureus KYC/)
  const completed = reviewKycProfile({ userId: 3, currentStatus: "PENDING", decision: "COMPLETED" })
  assert.equal(completed.status, "COMPLETED")
  const rejected = reviewKycProfile({
    userId: 3,
    currentStatus: "PENDING",
    decision: "REJECTED",
    reason: "Document mismatch",
  })
  assert.equal(rejected.status, "REJECTED")
  assert.throws(() => reviewKycProfile({ userId: 3, currentStatus: "COMPLETED", decision: "REJECTED", reason: "x" }), /PENDING/)
  assert.throws(() => reviewKycProfile({ userId: 3, currentStatus: "PENDING", decision: "REJECTED" }), /reason/)
  assert.doesNotThrow(() => assertNoAureusKycInput({ fullName: "Ada" }))
})

test("Wave I admin roles are not secret-only", {
  skip: !existsSync(enginePath),
}, async () => {
  const { assignAdminRole, authorizeUbuntuAdmin, assertAdminRole, ADMIN_ROLES } = await import(pathToFileURL(enginePath).href)
  assert.deepEqual([...ADMIN_ROLES], ["FINANCE", "KYC", "MARKETPLACE", "CARD", "SHARE", "SUPPORT"])
  const granted = assignAdminRole({ userId: 3, role: "kyc" })
  assert.equal(granted.role, "KYC")
  assert.equal(authorizeUbuntuAdmin({ secretOk: true, requiredRole: "KYC" }).via, "secret")
  assert.equal(authorizeUbuntuAdmin({ secretOk: false, roles: ["KYC"], requiredRole: "KYC" }).via, "role")
  assert.throws(() => authorizeUbuntuAdmin({ secretOk: false, roles: ["SUPPORT"], requiredRole: "KYC" }), /KYC/)
  assert.doesNotThrow(() => assertAdminRole(["FINANCE", "CARD"], "CARD"))
})

test("Wave I schema and APIs stay on Ubuntu and keep checkout closed", () => {
  assert.match(schema20, /NEVER run this on Aureus production/)
  assert.match(schema20, /ua_kyc_profiles/)
  assert.match(schema20, /ua_admin_roles/)
  assert.match(schema20, /ua_admin_audit_log/)
  assert.match(persist, /persistKycSubmit/)
  assert.match(persist, /persistKycReview/)
  assert.match(persist, /persistAdminRoleAssign/)
  assert.match(persist, /ua_admin_audit_log/)
  assert.doesNotMatch(persist, /fgubaqoftdeefcakejwu/)
  assert.match(memberApi, /persistKycSubmit/)
  assert.match(memberApi, /checkoutEnabled: false/)
  assert.match(memberApi, /taken from the Ubuntu session/)
  assert.doesNotMatch(memberApi, /fgubaqoftdeefcakejwu/)
  assert.match(reviewApi, /authorizeUbuntuStaff/)
  assert.match(reviewApi, /KYC/)
  assert.match(reviewApi, /checkoutEnabled: false/)
  assert.match(rolesApi, /body, null/)
  assert.match(rolesApi, /resolveUbuntuStaffSession/)
  assert.match(auth, /via: "secret"/)
  assert.match(auth, /via: "role"/)
  assert.match(auth, /resolveUbuntuStaffSession/)
  assert.equal(pkg.version, "0.1.67")
})
