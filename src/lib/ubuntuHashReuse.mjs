/** Ubuntu hash-reuse guard. Prod Aureus SELECT only. Does not mint shares. */
export const HASH_REUSED_UBUNTU =
  "BSC hash is already recorded on Ubuntu ua_payment_events"
export const HASH_REUSED_AUREUS =
  "BSC hash is already recorded on Aureus crypto_payment_transactions"
export const HASH_REUSE_AUREUS_SELECT_REQUIRED =
  "Aureus prod SELECT is required for hash-reuse guard"
export const HASH_REUSE_SELECT_ONLY = "GET"
export const AUREUS_CPT_TABLE = "crypto_payment_transactions"

export function aureusHashReuseSelectPath(paymentId) {
  const hash = String(paymentId || "").trim().toLowerCase()
  if (!/^0x[0-9a-f]{64}$/.test(hash)) {
    throw new Error("BSC transaction hash is invalid")
  }
  return (
    AUREUS_CPT_TABLE +
    "?select=id,transaction_hash,status&transaction_hash=ilike." +
    hash +
    "&limit=1"
  )
}

export function decideHashReuse(input) {
  const orderId = String(input?.orderId || "").trim()
  const aureusRow = input?.aureusRow || null
  const ubuntuEvent = input?.ubuntuEvent || null
  if (aureusRow && (aureusRow.id || aureusRow.transaction_hash)) {
    throw new Error(HASH_REUSED_AUREUS)
  }
  if (ubuntuEvent && String(ubuntuEvent.order_id || "") !== orderId) {
    throw new Error(HASH_REUSED_UBUNTU)
  }
  return { ok: true, ubuntuIdempotent: Boolean(ubuntuEvent) }
}
