import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const settlementPath = `${projectRoot}/src/lib/marketplaceSettlement.mjs`
const companyPath = `${projectRoot}/src/lib/marketplaceCompany.mjs`
const mediaPath = `${projectRoot}/src/lib/marketplaceMedia.mjs`
const publicOrderRoutePath = `${projectRoot}/src/routes/api/marketplace/order.ts`
const publicMediaRoutePath = `${projectRoot}/src/routes/api/marketplace/media.ts`

const membersChain130 = [
  { userId: "ssa", rank: "SSA" },
  { userId: "asm", rank: "ASM" },
  { userId: "bsm", rank: "BSM" },
  { userId: "ssm", rank: "SSM" },
  { userId: "vp", rank: "VP" },
]

async function loadMarketplaceSettlement() {
  return import(pathToFileURL(settlementPath).href)
}

async function loadMarketplaceCompany() {
  return import(pathToFileURL(companyPath).href)
}

test(
  "138 marketplace $100 uses shared Gap Cover 25.00 not a second plan",
  { skip: !existsSync(settlementPath) },
  async () => {
    const { settleMarketplaceOrder } = await loadMarketplaceSettlement()

    const result = settleMarketplaceOrder({
      order: {
        id: "MKT-100",
        total: "100.00",
        commissionableValue: "100.00",
        companyPayout: "40.00",
        gapSchedule: "STANDARD_25",
      },
      members: membersChain130,
      company: { id: "CO1", isActive: true },
    })

    assert.equal(result.gapCover.totalPaid, "25.00")
    assert.equal(result.gapCover.payments[0].amount, "10.00")
    assert.equal(result.companyPayout, "40.00")
    assert.equal(result.checkoutEnabled, false)
    assert.equal(result.gapCover.compPlanVersion, "GAP_COVER_V1")
  }
)

test(
  "138 rejects a non-STANDARD_25 product schedule",
  { skip: !existsSync(settlementPath) },
  async () => {
    const { quoteMarketplaceProduct, settleMarketplaceOrder } =
      await loadMarketplaceSettlement()

    assert.throws(
      () =>
        quoteMarketplaceProduct({
          productId: "X",
          retailPrice: "100.00",
          companyPayout: "40.00",
          gapSchedule: "CUSTOM_30",
        }),
      /STANDARD_25/
    )

    assert.throws(
      () =>
        settleMarketplaceOrder({
          order: {
            id: "MKT-BAD",
            total: "100.00",
            commissionableValue: "100.00",
            companyPayout: "40.00",
            gapSchedule: "CUSTOM_30",
          },
          members: membersChain130,
          company: { id: "CO1", isActive: true },
        }),
      /STANDARD_25/
    )
  }
)

test(
  "138 inactive company is not paid",
  { skip: !existsSync(settlementPath) },
  async () => {
    const { settleMarketplaceOrder } = await loadMarketplaceSettlement()

    assert.throws(
      () =>
        settleMarketplaceOrder({
          order: {
            id: "MKT-INACTIVE-CO",
            total: "100.00",
            commissionableValue: "100.00",
            companyPayout: "40.00",
            gapSchedule: "STANDARD_25",
          },
          members: membersChain130,
          company: { id: "CO1", isActive: false },
        }),
      /not active/
    )
  }
)

test(
  "138 public marketplace order path is named-open and requires session",
  { skip: !existsSync(publicOrderRoutePath) },
  () => {
    const source = readFileSync(publicOrderRoutePath, "utf8")
    assert.match(source, /persistPendingMarketplaceOrder/)
    assert.match(source, /Session required/)
    assert.match(source, /marketError\(401/)
    assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
  }
)

test(
  "138 createMarketplaceCompany sets checkoutEnabled false; assertCompanyActive throws when inactive",
  { skip: !existsSync(companyPath) },
  async () => {
    const { createMarketplaceCompany, assertCompanyActive } =
      await loadMarketplaceCompany()

    const company = createMarketplaceCompany({ id: "CO-NEW", name: "Test Co" })
    assert.equal(company.checkoutEnabled, false)

    assert.throws(
      () => assertCompanyActive({ id: "CO-OFF", isActive: false }),
      /not active/
    )
  }
)

test(
  "147 marketplace media accepts logo/banner/gallery/product and archives without delete",
  { skip: !existsSync(mediaPath) },
  async () => {
    const { registerMarketplaceMedia, archiveMarketplaceMedia } = await import(
      pathToFileURL(mediaPath).href
    )
    const logo = registerMarketplaceMedia({
      id: "MED-LOGO",
      companyId: "CO1",
      kind: "LOGO",
      contentType: "image/png",
      byteSize: 2048,
      publicUrl: "https://cdn.ubuntu-afrique.example/logo.png",
    })
    assert.equal(logo.status, "ACTIVE")
    assert.equal(logo.optimisation.format, "webp")
    assert.equal(logo.checkoutEnabled, false)
    const archived = archiveMarketplaceMedia(logo)
    assert.equal(archived.status, "ARCHIVED")
    assert.throws(
      () =>
        registerMarketplaceMedia({
          id: "MED-BAD",
          companyId: "CO1",
          kind: "LOGO",
          contentType: "application/pdf",
          byteSize: 2048,
          publicUrl: "https://cdn.ubuntu-afrique.example/x.pdf",
        }),
      /Unsupported marketplace media type/
    )
    assert.throws(
      () =>
        registerMarketplaceMedia({
          id: "MED-AUREUS",
          companyId: "CO1",
          kind: "BANNER",
          contentType: "image/jpeg",
          byteSize: 2048,
          publicUrl: "https://fgubaqoftdeefcakejwu.supabase.co/banner.jpg",
        }),
      /Aureus production/
    )
  }
)

test(
  "147 public marketplace media upload stays closed",
  { skip: !existsSync(publicMediaRoutePath) },
  () => {
    const source = readFileSync(publicMediaRoutePath, "utf8")
    assert.match(source, /Public checkout is not open/)
    assert.match(source, /status: 403/)
    assert.doesNotMatch(source, /fgubaqoftdeefcakejwu/)
  }
)