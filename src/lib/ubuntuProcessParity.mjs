/** Ubuntu process-parity: Exodus hash attest, Johan approve, then ua_* settle. Does not mint Aureus shares. */
import { SHARE_MINT_REFUSED } from "./ubuntuBscVerify.mjs"
import { assertMemberPaymentKind } from "./ubuntuMemberPaymentGate.mjs"

export const PROCESS_PARITY = "Wave process-parity"
export const NEXT_ADMIN_APPROVE = "admin-approve"
export const JOHAN_SETTLE_REQUIRED =
  "Hash attested. Johan Verify & Approve settles the Ubuntu book."
export const PAYSTACK_TILL_REFUSED = "Paystack is not the Ubuntu till"
export const DUMMY_TILL_REFUSED = "Dummy staging is not the Ubuntu till"
export const BSC_WALLET_REQUIRED = "UA_BSC_COMPANY_WALLET is required"
export const APPROVE_ROLE = "FINANCE"

export function assertNoAureusShareMint(input) {
  const text = JSON.stringify(input == null ? {} : input)
  if (/aureus_share_purchases|claim_payment_for_approval|verify-bsc-transaction/i.test(text)) {
    throw new Error(SHARE_MINT_REFUSED)
  }
  if (/shopify/i.test(text)) {
    throw new Error("Refused. Ubuntu PSP will not use Aureus payment credentials.")
  }
  return true
}

export function assertProcessParityKind(kind) {
  return assertMemberPaymentKind(kind)
}

export function memberPaymentAttestResponse({
  order,
  paymentId,
  attested,
  idempotent,
  provider,
}) {
  return {
    ok: true,
    attested: attested === true,
    settled: false,
    next: NEXT_ADMIN_APPROVE,
    message: JOHAN_SETTLE_REQUIRED,
    paymentId: String(paymentId),
    order: {
      id: String(order.id),
      kind: String(order.kind || ""),
      status: String(order.status || "PENDING_PAYMENT"),
      total: String(order.total || ""),
      paymentId: String(paymentId),
    },
    provider: provider ? String(provider) : "BSC_USDT",
    checkoutEnabled: true,
    nftMarketplaceEnabled: false,
  }
}

export function adminApproveResponse({ order, paymentId, settled, idempotent, provider }) {
  return {
    ok: true,
    attested: true,
    settled: settled === true,
    idempotent: idempotent === true,
    next: settled === true ? "settled" : NEXT_ADMIN_APPROVE,
    paymentId: String(paymentId),
    order: {
      id: String(order.id),
      kind: String(order.kind || ""),
      status: String(order.status || (settled === true ? "PAID" : "PENDING_PAYMENT")),
      total: String(order.total || ""),
      paymentId: String(paymentId),
    },
    provider: provider ? String(provider) : "BSC_USDT",
    mintedAureusShares: false,
    checkoutEnabled: true,
    nftMarketplaceEnabled: false,
  }
}

export { SHARE_MINT_REFUSED }
