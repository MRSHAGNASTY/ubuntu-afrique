/** Ubuntu Afrique BSC USDT till. Settles ua_* only. Does not mint Aureus shares. */
import { compareMoney, formatMoney2, parseMoney } from "./money.mjs"
import { assertPaymentKind, recordPaymentEvent } from "./paymentAdapter.mjs"

export const UA_BSC_PROVIDER = "BSC_USDT"
export const UA_BSC_NAMED = "Wave X-BSC"
export const BSC_CHAIN_ID = 56
export const BSC_USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955"
export const BSC_USDT_DECIMALS = 18
export const BSC_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
export const DEFAULT_BSC_RPC = "https://bsc-dataseed.binance.org"
export const DEFAULT_MIN_CONFIRMATIONS = 12
export const AUREUS_PSP_REFUSED = "Refused. Ubuntu PSP will not use Aureus payment credentials."
export const BSC_WALLET_REQUIRED = "UA_BSC_COMPANY_WALLET is required"
export const BSC_HASH_INVALID = "BSC transaction hash is invalid"
export const BSC_WALLET_INVALID = "Ubuntu BSC company wallet is invalid"
export const BSC_TX_NOT_FOUND = "BSC transaction not found"
export const BSC_TX_FAILED = "BSC transaction failed"
export const BSC_NOT_CONFIRMED = "BSC transaction is not confirmed"
export const BSC_NOT_USDT = "Not a USDT transfer to the Ubuntu company wallet"
export const BSC_UNDERPAID = "USDT amount is below the Ubuntu book total"
export const SHARE_MINT_REFUSED = "Refused. Ubuntu BSC verify does not mint Aureus shares."

const USDT_TO_MONEY_DIVISOR = 10n ** BigInt(BSC_USDT_DECIMALS - 8)

function requiredText(value, field) {
  const text = String(value == null ? "" : value).trim()
  if (!text) throw new Error(field + " is required")
  return text
}

export function assertUbuntuBscEnvValue(value) {
  const text = String(value || "")
  if (/fgubaqoftdeefcakejwu|nowpayments|aureus[_-]?psp|nowp[_-]?ipn|shopify/i.test(text)) {
    throw new Error(AUREUS_PSP_REFUSED)
  }
  if (/aureus_share_purchases|verify-bsc-transaction|claim_payment_for_approval/i.test(text)) {
    throw new Error(SHARE_MINT_REFUSED)
  }
  return text
}

export function bscConfigured(env = process.env) {
  return Boolean(String(env?.UA_BSC_COMPANY_WALLET || "").trim())
}

export function ubuntuBscRpc(env = process.env) {
  const rpc = String(env?.UA_BSC_RPC_URL || DEFAULT_BSC_RPC).trim() || DEFAULT_BSC_RPC
  assertUbuntuBscEnvValue(rpc)
  if (!/^https:\/\//i.test(rpc)) throw new Error("UA_BSC_RPC_URL must be https")
  return rpc
}

export function ubuntuBscMinConfirmations(env = process.env) {
  const raw = String(env?.UA_BSC_MIN_CONFIRMATIONS || DEFAULT_MIN_CONFIRMATIONS).trim()
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) return DEFAULT_MIN_CONFIRMATIONS
  return value
}

export function normalizeTxHash(hash) {
  const value = String(hash || "").trim().toLowerCase()
  if (!/^0x[0-9a-f]{64}$/.test(value)) throw new Error(BSC_HASH_INVALID)
  return value
}

export function normalizeWallet(address) {
  const value = String(address || "").trim().toLowerCase()
  if (!value) throw new Error(BSC_WALLET_REQUIRED)
  assertUbuntuBscEnvValue(value)
  if (!/^0x[0-9a-f]{40}$/.test(value)) throw new Error(BSC_WALLET_INVALID)
  return value
}

export function topicAddress(topic) {
  const value = String(topic || "").trim().toLowerCase()
  if (!/^0x[0-9a-f]{64}$/.test(value)) throw new Error(BSC_NOT_USDT)
  return "0x" + value.slice(-40)
}

export function usdtRawToUsd(dataHex) {
  const raw = String(dataHex || "").trim()
  if (!/^0x[0-9a-f]+$/i.test(raw)) throw new Error(BSC_NOT_USDT)
  const amount = BigInt(raw)
  if (amount <= 0n) throw new Error(BSC_NOT_USDT)
  return formatMoney2(amount / USDT_TO_MONEY_DIVISOR)
}

export function hexToNumber(hex) {
  const value = String(hex || "").trim()
  if (!value) return 0
  return Number(BigInt(value))
}

export function parseUsdtTransfersToCompany(logs, companyWallet) {
  const wallet = normalizeWallet(companyWallet)
  const transfers = []
  for (const log of Array.isArray(logs) ? logs : []) {
    if (String(log?.address || "").trim().toLowerCase() !== BSC_USDT_CONTRACT) continue
    const topics = Array.isArray(log.topics) ? log.topics : []
    if (String(topics[0] || "").toLowerCase() !== BSC_TRANSFER_TOPIC) continue
    const to = topicAddress(topics[2])
    if (to !== wallet) continue
    transfers.push({
      from: topicAddress(topics[1]),
      to,
      amount: usdtRawToUsd(log.data),
    })
  }
  return transfers
}

export function sumUsd(amounts) {
  let total = 0n
  for (const amount of amounts) {
    total += parseMoney(amount)
  }
  return formatMoney2(total)
}

export function assertUsdtCoversOrder(receivedUsd, expectedUsd) {
  if (compareMoney(parseMoney(receivedUsd), parseMoney(expectedUsd)) < 0) {
    throw new Error(BSC_UNDERPAID)
  }
  return true
}

export function assertBscUsdtPayment({
  receipt,
  currentBlockHex,
  companyWallet,
  expectedAmount,
  minConfirmations = DEFAULT_MIN_CONFIRMATIONS,
} = {}) {
  if (!receipt || String(receipt.status || "").toLowerCase() !== "0x1") {
    throw new Error(BSC_TX_FAILED)
  }
  const txBlock = hexToNumber(receipt.blockNumber)
  const currentBlock = hexToNumber(currentBlockHex)
  if (!txBlock || currentBlock < txBlock) throw new Error(BSC_NOT_CONFIRMED)
  const confirmations = currentBlock - txBlock + 1
  if (confirmations < Number(minConfirmations || 0)) throw new Error(BSC_NOT_CONFIRMED)
  const transfers = parseUsdtTransfersToCompany(receipt.logs, companyWallet)
  if (!transfers.length) throw new Error(BSC_NOT_USDT)
  const received = sumUsd(transfers.map((row) => row.amount))
  assertUsdtCoversOrder(received, expectedAmount)
  return {
    received,
    expected: formatMoney2(parseMoney(expectedAmount)),
    confirmations,
    from: transfers[0].from,
    to: normalizeWallet(companyWallet),
    token: "USDT",
    chainId: BSC_CHAIN_ID,
    provider: UA_BSC_PROVIDER,
  }
}

export function recordBscPaymentEvent({ orderId, kind, txHash, amount }) {
  return recordPaymentEvent({
    orderId,
    kind: assertPaymentKind(kind),
    paymentId: normalizeTxHash(txHash),
    amount,
    provider: UA_BSC_PROVIDER,
    order: { id: requiredText(orderId, "orderId"), total: amount, kind },
    currency: "USD",
  })
}
