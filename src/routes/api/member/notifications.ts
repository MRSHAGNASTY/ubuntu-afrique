import { createFileRoute } from "@tanstack/react-router"
import { resolveUbuntuMember } from "../../../lib/persistMemberLedger.server"
import { loadMemberNotifications, markNotificationRead } from "../../../lib/persistNotification.server"
import { bearerToken } from "../../../lib/resolveUbuntuSessionMember.server"
import { verifyUaSession } from "../../../lib/uaSession.server"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"

async function memberFromToken(ubuntu: ReturnType<typeof getUbuntuServerClient>, token: string) {
  try {
    const session = verifyUaSession(token)
    return await resolveUbuntuMember(ubuntu, {
      email: session.email,
      aureusUserId: session.aureusUserId,
    })
  } catch {
    const { data, error } = await ubuntu.auth.getUser(token)
    if (error || !data.user) throw new Error("Invalid session")
    return await resolveUbuntuMember(ubuntu, {
      authUserId: data.user.id,
      email: data.user.email || "",
    })
  }
}

export const Route = createFileRoute("/api/member/notifications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
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
          const member = await memberFromToken(ubuntu, token)
          if (!member) {
            return Response.json({ ok: false, error: "Ubuntu member book not found", checkoutEnabled: false }, { status: 404 })
          }
          const notifications = await loadMemberNotifications(ubuntu, member.id)
          return Response.json({ ok: true, userId: String(member.id), notifications, checkoutEnabled: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ubuntu notifications failed"
          const status = message === "Invalid session" || message === "Session expired" ? 401 : 500
          return Response.json({ ok: false, error: message, checkoutEnabled: false }, { status })
        }
      },
      POST: async ({ request }) => {
        const token = bearerToken(request)
        if (!token) {
          return Response.json({ ok: false, error: "Session required", checkoutEnabled: false }, { status: 401 })
        }
        const body = await request.json().catch(() => ({})) as Record<string, unknown>
        const notificationId = String(body.notificationId || "").trim()
        if (!notificationId) {
          return Response.json({ ok: false, error: "notificationId is required", checkoutEnabled: false }, { status: 400 })
        }
        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Ubuntu write refused",
            checkoutEnabled: false,
          }, { status: 500 })
        }
        if (!ubuntu) {
          return Response.json({ ok: false, error: "Ubuntu Afrique database is not configured", checkoutEnabled: false }, { status: 503 })
        }
        try {
          const member = await memberFromToken(ubuntu, token)
          if (!member) {
            return Response.json({ ok: false, error: "Ubuntu member book not found", checkoutEnabled: false }, { status: 404 })
          }
          const read = await markNotificationRead(ubuntu, member.id, notificationId)
          return Response.json({ ok: true, ...read, checkoutEnabled: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ubuntu notification update failed"
          const missing = message.includes("not found")
          return Response.json({ ok: false, error: message, checkoutEnabled: false }, { status: missing ? 404 : 400 })
        }
      },
    },
  },
})
