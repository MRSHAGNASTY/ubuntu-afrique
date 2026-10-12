import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const identity = readFileSync(`${projectRoot}/IDENTITY.md`, "utf8")
const rule = readFileSync(`${projectRoot}/.cursor/rules/ubuntu-identity.mdc`, "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("Wave F identity lock names MRSHAGNASTY and forbids origin push", () => {
  assert.match(identity, /No Post On Sunday/)
  assert.match(identity, /mr\.shagnasty1990@gmail\.com/)
  assert.match(identity, /MRSHAGNASTY/)
  assert.match(identity, /ubuntu-fork/)
  assert.match(identity, /Do not push/)
  assert.match(identity, /JPRademeyer84/)
  assert.match(identity, /Do not rewrite/)
  assert.match(identity, /gh pr review/)
  assert.match(identity, /gh pr comment/)
  assert.match(identity, /gh pr merge/)
  assert.doesNotMatch(identity, /vercel --prod/)
  assert.match(rule, /alwaysApply: true/)
  assert.match(rule, /ubuntu-fork/)
  assert.match(rule, /review, comment, and merge/)
  assert.equal(pkg.version, "0.1.59")
})
