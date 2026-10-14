import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const enginePath = `${projectRoot}/src/lib/ubuntuBscVerify.mjs`
const persistPath = `${projectRoot}/src/lib/persistBsc.server.ts`
const verifyPath = `${projectRoot}/src/routes/api/payments/verify-bsc.ts`
const initiatePath = `${projectRoot}/src/routes/api/payments/initiate.ts`
const completePath = `${projectRoot}/src/routes/api/payments/complete.ts`
const payPath = `${projectRoot}/src/routes/dashboard/pay.tsx`
const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8")
const pkg = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"))
const publicNft = readFileSync(new URL("../src/routes/api/nft/order.ts", import.meta.url), "utf8")
const persistSettle = readFileSync(new URL("../src/lib/persistMemberPaymentSettle.server.ts", import.meta.url), "utf8")

const company = "0x1111111111111111111111111111111111111111"
const sender = "0x2222222222222222222222222222222222222222"
const hash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

function paddedAddress(address) {
  return "0x" + address.slice(2).toLowerCase().padStart(64, "0")
}

function usdtData(usd) {
  return "0x" + (BigInt(usd) * 10n ** 18n).toString(16).padStart(64, "0")
}

test("Wave X-BSC verifies USDT to the Ubuntu wallet and refuses Aureus mint", {
  skip: !existsSync(enginePath),
}, async () => {
  const {
    BSC_CHAIN_ID,
    BSC_TRANSFER_TOPIC,
    BSC_USDT_CONTRACT,
    UA_BSC_PROVIDER,
    assertBscUsdtPayment,
    assertUbuntuBscEnvValue,
    bscConfigured,
    normalizeTxHash,
    normalizeWallet,
    parseUsdtTransfersToCompany,
    recordBscPaymentEvent,
    usdtRawToUsd,
  } = await import(pathToFileURL(enginePath).href)

  assert.equal(UA_BSC_PROVIDER, "BSC_USDT")
  assert.equal(BSC_CHAIN_ID, 56)
  assert.equal(BSC_USDT_CONTRACT, "0x55d398326f99059ff775485246999027b3197955")
  assert.equal(bscConfigured({}), false)
  assert.equal(bscConfigured({ UA_BSC_COMPANY_WALLET: company }), true)
  assert.equal(normalizeTxHash(hash.toUpperCase()), hash)
  assert.throws(() => normalizeTxHash("not-a-hash"), /hash is invalid/)
  assert.throws(() => normalizeWallet("0x123"), /wallet is invalid/)
  assert.throws(() => assertUbuntuBscEnvValue("https://fgubaqoftdeefcakejwu.supabase.co"), /Aureus/)
  assert.throws(() => assertUbuntuBscEnvValue("nowpayments-ipn"), /Aureus/)
  assert.throws(() => assertUbuntuBscEnvValue("https://shopify.com/pay"), /Aureus/)
  assert.throws(() => assertUbuntuBscEnvValue("aureus_share_purchases"), /does not mint Aureus shares/)
  assert.equal(usdtRawToUsd(usdtData(100)), "100.00")

  const logs = [{
    address: BSC_USDT_CONTRACT,
    topics: [BSC_TRANSFER_TOPIC, paddedAddress(sender), paddedAddress(company)],
    data: usdtData(100),
  }]
  const transfers = parseUsdtTransfersToCompany(logs, company)
  assert.equal(transfers.length, 1)
  assert.equal(transfers[0].to, company)
  assert.equal(transfers[0].amount, "100.00")

  const verified = assertBscUsdtPayment({
    receipt: { status: "0x1", blockNumber: "0x10", logs },
    currentBlockHex: "0x1c",
    companyWallet: company,
    expectedAmount: "100.00",
    minConfirmations: 12,
  })
  assert.equal(verified.received, "100.00")
  assert.equal(verified.provider, "BSC_USDT")
  assert.throws(
    () => assertBscUsdtPayment({
      receipt: { status: "0x1", blockNumber: "0x10", logs },
      currentBlockHex: "0x1c",
      companyWallet: company,
      expectedAmount: "150.00",
      minConfirmations: 12,
    }),
    /below the Ubuntu book total/
  )
  assert.throws(
    () => assertBscUsdtPayment({
      receipt: { status: "0x1", blockNumber: "0x10", logs },
      currentBlockHex: "0x12",
      companyWallet: company,
      expectedAmount: "100.00",
      minConfirmations: 12,
    }),
    /not confirmed/
  )
  const event = recordBscPaymentEvent({
    orderId: "CARD-BSC-1",
    kind: "CARD",
    txHash: hash,
    amount: "100.00",
  })
  assert.equal(event.paymentId, hash)
  assert.equal(event.provider, "BSC_USDT")
  assert.throws(
    () => recordBscPaymentEvent({ orderId: "NFT-1", kind: "NFT", txHash: hash, amount: "100.00" }),
    /CARD, FRACTION, or MARKETPLACE/
  )
})

test("Wave X-BSC routes settle ua_* only and keep NFT 403", () => {
  assert.equal(existsSync(persistPath), true)
  assert.equal(existsSync(verifyPath), true)
  const initiate = readFileSync(initiatePath, "utf8")
  const complete = readFileSync(completePath, "utf8")
  const verify = readFileSync(verifyPath, "utf8")
  const persist = readFileSync(persistPath, "utf8")
  const pay = readFileSync(payPath, "utf8")
  assert.match(initiate, /UA_BSC_PROVIDER/)
  assert.match(initiate, /UA_BSC_COMPANY_WALLET/)
  assert.match(initiate, /bscConfigured/)
  assert.doesNotMatch(initiate, /shopify/i)
  assert.doesNotMatch(initiate, /fgubaqoftdeefcakejwu/)
  assert.match(complete, /verify-bsc/)
  assert.match(verify, /persistMemberPaymentSettle/)
  assert.match(verify, /verifyUbuntuBscHash/)
  assert.doesNotMatch(verify, /aureus_share_purchases/)
  assert.doesNotMatch(verify, /nowpayments/i)
  assert.doesNotMatch(verify, /shopify/i)
  assert.match(persist, /AUREUS_PSP_REFUSED/)
  assert.doesNotMatch(persist, /aureus_share_purchases/)
  assert.match(persistSettle, /persistGapCoverResult/)
  assert.doesNotMatch(persistSettle, /aureus_share_purchases/)
  assert.match(pay, /Verify USDT on BSC/)
  assert.match(pay, /Pay with Paystack/)
  assert.match(pay, /Pay Ubuntu staging/)
  assert.match(pay, /\/api\/payments\/verify-bsc/)
  assert.match(envExample, /UA_BSC_COMPANY_WALLET/)
  assert.match(envExample, /Does not mint Aureus shares/)
  assert.doesNotMatch(envExample, /NOWPAYMENTS/)
  assert.doesNotMatch(envExample, /SHOPIFY/)
  assert.match(publicNft, /Public checkout is not open/)
  assert.equal(pkg.version, "0.1.66")
})