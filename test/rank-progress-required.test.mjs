import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { rankProgress } from "../src/lib/rankProgress.mjs"

test("SSA with 0 volume / 0 members: nextRank ASM, teamMembers.met false, teamVolume.met false", () => {
  const row = rankProgress({
    currentRank: "SSA",
    teamVolume: "0",
    teamMemberCount: 0,
    directLegs: [],
    isActive: true,
  })
  assert.equal(row.currentRank, "SSA")
  assert.equal(row.entitlement, "10")
  assert.equal(row.nextRank, "ASM")
  assert.equal(row.nextRequirements.minTeamMembers, 10)
  assert.equal(row.nextRequirements.minTeamVolume, "1000")
  assert.equal(row.progress.teamMembers.have, 0)
  assert.equal(row.progress.teamMembers.need, 10)
  assert.equal(row.progress.teamMembers.met, false)
  assert.equal(row.progress.teamVolume.need, "1000")
  assert.equal(row.progress.teamVolume.met, false)
  assert.equal(row.checkoutEnabled, false)
})

test("SSA with 10 members + 1000 volume: both met true", () => {
  const row = rankProgress({
    currentRank: "SSA",
    teamVolume: "1000",
    teamMemberCount: 10,
    directLegs: [],
    isActive: true,
  })
  assert.equal(row.nextRank, "ASM")
  assert.equal(row.progress.teamMembers.have, 10)
  assert.equal(row.progress.teamMembers.need, 10)
  assert.equal(row.progress.teamMembers.met, true)
  assert.equal(row.progress.teamVolume.need, "1000")
  assert.equal(row.progress.teamVolume.met, true)
  assert.equal(row.checkoutEnabled, false)
})

test("BSM progress toward SSM needs 2 BSM legs + 25000 volume", () => {
  const short = rankProgress({
    currentRank: "BSM",
    teamVolume: "24999.99",
    teamMemberCount: 40,
    directLegs: [{ rank: "BSM" }],
    isActive: true,
  })
  assert.equal(short.nextRank, "SSM")
  assert.equal(short.progress.qualifiedLegs.requiredRank, "BSM")
  assert.equal(short.progress.qualifiedLegs.need, 2)
  assert.equal(short.progress.qualifiedLegs.have, 1)
  assert.equal(short.progress.qualifiedLegs.met, false)
  assert.equal(short.progress.teamVolume.need, "25000")
  assert.equal(short.progress.teamVolume.met, false)

  const ready = rankProgress({
    currentRank: "BSM",
    teamVolume: "25000",
    teamMemberCount: 40,
    directLegs: [{ rank: "BSM" }, { rank: "BSM" }],
    isActive: true,
  })
  assert.equal(ready.nextRank, "SSM")
  assert.equal(ready.progress.qualifiedLegs.have, 2)
  assert.equal(ready.progress.qualifiedLegs.need, 2)
  assert.equal(ready.progress.qualifiedLegs.requiredRank, "BSM")
  assert.equal(ready.progress.qualifiedLegs.met, true)
  assert.equal(ready.progress.teamVolume.need, "25000")
  assert.equal(ready.progress.teamVolume.met, true)
  assert.equal(ready.checkoutEnabled, false)
})

test("inactive: met flags false even if numbers would qualify", () => {
  const row = rankProgress({
    currentRank: "SSA",
    teamVolume: "1000",
    teamMemberCount: 10,
    directLegs: [],
    isActive: false,
  })
  assert.equal(row.nextRank, "ASM")
  assert.equal(row.progress.teamMembers.have, 10)
  assert.equal(row.progress.teamVolume.have, "1000.00")
  assert.equal(row.progress.teamMembers.met, false)
  assert.equal(row.progress.teamVolume.met, false)
  assert.equal(row.progress.qualifiedLegs.met, false)
  assert.equal(row.checkoutEnabled, false)
})

test("checkoutEnabled is false on the progress object", () => {
  const row = rankProgress({
    currentRank: "VP",
    teamVolume: "100000",
    teamMemberCount: 100,
    directLegs: [{ rank: "SSM" }, { rank: "SSM" }],
    isActive: true,
  })
  assert.equal(row.nextRank, null)
  assert.equal(row.checkoutEnabled, false)
  assert.equal(row.progress.teamVolume.met, false)
  assert.equal(row.progress.teamMembers.met, false)
  assert.equal(row.progress.qualifiedLegs.met, false)
})

test("unknown rank throws; client entitlement override is ignored", () => {
  assert.throws(() => rankProgress({ currentRank: "NFT", teamVolume: "0", teamMemberCount: 0 }), /Unknown corporate rank/)
  const row = rankProgress({
    currentRank: "SSA",
    teamVolume: "0",
    teamMemberCount: 0,
    entitlement: "99",
    isActive: true,
  })
  assert.equal(row.entitlement, "10")
})

test("persist loader is read-only Ubuntu; progress API stays closed", () => {
  const persist = readFileSync(new URL("../src/lib/persistRankProgress.server.ts", import.meta.url), "utf8")
  assert.match(persist, /loadRankProgressSnapshot/)
  assert.match(persist, /ua_users/)
  assert.match(persist, /ua_user_ranks/)
  assert.match(persist, /ua_team_volume/)
  assert.match(persist, /ua_sponsor_tree/)
  assert.match(persist, /direct legs only/)
  assert.doesNotMatch(persist, /\.insert\(|\.update\(|\.upsert\(|\.delete\(/)
  assert.doesNotMatch(persist, /fgubaqoftdeefcakejwu/)
  assert.doesNotMatch(persist, /evaluateRankQualification/)

  const progressLib = readFileSync(new URL("../src/lib/rankProgress.mjs", import.meta.url), "utf8")
  assert.doesNotMatch(progressLib, /evaluateRankQualification/)
  assert.match(progressLib, /checkoutEnabled: false/)

  const route = readFileSync(new URL("../src/routes/api/admin/ranks/progress.ts", import.meta.url), "utf8")
  assert.match(route, /createFileRoute\("\/api\/admin\/ranks\/progress"\)/)
  assert.match(route, /authorizeUbuntuStaff/)
  assert.match(route, /confirmSecret/)
  assert.match(route, /currentRank/)
  assert.match(route, /teamVolume/)
  assert.match(route, /checkoutEnabled: false/)
  assert.doesNotMatch(route, /confirm-payment|persistRank\(|promote/)
})
