import { createFileRoute } from "@tanstack/react-router"
import { resolveUbuntuMember } from "../../../lib/persistMemberLedger.server"
import { loadMemberOrders } from "../../../lib/persistMemberOrders.server"
import { bearerToken } from "../../../lib/resolveUbuntuSessionMember.server"
import { verifyUaSession } from "../../../lib/uaSession.server"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"

export const Route = createFileRoute("/api/member/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = bearerToken(request)
        if (!token) {
          return Response.json({ ok: false, error: "Session required" }, { status: 401 })
        }

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Ubuntu read refused",
          }, { status: 500 })
        }
        if (!ubuntu) {
          return Response.json({
            ok: false,
            error: "Ubuntu Afrique database is not configured",
          }, { status: 503 })
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
              return Response.json({ ok: false, error: "Invalid session" }, { status: 401 })
            }
            member = await resolveUbuntuMember(ubuntu, {
              authUserId: data.user.id,
              email: data.user.email || "",
            })
          }

          if (!member) {
            return Response.json({ ok: false, error: "Ubuntu member book not found" }, { status: 404 })
          }

          const snapshot = await loadMemberOrders(ubuntu, member.id)
          return Response.json({ ok: true, ...snapshot })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ubuntu orders failed"
          const missing = message.includes("not found")
          return Response.json({ ok: false, error: message }, { status: missing ? 404 : 500 })
        }
      },
    },
  },
})
