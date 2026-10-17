import { createFileRoute } from "@tanstack/react-router"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { persistJohanApprove } from "../../../../lib/persistBscAttest.server"
import {
  SHARE_MINT_REFUSED,
  adminApproveResponse,
  assertNoAureusShareMint,
  assertProcessParityKind,
} from "../../../../lib/ubuntuProcessParity.mjs"
import { UA_BSC_PROVIDER } from "../../../../lib/ubuntuBscVerify.mjs"

export const Route = createFileRoute("/api/admin/payments/approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        const auth = await authorizeUbuntuStaff(request, body as Record<string, unknown>, "FINANCE")
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }
        if (!auth.ubuntu) {
          return Response.json({ ok: false, error: "Ubuntu Afrique database is not configured" }, { status: 503 })
        }
        try {
          assertNoAureusShareMint(body)
          const kind = assertProcessParityKind((body as { kind?: string }).kind)
          const orderId = String((body as { orderId?: string }).orderId || "").trim()
          const paymentId = String((body as { paymentId?: string }).paymentId || "").trim()
          if (!orderId || !paymentId) {
            return Response.json({ ok: false, error: "orderId and paymentId are required" }, { status: 400 })
          }
          const settled = await persistJohanApprove(auth.ubuntu, {
            kind,
            orderId,
            paymentId,
            actorUserId: auth.actorUserId,
          })
          return Response.json(
            adminApproveResponse({
              order: settled.order,
              paymentId,
              settled: true,
              idempotent: settled.idempotent === true,
              provider: UA_BSC_PROVIDER,
            })
          )
        } catch (err) {
          const message = err instanceof Error ? err.message : "Approve failed"
          const mint = message.includes(SHARE_MINT_REFUSED) || message.includes("does not mint")
          const missing = message.includes("required") || message.includes("not found")
          const conflict = message.includes("already") || message.includes("not pending")
          return Response.json({
            ok: false,
            error: message,
            mintedAureusShares: false,
            nftMarketplaceEnabled: false,
          }, { status: mint ? 403 : missing ? 409 : conflict ? 409 : 400 })
        }
      },
    },
  },
})
