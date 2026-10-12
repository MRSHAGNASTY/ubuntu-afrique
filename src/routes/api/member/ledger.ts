import { createFileRoute } from "@tanstack/react-router"
import { verifyUaSession } from "../../../lib/uaSession.server"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"
import { loadMemberLedgerSnapshot, resolveUbuntuMember } from "../../../lib/persistMemberLedger.server"

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || ""
  return header.startsWith("Bearer ") ? header.slice(7) : ""
}

function rejectClientCommerceFields(url: URL) {
  const blocked = [
    "remainingUnderlying",
    "aureusSharePrice",
    "teamVolume",
    "entitlement",
    "investments",
    "shares",
    "wallet",
    "userId",
  ]
  for (const key of blocked) {
    if (url.searchParams.has(key)) {
      return { ok: false, error: `${key} is taken from the Ubuntu book, not the client` }
    }
  }
  return { ok: true }
}

export const Route = createFileRoute("/api/member/ledger")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const rejected = rejectClientCommerceFields(url)
        if (!rejected.ok) {
          return Response.json({ ok: false, error: rejected.error, checkoutEnabled: false }, { status: 400 })
        }

        const token = bearerToken(request)
        if (!token) {
          return Response.json({ ok: false, error: "Session required", checkoutEnabled: false }, { status: 401 })
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

        try {
          let member = null
          try {
            const session = verifyUaSession(token)
            member = await resolveUbuntuMember(ubuntu, {
              email: session.email,
              aureusUserId: session.aureusUserId,
            })
          } catch {
            const { data, error } = await ubuntu.auth.getUser(token)
            if (error || !data.user) {
              return Response.json({ ok: false, error: "Invalid session", checkoutEnabled: false }, { status: 401 })
            }
            member = await resolveUbuntuMember(ubuntu, {
              authUserId: data.user.id,
              email: data.user.email || "",
            })
          }

          if (!member) {
            return Response.json({
              ok: false,
              error: "Ubuntu member book not found",
              book: "ubuntu",
              checkoutEnabled: false,
            }, { status: 404 })
          }

          const overview = await loadMemberLedgerSnapshot(ubuntu, member.id)
          return Response.json({ ok: true, ...overview })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ubuntu ledger failed"
          const missing = message.includes("not found")
          return Response.json({ ok: false, error: message, checkoutEnabled: false }, { status: missing ? 404 : 500 })
        }
      },
    },
  },
})
