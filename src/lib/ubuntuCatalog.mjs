/** Ubuntu Afrique catalog pages. Flags stay off. Purchase stays closed. No affiliate leak. */

const AFFILIATE_KEYS = [
  "sponsorId",
  "sponsor_id",
  "affiliate",
  "affiliateCode",
  "settlementWallet",
  "settlement_wallet",
  "rank",
  "members",
]

export function catalogFlags(input) {
  return {
    marketplaceEnabled: input?.marketplaceEnabled === true,
    nftMarketplaceEnabled: input?.nftMarketplaceEnabled === true,
    checkoutEnabled: false,
    comingSoon: input?.marketplaceEnabled !== true || input?.nftMarketplaceEnabled !== true,
    purchaseOpen: false,
  }
}

export function companySlug(company) {
  return String(company?.id || company?.slug || "").trim()
}

export function productSlug(product) {
  return String(product?.slug || product?.productId || product?.id || "").trim()
}

export function publicCompanyCard(company) {
  if (!company) return null
  return {
    id: String(company.id),
    slug: companySlug(company),
    name: String(company.name || company.id),
    isActive: company.isActive === true,
    checkoutEnabled: false,
  }
}

export function publicProductCard(product) {
  if (!product) return null
  const card = {
    productId: String(product.productId || product.id || ""),
    companyId: String(product.companyId || ""),
    name: String(product.name || product.productId || ""),
    retailPrice: String(product.retailPrice || "0"),
    slug: productSlug(product),
    checkoutEnabled: false,
  }
  if (product.category) card.category = String(product.category)
  if (product.country) card.country = String(product.country)
  if (product.type || product.productType) card.type = String(product.type || product.productType)
  if (product.featured === true) card.featured = true
  if (product.inventory != null && product.inventory !== "") card.inventory = String(product.inventory)
  if (product.sku) card.sku = String(product.sku)
  if (product.shortDescription || product.short_description) {
    card.shortDescription = String(product.shortDescription || product.short_description)
  }
  return card
}

export function publicNftListingCard(listing) {
  if (!listing) return null
  return {
    id: String(listing.id),
    nftId: String(listing.nftId || ""),
    price: String(listing.price || "0"),
    status: String(listing.status || ""),
    checkoutEnabled: false,
    nftMarketplaceEnabled: false,
  }
}

export function assertNoAffiliateLeak(row) {
  if (!row || typeof row !== "object") return true
  for (const key of AFFILIATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      throw new Error("Affiliate fields are not shown on Ubuntu catalog pages")
    }
  }
  return true
}

function comparePrice(left, right) {
  const a = Number(String(left || "0"))
  const b = Number(String(right || "0"))
  if (a === b) return 0
  return a > b ? 1 : -1
}

export function filterMarketplaceCatalog({
  companies,
  products,
  query,
  slug,
  productSlug: wantedProduct,
  category,
  country,
  type,
  sort,
  featured,
} = {}) {
  const needle = String(query || "").trim().toLowerCase()
  const companyCards = (companies || []).map(publicCompanyCard).filter(Boolean)
  const productCards = (products || []).map(publicProductCard).filter(Boolean)
  const wantedSlug = String(slug || "").trim()
  const bySlug = wantedSlug
    ? companyCards.filter((row) => row.slug === wantedSlug)
    : companyCards
  const visibleCompanies = needle
    ? bySlug.filter((row) => row.name.toLowerCase().includes(needle) || row.id.toLowerCase().includes(needle))
    : bySlug
  const visibleCompanyIds = new Set(visibleCompanies.map((row) => row.id))
  let visibleProducts = productCards.filter((row) => {
    if (wantedSlug && !visibleCompanyIds.has(row.companyId)) return false
    if (!needle) return !wantedSlug || visibleCompanyIds.has(row.companyId)
    return (
      row.name.toLowerCase().includes(needle) ||
      row.productId.toLowerCase().includes(needle) ||
      visibleCompanyIds.has(row.companyId)
    )
  })

  const wantedCategory = String(category || "").trim()
  const wantedCountry = String(country || "").trim()
  const wantedType = String(type || "").trim()
  const wantedProductSlug = String(wantedProduct || "").trim()
  const hasCategory = productCards.some((row) => row.category)
  const hasCountry = productCards.some((row) => row.country)
  const hasType = productCards.some((row) => row.type)
  const hasFeatured = productCards.some((row) => row.featured === true)

  if (hasCategory && wantedCategory) {
    visibleProducts = visibleProducts.filter((row) => String(row.category) === wantedCategory)
  }
  if (hasCountry && wantedCountry) {
    visibleProducts = visibleProducts.filter((row) => String(row.country) === wantedCountry)
  }
  if (hasType && wantedType) {
    visibleProducts = visibleProducts.filter((row) => String(row.type) === wantedType)
  }
  if (hasFeatured && featured === true) {
    visibleProducts = visibleProducts.filter((row) => row.featured === true)
  }
  if (wantedProductSlug) {
    visibleProducts = visibleProducts.filter((row) => row.slug === wantedProductSlug || row.productId === wantedProductSlug)
  }

  const sortKey = String(sort || "").toLowerCase()
  if (sortKey === "price" || sortKey === "price-asc") {
    visibleProducts = [...visibleProducts].sort((a, b) => comparePrice(a.retailPrice, b.retailPrice))
  } else if (sortKey === "price-desc") {
    visibleProducts = [...visibleProducts].sort((a, b) => comparePrice(b.retailPrice, a.retailPrice))
  } else if (sortKey === "name") {
    visibleProducts = [...visibleProducts].sort((a, b) => a.name.localeCompare(b.name))
  }

  visibleCompanies.forEach(assertNoAffiliateLeak)
  visibleProducts.forEach(assertNoAffiliateLeak)
  return {
    companies: visibleCompanies,
    products: visibleProducts,
    checkoutEnabled: false,
    marketplaceEnabled: false,
    comingSoon: true,
  }
}

export function filterNftPreview(listings) {
  const cards = (listings || []).map(publicNftListingCard).filter(Boolean)
  cards.forEach(assertNoAffiliateLeak)
  return {
    listings: cards,
    checkoutEnabled: false,
    nftMarketplaceEnabled: false,
    comingSoon: true,
    purchaseOpen: false,
  }
}
