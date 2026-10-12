import type { SupabaseClient } from "@supabase/supabase-js"
import { quoteMarketplaceProduct } from "./marketplaceSettlement.mjs"

export async function persistMarketplaceProduct(
  ubuntu: SupabaseClient,
  product: {
    productId: string
    companyId: string
    name: string
    retailPrice: string
    companyPayout: string
    qv?: string
  }
) {
  const quoted = quoteMarketplaceProduct({
    productId: product.productId,
    retailPrice: product.retailPrice,
    companyPayout: product.companyPayout,
    commissionableValue: product.retailPrice,
    qv: product.qv || product.retailPrice,
    gapSchedule: "STANDARD_25",
  })
  const { error } = await ubuntu.from("ua_products").upsert({
    id: quoted.productId,
    company_id: String(product.companyId),
    product_type: "MARKETPLACE",
    product_name: String(product.name || quoted.productId),
    retail_price: quoted.retailPrice,
    cost: "0",
    company_payout: quoted.companyPayout,
    commissionable_value: quoted.commissionableValue,
    qv: quoted.qv,
    gap_enabled: true,
    gap_schedule: "STANDARD_25",
    blp_enabled: true,
    active: true,
  })
  if (error) throw new Error(error.message)
  return quoted
}

export async function loadMarketplaceProducts(ubuntu: SupabaseClient) {
  const { data, error } = await ubuntu
    .from("ua_products")
    .select("id, company_id, product_type, product_name, sku, short_description, retail_price, company_payout, commissionable_value, qv, gap_schedule, inventory, active")
    .eq("product_type", "MARKETPLACE")
  if (error) throw new Error(error.message)
  return (data || []).map((row) => ({
    productId: String(row.id),
    companyId: String(row.company_id || ""),
    name: String(row.product_name || ""),
    retailPrice: String(row.retail_price ?? "0"),
    companyPayout: String(row.company_payout ?? "0"),
    commissionableValue: String(row.commissionable_value ?? "0"),
    qv: String(row.qv ?? "0"),
    gapSchedule: String(row.gap_schedule || "STANDARD_25"),
    type: String(row.product_type || "MARKETPLACE"),
    sku: row.sku == null ? "" : String(row.sku),
    shortDescription: row.short_description == null ? "" : String(row.short_description),
    inventory: row.inventory == null ? "" : String(row.inventory),
    active: row.active === true,
    checkoutEnabled: false,
  }))
}

export async function persistMarketplaceSettlement(
  ubuntu: SupabaseClient,
  input: {
    order: {
      id?: string
      companyId: string
      productId: string
      retailPrice: string
      companyPayout: string
      commissionableValue: string
      qv: string
      userId?: string
    }
    companyPayout: string
    status?: string
  }
) {
  const status = input.status || "SETTLED"
  const orderId = String(input.order.id || "").trim()
  const orderRow = {
    company_id: input.order.companyId,
    product_id: input.order.productId,
    user_id: input.order.userId || null,
    retail_price: input.order.retailPrice,
    company_payout: input.companyPayout,
    commissionable_value: input.order.commissionableValue,
    qv: input.order.qv,
    gap_schedule: "STANDARD_25",
    status,
  }

  let persistedId = orderId
  if (orderId) {
    const { data: existing, error: existingError } = await ubuntu
      .from("ua_marketplace_orders")
      .select("id")
      .eq("id", orderId)
      .maybeSingle()
    if (existingError) throw new Error(existingError.message)
    if (existing) {
      const { error: updateError } = await ubuntu
        .from("ua_marketplace_orders")
        .update({ company_payout: input.companyPayout, status, gap_schedule: "STANDARD_25" })
        .eq("id", orderId)
      if (updateError) throw new Error(updateError.message)
    } else {
      const { data, error } = await ubuntu
        .from("ua_marketplace_orders")
        .insert({ id: orderId, ...orderRow })
        .select("id")
        .single()
      if (error) throw new Error(error.message)
      persistedId = String(data?.id || orderId)
    }
  } else {
    const { data, error } = await ubuntu
      .from("ua_marketplace_orders")
      .insert(orderRow)
      .select("id")
      .single()
    if (error) throw new Error(error.message)
    persistedId = String(data?.id || "")
  }

  const { error: settleError } = await ubuntu.from("ua_company_settlements").insert({
    order_id: persistedId,
    company_id: input.order.companyId,
    amount: input.companyPayout,
    status: "RECORDED",
  })
  if (settleError) throw new Error(settleError.message)
  return { orderId: persistedId, status: "SETTLED" }
}

export async function persistPendingMarketplaceOrder(
  ubuntu: SupabaseClient,
  input: { orderId: string; userId: string; productId: string }
) {
  const productId = String(input.productId || "").trim()
  if (!productId) throw new Error("productId is required")
  const selectProduct = "id, company_id, product_type, product_name, retail_price, company_payout, commissionable_value, qv, gap_schedule, active, sku"
  const { data: byId, error: productError } = await ubuntu
    .from("ua_products")
    .select(selectProduct)
    .eq("id", productId)
    .maybeSingle()
  if (productError) throw new Error(productError.message)
  let product = byId
  if (!product) {
    const { data: bySku, error: skuError } = await ubuntu
      .from("ua_products")
      .select(selectProduct)
      .eq("sku", productId)
      .maybeSingle()
    if (skuError) throw new Error(skuError.message)
    product = bySku
  }
  if (!product) throw new Error("Marketplace product not found")
  if (product.active !== true) throw new Error("Marketplace product is not active")
  if (String(product.product_type || "") !== "MARKETPLACE") {
    throw new Error("Product is not a marketplace product")
  }

  const { data: company, error: companyError } = await ubuntu
    .from("ua_marketplace_companies")
    .select("id, is_active")
    .eq("id", String(product.company_id || ""))
    .maybeSingle()
  if (companyError) throw new Error(companyError.message)
  if (!company || company.is_active !== true) {
    throw new Error("Marketplace company is not active")
  }

  const quoted = quoteMarketplaceProduct({
    productId: String(product.id),
    retailPrice: String(product.retail_price),
    companyPayout: String(product.company_payout),
    commissionableValue: String(product.commissionable_value || product.retail_price),
    qv: String(product.qv || product.retail_price),
    gapSchedule: String(product.gap_schedule || "STANDARD_25"),
  })

  const order = {
    id: String(input.orderId),
    companyId: String(product.company_id),
    productId: quoted.productId,
    userId: String(input.userId),
    retailPrice: quoted.retailPrice,
    companyPayout: quoted.companyPayout,
    commissionableValue: quoted.commissionableValue,
    qv: quoted.qv,
    gapSchedule: "STANDARD_25",
    status: "PENDING_PAYMENT",
  }

  const { data: existing, error: existingError } = await ubuntu
    .from("ua_marketplace_orders")
    .select("id, status")
    .eq("id", order.id)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (existing) {
    return { order, persisted: true, idempotent: true }
  }

  const { error } = await ubuntu.from("ua_marketplace_orders").insert({
    id: order.id,
    company_id: order.companyId,
    product_id: order.productId,
    user_id: order.userId,
    retail_price: order.retailPrice,
    company_payout: order.companyPayout,
    commissionable_value: order.commissionableValue,
    qv: order.qv,
    gap_schedule: "STANDARD_25",
    status: "PENDING_PAYMENT",
  })
  if (error) throw new Error(error.message)
  return { order, persisted: true, idempotent: false }
}
