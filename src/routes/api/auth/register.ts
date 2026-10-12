import { createFileRoute } from "@tanstack/react-router"
import { getUbuntuServerClient } from "../../../lib/ubuntuServer.server"
import { persistCivilianOnboard } from "../../../lib/persistCivilianOnboard.server"
import {
  AUREUS_ONBOARD_REFUSED,
  assertNoAureusOnboard,
  buildCivilianOnboard,
  firstRunPath,
  normalizeCivilianEmail,
  normalizeCivilianUsername,
} from "../../../lib/ubuntuOnboarding.mjs"

function json(body: Record<string, unknown>, status = 200) {
  return Response.json({ ...body, checkoutEnabled: false, firstRun: firstRunPath() }, { status })
}

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>
        try {
          assertNoAureusOnboard(body)
        } catch (err) {
          return json({ ok: false, error: err instanceof Error ? err.message : AUREUS_ONBOARD_REFUSED }, 400)
        }
        const email = String(body.email || "")
        const username = String(body.username || "")
        const password = String(body.password || "")
        const sponsorCode = body.sponsorCode == null ? "" : String(body.sponsorCode)
        if (password.length < 8) {
          return json({ ok: false, error: "password must be at least 8 characters" }, 400)
        }
        try {
          normalizeCivilianEmail(email)
          normalizeCivilianUsername(username)
          buildCivilianOnboard({
            email,
            username,
            authUserId: "00000000-0000-4000-8000-000000000001",
            sponsorCode,
          })
        } catch (err) {
          return json({ ok: false, error: err instanceof Error ? err.message : "Civilian register refused" }, 400)
        }

        let ubuntu
        try {
          ubuntu = getUbuntuServerClient()
        } catch (err) {
          return json({ ok: false, error: err instanceof Error ? err.message : "Ubuntu write refused" }, 500)
        }
        if (!ubuntu) {
          return json({ ok: false, error: "Ubuntu Afrique database is not configured" }, 503)
        }

        const created = await ubuntu.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password,
          email_confirm: true,
        })
        if (created.error || !created.data.user) {
          return json({ ok: false, error: created.error?.message || "Ubuntu auth user create failed" }, 400)
        }

        try {
          const member = await persistCivilianOnboard(ubuntu, {
            email,
            username,
            authUserId: created.data.user.id,
            sponsorCode,
          })
          return json({
            ok: true,
            userId: member.userId,
            username: member.username,
            sponsorId: member.sponsorId,
            identitySource: "ubuntu",
            pendingAureusProvision: false,
          })
        } catch (err) {
          await ubuntu.auth.admin.deleteUser(created.data.user.id).catch(() => undefined)
          const message = err instanceof Error ? err.message : "Ubuntu civilian onboard failed"
          const status = message.includes("not found") || message.includes("taken") || message.includes("already") ? 409 : 400
          return json({ ok: false, error: message }, status)
        }
      },
    },
  },
})
