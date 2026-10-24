import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import {
  buildNetworkTree,
  paginateDirects,
  qualifiedLegsFromDirects,
} from "../src/lib/networkTree.mjs"

const persist = readFileSync(new URL("../src/lib/persistNetwork.server.ts", import.meta.url), "utf8")
const api = readFileSync(new URL("../src/routes/api/member/network.ts", import.meta.url), "utf8")
const page = readFileSync(new URL("../src/routes/dashboard/network.tsx", import.meta.url), "utf8")
const tree = readFileSync(new URL("../src/lib/networkTree.mjs", import.meta.url), "utf8")
const ubuntuServer = readFileSync(new URL("../src/lib/ubuntuServer.server.ts", import.meta.url), "utf8")
const identity = readFileSync(new URL("../IDENTITY.md", import.meta.url), "utf8")
const schema = readFileSync(new URL("../supabase/ubuntu-only/0003_ua_gap_cover_core.sql", import.meta.url), "utf8")

test("paginateDirects pages already-loaded personal directs only", () => {
  const rows = [
    { userId: "1", username: "a", email: "a@x", rank: "SSA" },
    { userId: "2", username: "b", email: "b@x", rank: "ASM" },
    { userId: "3", username: "c", email: "c@x", rank: "SSA" },
  ]
  const page2 = paginateDirects(rows, { page: 2, pageSize: 2 })
  assert.equal(page2.items.length, 1)
  assert.equal(page2.items[0].userId, "3")
  assert.equal(page2.page, 2)
  assert.equal(page2.pageSize, 2)
  assert.equal(page2.total, 3)
  assert.equal(page2.totalPages, 2)

  const withDescendants = [
    {
      userId: "10",
      rank: "SSA",
      descendants: [
        { userId: "11", rank: "ASM" },
        { userId: "12", rank: "ASM" },
      ],
    },
  ]
  const paged = paginateDirects(withDescendants, { page: 1, pageSize: 10 })
  assert.equal(paged.total, 1)
  assert.equal(paged.items.length, 1)
  assert.equal(paged.items[0].userId, "10")
})

test("independent legs: two ASMs under one personal leg count as one", () => {
  const oneLeg = [
    {
      userId: "direct-a",
      username: "leg-a",
      email: "a@example.com",
      rank: "SSA",
      descendants: [
        { userId: "asm-1", rank: "ASM" },
        { userId: "asm-2", rank: "ASM" },
      ],
    },
  ]
  assert.equal(qualifiedLegsFromDirects(oneLeg, "ASM"), 1)
  const treeOne = buildNetworkTree({
    currentRank: "SSA",
    requiredRank: "ASM",
    sponsorRow: { userId: "1", username: "upline", email: "up@example.com", rank: "BSM" },
    directRows: oneLeg,
    teamMemberCount: 1,
  })
  assert.equal(treeOne.qualifiedLegs, 1)
  assert.equal(treeOne.teamMemberCount, 1)
  assert.equal(treeOne.sponsor.username, "upline")
  assert.equal(treeOne.directs.length, 1)
  assert.equal(treeOne.checkoutEnabled, false)
  assert.equal(treeOne.marketplaceEnabled, true)
  assert.equal(treeOne.nftMarketplaceEnabled, false)

  const twoLegs = [
    { userId: "direct-a", rank: "SSA", descendants: [{ userId: "asm-1", rank: "ASM" }] },
    { userId: "direct-b", rank: "SSA", descendants: [{ userId: "asm-2", rank: "ASM" }] },
  ]
  assert.equal(qualifiedLegsFromDirects(twoLegs, "ASM"), 2)
})

test("N1 network source stays on Ubuntu and refuses Aureus / origin write", () => {
  assert.match(identity, /Do not push/)
  assert.match(schema, /ua_sponsor_tree/)
  assert.match(schema, /NEVER run this on Aureus production/)

  assert.match(ubuntuServer, /fgubaqoftdeefcakejwu/)
  assert.match(ubuntuServer, /assertUbuntuWriteTarget/)
  assert.match(ubuntuServer, /Aureus production/)

  assert.match(persist, /loadNetworkSnapshot/)
  assert.match(persist, /ua_sponsor_tree/)
  assert.match(persist, /sponsor_id/)
  assert.match(persist, /ua_user_ranks/)
  assert.match(persist, /ua_team_volume/)
  assert.match(persist, /ua_users/)
  assert.match(persist, /buildNetworkTree/)
  assert.match(persist, /Never writes/)
  assert.doesNotMatch(persist, /fgubaqoftdeefcakejwu/)
  assert.doesNotMatch(persist, /\.insert\(|\.update\(|\.upsert\(|\.delete\(/)
  assert.doesNotMatch(persist, /git push|origin\/master|vercel --prod/)
  assert.doesNotMatch(persist, /while\s*\(/)
  assert.doesNotMatch(persist, /marketplace_enabled|nft_assets_enabled|nft_listing_enabled|nft_marketplace_enabled/)

  assert.match(api, /Session required/)
  assert.match(api, /status: 401/)
  assert.match(api, /resolveSessionMember/)
  assert.match(api, /getUbuntuServerClient/)
  assert.match(api, /checkoutEnabled: false/)
  assert.match(api, /marketplaceEnabled: true/)
  assert.match(api, /nftMarketplaceEnabled: false/)
  assert.match(api, /nftAssetsEnabled: false/)
  assert.match(api, /nftListingEnabled: false/)
  assert.doesNotMatch(api, /fgubaqoftdeefcakejwu/)
  assert.doesNotMatch(api, /\.insert\(|\.update\(|\.upsert\(|\.delete\(/)

  assert.match(page, /\/api\/member\/network/)
  assert.match(page, /ua_session/)
  assert.match(page, /\/auth\/login/)
  assert.match(page, /Qualified legs/)
  assert.match(page, /Team members/)
  assert.match(page, /Sponsor/)
  assert.doesNotMatch(page, /\/api\/marketplace\/order/)
  assert.doesNotMatch(page, /\/api\/nft\/order/)
  assert.doesNotMatch(page, /fgubaqoftdeefcakejwu/)

  assert.match(tree, /paginateDirects/)
  assert.match(tree, /countQualifiedLegs/)
  assert.match(tree, /Never recursively walks genealogy/)
  assert.doesNotMatch(tree, /fgubaqoftdeefcakejwu/)
})
