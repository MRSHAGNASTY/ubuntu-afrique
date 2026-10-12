import type { SupabaseClient } from "@supabase/supabase-js"
import { summarizeWalletLedger } from "./memberLedger.mjs"

export type WalletLedgerEntry = {
  entryType: string
  amount: string
  status: string
  source?: string
  sourceTransactionId?: string
  ref?: string
  createdAt: string
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const message = String(error.message || "").toLowerCase()
  return (
    error.code === "PGRST204" ||
    message.includes("does not exist") ||
    message.includes("could not find the") ||
    message.includes("schema cache")
  )
}

function mapWalletRow(row: Record<string, unknown>): WalletLedgerEntry {
  const sourceTransactionId =
    row.source_transaction_id != null ? String(row.source_transaction_id) : ""
  const source = row.source != null ? String(row.source) : sourceTransactionId
  const ref = row.ref != null ? String(row.ref) : ""
  const entry: WalletLedgerEntry = {
    entryType: String(row.entry_type || ""),
    amount: String(row.amount ?? "0"),
    status: String(row.status || "posted"),
    createdAt: row.created_at != null ? String(row.created_at) : "",
  }
  if (source) entry.source = source
  if (sourceTransactionId) entry.sourceTransactionId = sourceTransactionId
  if (ref) entry.ref = ref
  return entry
}

async function selectWalletRows(ubuntu: SupabaseClient, userId: string) {
  const selects = [
    "entry_type, amount, status, source_transaction_id, source, ref, created_at",
    "entry_type, amount, status, source_transaction_id, ref, created_at",
    "entry_type, amount, status, source_transaction_id, created_at",
    "entry_type, amount, status, created_at",
  ]
  let lastError: { code?: string; message?: string } | null = null
  for (const select of selects) {
    const { data, error } = await ubuntu
      .from("ua_wallet_ledger")
      .select(select)
      .eq("user_id", userId)
      .in("status", ["posted", "voided"])
      .order("created_at", { ascending: false })
    if (!error) return (data || []) as Array<Record<string, unknown>>
    lastError = error
    if (!isMissingColumn(error)) throw new Error(error.message)
  }
  throw new Error(lastError?.message || "ua_wallet_ledger read refused")
}

export async function loadWalletLedger(ubuntu: SupabaseClient, userId: string | number) {
  const id = Number(userId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("userId must be an existing Ubuntu ua_users.id")
  }
  const rows = await selectWalletRows(ubuntu, String(id))
  const entries = rows.map(mapWalletRow)
  return {
    userId: String(id),
    entries,
    summary: summarizeWalletLedger(entries),
  }
}
