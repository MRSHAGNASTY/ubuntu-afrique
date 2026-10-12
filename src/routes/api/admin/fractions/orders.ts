import { createFileRoute } from "@tanstack/react-router"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"

async function authorize(request: Request, url: URL) {
  return authorizeUbuntuStaff(request, { confirmSecret: String(url.searchParams.get("confirmSecret") || "") }, "SHARE")
}

function rejectClientCommerceFields(url: URL) {
  if (url.searchParams.has("remainingUnderlying")) {
    return { ok: false, error: "remainingUnderlying is taken from Ubuntu inventory, not the client" }
  }
  if (url.searchParams.has("aureusSharePrice")) {
    return { ok: false, error: "aureusSharePrice and aureusPhase are taken from Ubuntu ua_aureus_phases, not the client" }
  }
  if (url.searchParams.has("members")) {
    return { ok: false, error: "Client-supplied rank chains are rejected" }
  }
  return { ok: true }
}

export const Route = createFileRoute("/api/admin/fractions/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const auth = await authorize(request, url)
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }

        const rejected = rejectClientCommerceFields(url)
        if (!rejected.ok) {
          return Response.json({ ok: false, error: rejected.error, checkoutEnabled: false }, { status: 400 })
        }

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Ubuntu read refused",
            checkoutEnabled: false,
          }, { status: 500 })
        }
        if (!ubuntu) {
          return Response.json({ ok: false, error: "Ubuntu Afrique database is not configured", checkoutEnabled: false }, { status: 503 })
        }

        const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200)
        const { data: orders, error } = await ubuntu
          .from("ua_fraction_transactions")
          .select("id, buyer_id, quantity, fraction_price, total_amount, aureus_phase, aureus_share_price, underlying_share_equivalent, price_version, qv, transaction_status, payment_id, sponsor_id, created_at")
          .order("created_at", { ascending: false })
          .limit(limit)
        if (error) {
          return Response.json({ ok: false, error: error.message, checkoutEnabled: false }, { status: 500 })
        }

        return Response.json({ ok: true, orders: orders || [], checkoutEnabled: false })
      },
    },
  },
})
