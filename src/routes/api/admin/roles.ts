import { createFileRoute } from "@tanstack/react-router"
import { loadAdminRoles, persistAdminRoleAssign } from "../../../lib/persistKyc.server"
import { authorizeUbuntuStaff, resolveUbuntuStaffSession } from "../../../lib/ubuntuAdminAuthorize.server"
import { loadUbuntuUser } from "../../../lib/ubuntuServer.server"

export const Route = createFileRoute("/api/admin/roles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const body = { confirmSecret: url.searchParams.get("confirmSecret") || "" }
        const userId = String(url.searchParams.get("userId") || "").trim()
        if (!userId) {
          const self = await resolveUbuntuStaffSession(request)
          if (!self.ok) {
            return Response.json({ ok: false, error: self.error, checkoutEnabled: false }, { status: self.status })
          }
          return Response.json({
            ok: true,
            userId: self.actorUserId,
            username: self.username,
            email: self.email,
            roles: self.roles,
            checkoutEnabled: false,
          })
        }
        const auth = await authorizeUbuntuStaff(request, body, "SUPPORT")
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }
        if (!auth.ubuntu) {
          return Response.json({
            ok: false,
            error: "Ubuntu Afrique database is not configured",
            checkoutEnabled: false,
          }, { status: 503 })
        }
        try {
          await loadUbuntuUser(auth.ubuntu, userId)
          const roles = await loadAdminRoles(auth.ubuntu, userId)
          return Response.json({ ok: true, userId, roles, checkoutEnabled: false })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Role read failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>
        const auth = await authorizeUbuntuStaff(request, body, null)
        if (!auth.ok) {
          return Response.json({ ok: false, error: auth.error, checkoutEnabled: false }, { status: auth.status })
        }
        if (!auth.ubuntu) {
          return Response.json({
            ok: false,
            error: "Ubuntu Afrique database is not configured",
            checkoutEnabled: false,
          }, { status: 503 })
        }
        try {
          const granted = await persistAdminRoleAssign(auth.ubuntu, {
            userId: String(body.userId || ""),
            role: String(body.role || ""),
            grantedByUserId: auth.actorUserId,
            actorVia: auth.via,
          })
          return Response.json({ ok: true, ...granted, via: auth.via })
        } catch (err) {
          return Response.json({
            ok: false,
            error: err instanceof Error ? err.message : "Role grant failed",
            checkoutEnabled: false,
          }, { status: 400 })
        }
      },
    },
  },
})
