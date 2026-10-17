import type { SupabaseClient } from "@supabase/supabase-js"
import { aureusRestSelect } from "./aureusAdminRest.server"
import { loadPaymentEvent } from "./persistPayment.server"
import { normalizeTxHash } from "./ubuntuBscVerify.mjs"
import {
  HASH_REUSE_AUREUS_SELECT_REQUIRED,
  HASH_REUSED_AUREUS,
  aureusHashReuseSelectPath,
  decideHashReuse,
} from "./ubuntuHashReuse.mjs"

export async function selectAureusCryptoPaymentByHash(paymentId: string) {
  const pathAndQuery = aureusHashReuseSelectPath(paymentId)
  if (!pathAndQuery.startsWith("crypto_payment_transactions?select=")) {
    throw new Error("Aureus hash-reuse path must be SELECT only")
  }
  const result = await aureusRestSelect<
    Array<{ id?: string; transaction_hash?: string; status?: string }>
  >(pathAndQuery)
  if (result.error) {
    const message = String(result.error.message || "")
    if (/AUREUS_SERVICE_ROLE_KEY missing/i.test(message)) {
      throw new Error(HASH_REUSE_AUREUS_SELECT_REQUIRED)
    }
    throw new Error(message || HASH_REUSED_AUREUS)
  }
  const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : []
  return rows[0] || null
}

export async function assertBscHashReusable(
  ubuntu: SupabaseClient,
  input: { paymentId: string; orderId: string }
) {
  const paymentId = normalizeTxHash(input.paymentId)
  const orderId = String(input.orderId || "").trim()
  const ubuntuEvent = await loadPaymentEvent(ubuntu, paymentId)
  const aureusRow = await selectAureusCryptoPaymentByHash(paymentId)
  return decideHashReuse({ ubuntuEvent, aureusRow, orderId })
}
