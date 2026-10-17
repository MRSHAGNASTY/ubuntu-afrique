import { createFileRoute } from "@tanstack/react-router"
import {
  assertMemberPaymentGateNamed,
  memberPaymentGateFlags,
  rejectMemberPaymentClientOverrides,
} from "../../../lib/ubuntuMemberPaymentGate.mjs"

function gateError(status: number, error: string) {
  return Response.json({ ok: false, error, ...memberPaymentGateFlags() }, { status })
}

export const Route = createFileRoute("/api/payments/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        try {
          assertMemberPaymentGateNamed()
          rejectMemberPaymentClientOverrides(body)
        } catch (err) {
          const message = err instanceof Error ? err.message : "Member payment gate refused"
          const forbidden = message.includes("only") || message.includes("not open")
          return gateError(forbidden ? 403 : 400, message)
        }
        return gateError(400, "Submit the BSC USDT hash to /api/payments/verify-bsc. Johan Verify & Approve settles the Ubuntu book.")
      },
    },
  },
})
