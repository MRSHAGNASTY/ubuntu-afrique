import { createFileRoute } from "@tanstack/react-router"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"
import { bearerToken, resolveSessionMember } from "../../../lib/resolveUbuntuSessionMember.server"
import { loadNetworkSnapshot } from "../../../lib/persistNetwork.server"

const CLOSED_FLAGS = {
  checkoutEnabled: false,
  marketplaceEnabled: false,
  nftAssetsEnabled: false,
  nftListingEnabled: false,
  nftMarketplaceEnabled: false,
}

function rejectClientCommerceFields(url: URL) {
  const blocked = [
    "userId",
    "remainingUnderlying",
    "aureusSharePrice",
    "teamVolume",
    "entitlement",
    "investments",
    "shares",
    "wallet",
    "members",
    "rank",
    "currentRank",
  ]
  for (const key of blocked) {
    if (url.searchParams.has(key)) {
      return { ok: false, error: `${key} is taken from the Ubuntu book, not the client` }
    }
  }
  return { ok: true }
}

export const Route = createFileRoute("/api/member/network")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const rejected = rejectClientCommerceFields(url)
        if (!rejected.ok) {
          return Response.json({ ok: false, error: rejected.error, ...CLOSED_FLAGS }, { status: 400 })
        }

        const token = bearerToken(request)
        if (!token) {
          return Response.json({ ok: false, error: "Session required", ...CLOSED_FLAGS }, { status: 401 })
        }

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Ubuntu read refused",
            ...CLOSED_FLAGS,
          }, { status: 500 })
        }
        if (!ubuntu) {
          return Response.json({
            ok: false,
            error: "Ubuntu Afrique database is not configured",
            ...CLOSED_FLAGS,
          }, { status: 503 })
        }

        try {
          const member = await resolveSessionMember(ubuntu, token)
          if (!member) {
            return Response.json({
              ok: false,
              error: "Ubuntu member book not found",
              book: "ubuntu",
              ...CLOSED_FLAGS,
            }, { status: 404 })
          }

          const page = url.searchParams.has("page") ? Number(url.searchParams.get("page")) : undefined
          const pageSize = url.searchParams.has("pageSize") ? Number(url.searchParams.get("pageSize")) : undefined
          const snapshot = await loadNetworkSnapshot(ubuntu, member.id, { page, pageSize })
          return Response.json({
            ok: true,
            userId: snapshot.userId,
            sponsor: snapshot.sponsor,
            directs: snapshot.directs,
            teamMemberCount: snapshot.teamMemberCount,
            qualifiedLegs: snapshot.qualifiedLegs,
            currentRank: snapshot.currentRank,
            pagination: snapshot.pagination,
            ...CLOSED_FLAGS,
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ubuntu network failed"
          if (message === "Invalid session" || message === "Session expired") {
            return Response.json({ ok: false, error: message, ...CLOSED_FLAGS }, { status: 401 })
          }
          const missing = message.includes("not found") || message.includes("ua_users.id")
          return Response.json({ ok: false, error: message, ...CLOSED_FLAGS }, { status: missing ? 404 : 500 })
        }
      },
    },
  },
})
