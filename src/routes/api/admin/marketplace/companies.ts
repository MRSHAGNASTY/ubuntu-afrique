import { createFileRoute } from "@tanstack/react-router"
import { authorizeUbuntuStaff } from "../../../../lib/ubuntuAdminAuthorize.server"
import { getUbuntuServerClient } from "../../../../lib/ubuntuServer.server"
import {
  loadMarketplaceCompanies,
  persistMarketplaceCompany,
} from "../../../../lib/persistMarketplaceCompany.server"

async function authorize(request: Request, secret: string) {
  return authorizeUbuntuStaff(request, { confirmSecret: secret }, "MARKETPLACE")
}

function rejectClientCommerceFields(source: { has: (key: string) => boolean }) {
  if (source.has("remainingUnderlying")) {
    return { ok: false as const, error: "remainingUnderlying is taken from Ubuntu inventory, not the client" }
  }
  if (source.has("aureusSharePrice")) {
    return { ok: false as const, error: "aureusSharePrice and aureusPhase are taken from Ubuntu ua_aureus_phases, not the client" }
  }
  if (source.has("members") || source.has("rank")) {
    return { ok: false as const, error: "Client-supplied rank chains are rejected" }
  }
  return { ok: true as const }
}

function bodyHas(body: Record<string, unknown>, key: string) {
  if (!Object.prototype.hasOwnProperty.call(body, key)) return false
  const value = body[key]
  if (value == null) return false
  if (typeof value === "string" && value.trim() === "") return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

function ubuntuClient() {
  try {
    return { ubuntu: getUbuntuServerClient(), error: null as string | null }
  } catch (err) {
    return { ubuntu: null, error: err instanceof Error ? err.message : "Ubuntu write refused" }
  }
}

export const Route = createFileRoute("/api/admin/marketplace/companies")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const auth = await authorize(request, String(url.searchParams.get("confirmSecret") || ""))
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }

        const rejected = rejectClientCommerceFields(url.searchParams)
        if (!rejected.ok) {
          return Response.json({ ok: false, error: rejected.error, checkoutEnabled: false }, { status: 400 })
        }

        const { ubuntu, error } = ubuntuClient()
        if (error) {
          return Response.json({ ok: false, error, checkoutEnabled: false }, { status: 500 })
        }
        if (!ubuntu) {
          return Response.json(
            { ok: false, error: "Ubuntu Afrique database is not configured", checkoutEnabled: false },
            { status: 503 }
          )
        }

        try {
          const companies = await loadMarketplaceCompanies(ubuntu)
          return Response.json({ ok: true, companies, checkoutEnabled: false })
        } catch (err) {
          return Response.json(
            {
              ok: false,
              error: err instanceof Error ? err.message : "Marketplace company read failed",
              checkoutEnabled: false,
            },
            { status: 500 }
          )
        }
      },

      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const auth = await authorize(request, String(body.confirmSecret || ""))
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }

        const rejected = rejectClientCommerceFields({
          has: (key) => bodyHas(body, key),
        })
        if (!rejected.ok) {
          return Response.json({ ok: false, error: rejected.error, checkoutEnabled: false }, { status: 400 })
        }

        const { ubuntu, error } = ubuntuClient()
        if (error) {
          return Response.json({ ok: false, error, checkoutEnabled: false }, { status: 500 })
        }
        if (!ubuntu) {
          return Response.json(
            { ok: false, error: "Ubuntu Afrique database is not configured", checkoutEnabled: false },
            { status: 503 }
          )
        }

        try {
          const company = await persistMarketplaceCompany(ubuntu, {
            id: body.id,
            name: body.name,
            settlementWallet: body.settlementWallet,
          })
          return Response.json({ ok: true, company, checkoutEnabled: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Marketplace company write failed"
          const status = /is required/.test(message) ? 400 : 500
          return Response.json({ ok: false, error: message, checkoutEnabled: false }, { status })
        }
      },
    },
  },
})
