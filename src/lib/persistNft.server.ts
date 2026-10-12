import type { SupabaseClient } from "@supabase/supabase-js"
import { distributeNftSale } from "./nftDistribution.mjs"
import { reconNftOwnership, reconNftSale } from "./nftRecon.mjs"

function relationMissing(error?: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = String(error.message || "")
  return (
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    error.code === "PGRST205" ||
    error.code === "42P01"
  )
}

export async function persistNftAsset(
  ubuntu: SupabaseClient,
  input: { id?: unknown; ownerId?: unknown }
) {
  const id = String(input.id || "").trim()
  const ownerId = String(input.ownerId || "").trim()
  if (!id) throw new Error("id is required")
  if (!ownerId) throw new Error("ownerId is required")
  const { error } = await ubuntu.from("ua_nft_assets").upsert({
    id,
    current_owner_id: ownerId,
    status: "OWNED",
  })
  if (error) throw new Error(error.message)
  return { id, currentOwnerId: ownerId, originalSellerId: null, resaleCount: 0, status: "OWNED", checkoutEnabled: false }
}

export async function persistNftListing(
  ubuntu: SupabaseClient,
  input: { id?: unknown; nftId?: unknown; sellerId?: unknown; sponsorId?: unknown; price?: unknown }
) {
  const id = String(input.id || "").trim()
  const nftId = String(input.nftId || "").trim()
  const sellerId = String(input.sellerId || "").trim()
  const price = String(input.price || "").trim()
  if (!id) throw new Error("id is required")
  if (!nftId) throw new Error("nftId is required")
  if (!sellerId) throw new Error("sellerId is required")
  if (!price) throw new Error("price is required")

  const { data: asset, error: assetError } = await ubuntu
    .from("ua_nft_assets")
    .select("id, current_owner_id, status")
    .eq("id", nftId)
    .maybeSingle()
  if (assetError) throw new Error(assetError.message)
  if (!asset) throw new Error("NFT not found")
  if (String(asset.current_owner_id) !== sellerId) throw new Error("Seller does not own this NFT")

  const { error } = await ubuntu.from("ua_nft_listings").upsert({
    id,
    nft_id: nftId,
    seller_id: sellerId,
    sponsor_id: input.sponsorId == null ? null : String(input.sponsorId),
    price,
    status: "LISTED",
  })
  if (error) throw new Error(error.message)
  const { error: statusError } = await ubuntu.from("ua_nft_assets").update({ status: "LISTED" }).eq("id", nftId)
  if (statusError) throw new Error(statusError.message)
  return { id, nftId, sellerId, price, status: "LISTED", checkoutEnabled: false, nftMarketplaceEnabled: false }
}

export async function loadNftListings(ubuntu: SupabaseClient) {
  const { data, error } = await ubuntu
    .from("ua_nft_listings")
    .select("id, nft_id, seller_id, sponsor_id, price, status")
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map((row) => ({
    id: String(row.id),
    nftId: String(row.nft_id),
    sellerId: String(row.seller_id),
    sponsorId: row.sponsor_id == null ? "" : String(row.sponsor_id),
    price: String(row.price),
    status: String(row.status),
    checkoutEnabled: false,
    nftMarketplaceEnabled: false,
  }))
}

export async function loadNftAssets(ubuntu: SupabaseClient) {
  const { data, error } = await ubuntu
    .from("ua_nft_assets")
    .select("id, current_owner_id, original_seller_id, resale_count, status")
    .order("id", { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map((row) => ({
    id: String(row.id),
    currentOwnerId: String(row.current_owner_id),
    originalSellerId: row.original_seller_id == null ? null : String(row.original_seller_id),
    resaleCount: Number(row.resale_count || 0),
    status: String(row.status),
    checkoutEnabled: false,
    nftMarketplaceEnabled: false,
  }))
}

export async function loadNftAssetsForOwner(ubuntu: SupabaseClient, ownerId: string) {
  const { data, error } = await ubuntu
    .from("ua_nft_assets")
    .select("id, current_owner_id, original_seller_id, resale_count, status")
    .eq("current_owner_id", ownerId)
  if (error) throw new Error(error.message)
  return (data || []).map((row) => ({
    id: String(row.id),
    currentOwnerId: String(row.current_owner_id),
    originalSellerId: row.original_seller_id == null ? null : String(row.original_seller_id),
    resaleCount: Number(row.resale_count || 0),
    status: String(row.status),
    checkoutEnabled: false,
    nftMarketplaceEnabled: false,
  }))
}

export async function persistNftSettlement(
  ubuntu: SupabaseClient,
  input: {
    listingId: string
    buyerId: string
    paymentId: string
    members: Array<{ userId: string; rank: string; isActive?: boolean }>
  }
) {
  const { data: existing, error: existingError } = await ubuntu
    .from("ua_nft_sales")
    .select("id, nft_id, listing_id, payment_id, seller_id, buyer_id, original_seller_id, special_kind, price, resale_count, status")
    .eq("payment_id", input.paymentId)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (existing) {
    return { idempotent: true, saleId: String(existing.id), checkoutEnabled: false, nftMarketplaceEnabled: false }
  }

  const { data: listing, error: listingError } = await ubuntu
    .from("ua_nft_listings")
    .select("id, nft_id, seller_id, sponsor_id, price, status")
    .eq("id", input.listingId)
    .maybeSingle()
  if (listingError) throw new Error(listingError.message)
  if (!listing || String(listing.status) !== "LISTED") throw new Error("NFT listing is unavailable")

  const { data: asset, error: assetError } = await ubuntu
    .from("ua_nft_assets")
    .select("id, current_owner_id, original_seller_id, resale_count, status")
    .eq("id", listing.nft_id)
    .maybeSingle()
  if (assetError) throw new Error(assetError.message)
  if (!asset || String(asset.current_owner_id) !== String(listing.seller_id)) {
    throw new Error("NFT listing is unavailable")
  }

  const { data: locked, error: lockError } = await ubuntu
    .from("ua_nft_listings")
    .update({ status: "LOCKED" })
    .eq("id", listing.id)
    .eq("status", "LISTED")
    .select("id")
    .maybeSingle()
  if (lockError) throw new Error(lockError.message)
  if (!locked) throw new Error("NFT listing is unavailable")

  const distribution = distributeNftSale({
    price: String(listing.price),
    resaleCount: Number(asset.resale_count || 0),
    sponsorId: listing.sponsor_id,
    originalSellerId: asset.original_seller_id,
    sellerId: String(listing.seller_id),
    members: input.members,
  })

  const saleId = `SALE-${input.paymentId}`
  const { error: saleError } = await ubuntu.from("ua_nft_sales").insert({
    id: saleId,
    nft_id: String(listing.nft_id),
    listing_id: String(listing.id),
    payment_id: input.paymentId,
    seller_id: String(listing.seller_id),
    buyer_id: input.buyerId,
    original_seller_id: distribution.originalSellerId,
    sponsor_id: listing.sponsor_id,
    special_kind: distribution.specialKind,
    price: distribution.price,
    resale_count: Number(asset.resale_count || 0),
    status: "STAGED",
  })
  if (saleError) {
    if (String(saleError.message || "").includes("duplicate")) {
      return { idempotent: true, saleId, checkoutEnabled: false, nftMarketplaceEnabled: false }
    }
    throw new Error(saleError.message)
  }

  for (const row of distribution.allocations) {
    const { error } = await ubuntu.from("ua_nft_distribution_ledger").insert({
      sale_id: saleId,
      bucket: row.bucket,
      recipient_id: row.recipientId,
      amount: row.amount,
    })
    if (error) throw new Error(error.message)
  }

  const { error: historyError } = await ubuntu.from("ua_nft_ownership_history").insert({
    nft_id: String(listing.nft_id),
    from_owner_id: String(listing.seller_id),
    to_owner_id: input.buyerId,
    sale_id: saleId,
    original_seller_id: distribution.originalSellerId,
  })
  if (historyError) throw new Error(historyError.message)

  const { error: assetUpdateError } = await ubuntu
    .from("ua_nft_assets")
    .update({
      current_owner_id: input.buyerId,
      original_seller_id: distribution.originalSellerId,
      resale_count: Number(asset.resale_count || 0) + 1,
      status: "OWNED",
    })
    .eq("id", listing.nft_id)
  if (assetUpdateError) throw new Error(assetUpdateError.message)

  const { error: listingSoldError } = await ubuntu
    .from("ua_nft_listings")
    .update({ status: "SOLD" })
    .eq("id", listing.id)
  if (listingSoldError) throw new Error(listingSoldError.message)

  return {
    ok: true,
    saleId,
    distribution,
    checkoutEnabled: false,
    nftMarketplaceEnabled: false,
  }
}

export async function loadNftRecon(ubuntu: SupabaseClient, saleId?: string) {
  let salesQuery = ubuntu
    .from("ua_nft_sales")
    .select("id, nft_id, payment_id, seller_id, buyer_id, original_seller_id, price, status")
  if (saleId) salesQuery = salesQuery.eq("id", saleId)
  const { data: sales, error: salesError } = await salesQuery
  if (salesError && relationMissing(salesError)) return { ok: true, sales: 0, checkoutEnabled: false }
  if (salesError) throw new Error(salesError.message)

  const { data: ledger, error: ledgerError } = await ubuntu
    .from("ua_nft_distribution_ledger")
    .select("sale_id, bucket, recipient_id, amount")
  if (ledgerError) throw new Error(ledgerError.message)
  const { data: history, error: historyError } = await ubuntu
    .from("ua_nft_ownership_history")
    .select("nft_id, from_owner_id, to_owner_id, sale_id, original_seller_id")
    .order("created_at", { ascending: true })
  if (historyError) throw new Error(historyError.message)
  const { data: assets, error: assetsError } = await ubuntu
    .from("ua_nft_assets")
    .select("id, current_owner_id, original_seller_id, resale_count, status")
  if (assetsError) throw new Error(assetsError.message)

  for (const sale of sales || []) {
    const allocations = (ledger || [])
      .filter((row) => String(row.sale_id) === String(sale.id))
      .map((row) => ({ bucket: String(row.bucket), recipientId: String(row.recipient_id), amount: String(row.amount) }))
    reconNftSale({ price: String(sale.price), allocations })
    const asset = (assets || []).find((row) => String(row.id) === String(sale.nft_id))
    if (asset) {
      reconNftOwnership({
        asset: {
          id: String(asset.id),
          currentOwnerId: String(asset.current_owner_id),
          originalSellerId: asset.original_seller_id == null ? null : String(asset.original_seller_id),
        },
        history: (history || []).map((row) => ({
          nftId: String(row.nft_id),
          fromOwnerId: String(row.from_owner_id),
          toOwnerId: String(row.to_owner_id),
          originalSellerId: row.original_seller_id == null ? null : String(row.original_seller_id),
        })),
      })
    }
  }

  return {
    ok: true,
    sales: (sales || []).length,
    checksum: "100.00",
    nftMarketplaceEnabled: false,
    checkoutEnabled: false,
  }
}
