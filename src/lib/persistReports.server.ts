import type { SupabaseClient } from "@supabase/supabase-js"
import { buildReport, resolveReportRange } from "./reportEngine.mjs"

function tableMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = String(error.message || "").toLowerCase()
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  )
}

async function selectRows(ubuntu: SupabaseClient, table: string, columns: string, from: string, to: string) {
  const { data, error } = await ubuntu
    .from(table)
    .select(columns)
    .gte("created_at", from)
    .lte("created_at", to)
  if (tableMissing(error)) return []
  if (error) throw new Error(error.message)
  return data || []
}

export async function loadUbuntuReport(
  ubuntu: SupabaseClient,
  input: { preset?: string; from?: string; to?: string }
) {
  const range = resolveReportRange(input)
  const [
    cards,
    fractions,
    commissions,
    wallet,
    settlements,
    nftSales,
    liability,
    inventory,
    ranks,
    volume,
  ] = await Promise.all([
    selectRows(ubuntu, "ua_card_orders", "id, product_id, total, qv, order_status, created_at", range.from, range.to),
    selectRows(ubuntu, "ua_fraction_transactions", "id, total_amount, qv, transaction_status, created_at", range.from, range.to),
    selectRows(ubuntu, "ua_commission_transactions", "source_transaction_id, commissionable_value, amount, status, created_at", range.from, range.to),
    selectRows(ubuntu, "ua_wallet_ledger", "entry_type, amount, status, created_at", range.from, range.to),
    selectRows(ubuntu, "ua_company_settlements", "amount, created_at", range.from, range.to),
    selectRows(ubuntu, "ua_nft_sales", "id, created_at", range.from, range.to),
    ubuntu.from("ua_aureus_liability_ledger").select("entry_type, amount").then(({ data, error }) => {
      if (tableMissing(error)) return []
      if (error) throw new Error(error.message)
      return data || []
    }),
    ubuntu.from("ua_underlying_inventory").select("remaining_underlying").eq("id", "AUREUS_100K").maybeSingle()
      .then(({ data, error }) => {
        if (tableMissing(error)) return "0"
        if (error) throw new Error(error.message)
        return String(data?.remaining_underlying ?? "0")
      }),
    ubuntu.from("ua_user_ranks").select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (tableMissing(error)) return 0
        if (error) throw new Error(error.message)
        return count ?? 0
      }),
    ubuntu.from("ua_team_volume").select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (tableMissing(error)) return 0
        if (error) throw new Error(error.message)
        return count ?? 0
      }),
  ])

  return buildReport({
    range,
    cardRows: cards.map((row) => ({
      createdAt: row.created_at,
      total: row.total,
      qv: row.qv,
      orderStatus: row.order_status,
    })),
    fractionRows: fractions.map((row) => ({
      createdAt: row.created_at,
      total: row.total_amount,
      qv: row.qv,
      transactionStatus: row.transaction_status,
    })),
    commissionRows: commissions.map((row) => ({
      createdAt: row.created_at,
      amount: row.amount,
      status: row.status,
      sourceTransactionId: row.source_transaction_id,
      commissionableValue: row.commissionable_value,
    })),
    walletRows: wallet.map((row) => ({
      createdAt: row.created_at,
      amount: row.amount,
      status: row.status,
      entryType: row.entry_type,
    })),
    settlementRows: settlements,
    nftSaleRows: nftSales,
    liabilityRows: liability,
    remainingUnderlying: inventory,
    userRankCount: ranks,
    teamVolumeRows: volume,
  })
}
