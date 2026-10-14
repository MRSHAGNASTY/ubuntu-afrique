import {
  AUREUS_PSP_REFUSED,
  BSC_TX_NOT_FOUND,
  assertBscUsdtPayment,
  assertUbuntuBscEnvValue,
  normalizeTxHash,
  normalizeWallet,
  recordBscPaymentEvent,
  ubuntuBscMinConfirmations,
  ubuntuBscRpc,
} from "./ubuntuBscVerify.mjs"

async function rpcCall(rpcUrl: string, method: string, params: unknown[] = []) {
  assertUbuntuBscEnvValue(rpcUrl)
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  })
  if (!res.ok) throw new Error("BSC RPC request failed")
  const json = (await res.json()) as { error?: { message?: string }; result?: unknown }
  if (json.error) throw new Error(String(json.error.message || "BSC RPC error"))
  return json.result
}

export async function verifyUbuntuBscHash(input: {
  txHash: string
  companyWallet?: string
  expectedAmount: string
  orderId: string
  kind: "CARD" | "FRACTION" | "MARKETPLACE"
  rpcUrl?: string
  minConfirmations?: number
}) {
  const txHash = normalizeTxHash(input.txHash)
  const companyWallet = normalizeWallet(input.companyWallet || process.env.UA_BSC_COMPANY_WALLET || "")
  const rpcUrl = input.rpcUrl || ubuntuBscRpc()
  if (rpcUrl.includes("fgubaqoftdeefcakejwu")) throw new Error(AUREUS_PSP_REFUSED)
  const receipt = await rpcCall(rpcUrl, "eth_getTransactionReceipt", [txHash])
  if (!receipt) throw new Error(BSC_TX_NOT_FOUND)
  const currentBlockHex = await rpcCall(rpcUrl, "eth_blockNumber")
  const verified = assertBscUsdtPayment({
    receipt,
    currentBlockHex: String(currentBlockHex || ""),
    companyWallet,
    expectedAmount: input.expectedAmount,
    minConfirmations: input.minConfirmations ?? ubuntuBscMinConfirmations(),
  })
  return {
    ...verified,
    ...recordBscPaymentEvent({
      orderId: input.orderId,
      kind: input.kind,
      txHash,
      amount: input.expectedAmount,
    }),
    txHash,
  }
}
