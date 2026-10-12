import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const pagePath = `${projectRoot}/src/routes/dashboard/kyc.tsx`

test("Wave N member KYC page is Ubuntu-only fullName and country", () => {
  assert.equal(existsSync(pagePath), true)
  const source = readFileSync(pagePath, "utf8")
  assert.match(source, /createFileRoute\("\/dashboard\/kyc"\)/)
  assert.match(source, /\/api\/member\/kyc/)
  assert.match(source, /fullName/)
  assert.match(source, /country/)
  assert.match(source, /ua_session/)
  assert.match(source, /PENDING/)
  assert.match(source, /COMPLETED/)
  assert.match(source, /REJECTED/)
  assert.doesNotMatch(source, /aureusKycId/)
  assert.doesNotMatch(source, /aureusKyc/)
  assert.doesNotMatch(source, /kyc_status/)
  assert.doesNotMatch(source, /kycStatusAureus/)
  assert.doesNotMatch(source, /documentsAureus/)
  assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
})
