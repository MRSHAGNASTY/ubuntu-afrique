import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuAureusMirror.mjs`
const persistPath = `${projectRoot}/src/lib/persistAureusReadMirror.server.ts`
const loginPath = `${projectRoot}/src/routes/api/ua-login.ts`
const mePath = `${projectRoot}/src/routes/api/ua-me.ts`
const schemaPath = `${projectRoot}/supabase/ubuntu-only/0021_ua_aa_read_mirror.sql`
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))

test("AA login provisions Ubuntu member and read-mirror only", async () => {
  assert.equal(existsSync(enginePath), true)
  const {
    buildUbuntuMemberProvision,
    buildAureusReadMirrorRow,
    chooseUbuntuUsername,
    mirrorToUaMe,
    safeAureusAuthUserId,
  } = await import(pathToFileURL(enginePath).href)

  const provision = buildUbuntuMemberProvision({
    aureusUserId: 7479,
    email: "Krimmel1990@gmail.com",
    username: "krimmel1990",
    authUserId: "11111111-1111-1111-1111-111111111111",
    takenUsernames: ["someone_else"],
  })
  assert.equal(provision.aureus_user_id, 7479)
  assert.equal(provision.email, "krimmel1990@gmail.com")
  assert.equal(provision.username, "krimmel1990")
  assert.equal(provision.identity_source, "aureus")
  assert.equal(provision.pending_aureus_provision, false)

  assert.equal(chooseUbuntuUsername({ aureusUserId: 12, email: "a@b.com", username: "taken", takenUsernames: ["taken", "a"] }), "aa_12")

  const mirror = buildAureusReadMirrorRow({
    aureusUserId: 7479,
    ubuntuUserId: 10,
    email: "krimmel1990@gmail.com",
    username: "krimmel1990",
    fullName: "Ruvan",
    netShares: 5,
    invested: 100,
    commissions: 2.5,
    pendingCommissions: 1,
  })
  assert.equal(mirror.source, "aureus_read")
  assert.equal(mirror.net_shares, "5.00000000")
  const shown = mirrorToUaMe(mirror)
  assert.equal(shown.profile.id, 7479)
  assert.equal(shown.ledger.shares, 5)
  assert.equal(shown.mirrored, true)

  assert.equal(safeAureusAuthUserId("nope"), null)
  assert.equal(safeAureusAuthUserId("8d796fa1-eb57-4dd2-a8b5-677f71fcab4d"), "8d796fa1-eb57-4dd2-a8b5-677f71fcab4d")
  assert.throws(() => buildUbuntuMemberProvision({ aureusUserId: 0, email: "a@b.com" }), /aureusUserId/)
})

test("login and ua-me write Ubuntu mirror, never Aureus", () => {
  assert.equal(existsSync(persistPath), true)
  assert.equal(existsSync(schemaPath), true)
  const persist = readFileSync(persistPath, "utf8")
  const login = readFileSync(loginPath, "utf8")
  const me = readFileSync(mePath, "utf8")
  const schema = readFileSync(schemaPath, "utf8")

  assert.match(persist, /provisionUbuntuMemberFromAureus/)
  assert.match(persist, /refreshAureusReadMirror/)
  assert.match(persist, /ua_aa_user_mirror/)
  assert.match(persist, /from\("ua_users"\)/)
  assert.doesNotMatch(persist, /fgubaqoftdeefcakejwu/)
  assert.doesNotMatch(persist, /\.from\(["']users["']\)\.(insert|update|upsert|delete)/)

  assert.match(login, /loadAureusReadsAndRefreshMirror/)
  assert.match(login, /loadAureusReadsAndRefreshMirror/)
  assert.match(login, /initiate-login/)
  assert.doesNotMatch(login, /confirmCommercePayment/)
  assert.doesNotMatch(login, /fgubaqoftdeefcakejwu/)

  assert.match(me, /loadAureusReadsAndRefreshMirror/)
  assert.match(me, /loadAureusReadMirror/)
  assert.match(me, /mirrorToUaMe/)
  assert.doesNotMatch(me, /createClient/)

  assert.match(schema, /NEVER run this on Aureus production/)
  assert.match(schema, /ua_aa_user_mirror/)
  assert.match(schema, /NEVER run on Aureus fgubaqoftdeefcakejwu/)
  assert.doesNotMatch(schema, /INSERT INTO public\.users/)
  assert.equal(pkg.version, "0.1.62")
})
