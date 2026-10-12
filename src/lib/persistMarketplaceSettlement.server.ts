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
