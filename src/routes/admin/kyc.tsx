import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { gateUbuntuAdminPage, ubuntuStaffHeaders } from "../../lib/ubuntuAdminClient"

export const Route = createFileRoute("/admin/kyc")({
  component: AdminKycPage,
})

function AdminKycPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [userId, setUserId] = useState("")
  const [reason, setReason] = useState("")
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void gate()
  }, [])

  async function gate() {
    const me = await gateUbuntuAdminPage(navigate, "KYC")
    if (!me) return
    if (!me.allowed) {
      setError(me.error)
      return
    }
    setAllowed(true)
  }

  async function load() {
    if (!userId.trim()) {
      setError("Ubuntu userId is required")
      return
    }
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/kyc/profile?userId=${encodeURIComponent(userId.trim())}`, {
        headers: await ubuntuStaffHeaders(confirmSecret),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setProfile(null)
        setError(json.error || `Request failed (${res.status})`)
        return
      }
      setProfile(json.kyc || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC load failed")
    } finally {
      setBusy(false)
    }
  }

  async function review(decision: "COMPLETED" | "REJECTED") {
    if (!userId.trim()) {
      setError("Ubuntu userId is required")
      return
    }
    if (decision === "REJECTED" && !reason.trim()) {
      setError("Rejected KYC requires a reason")
      return
    }
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/kyc/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await ubuntuStaffHeaders(confirmSecret)) },
        body: JSON.stringify({
          userId: userId.trim(),
          decision,
          reason: reason.trim() || undefined,
          confirmSecret: confirmSecret.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || `Request failed (${res.status})`)
        return
      }
      setProfile(json.kyc || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC review failed")
    } finally {
      setBusy(false)
    }
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading Ubuntu Afrique admin...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">KYC desk</span>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Ubuntu KYC review</h1>
        <p className="mt-2 text-muted-foreground">
          Ubuntu tables only. Confirm secret or KYC role. Aureus KYC fields are rejected.
        </p>
        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
          <input type="password" autoComplete="off" value={confirmSecret} onChange={(e) => setConfirmSecret(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Paste confirm secret" />
          <input value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Ubuntu ua_users.id" />
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Reject reason (required for REJECTED)" />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void load()} disabled={busy} className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-background">Load profile</button>
            <button type="button" onClick={() => void review("COMPLETED")} disabled={busy} className="rounded-lg border border-gold/50 px-4 py-2 text-sm text-gold">COMPLETED</button>
            <button type="button" onClick={() => void review("REJECTED")} disabled={busy} className="rounded-lg border border-red-400/50 px-4 py-2 text-sm text-red-400">REJECTED</button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        {profile && (
          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
            <Row label="Status" value={String(profile.status || "")} />
            <Row label="Full name" value={String(profile.fullName || "")} />
            <Row label="Country" value={String(profile.country || "")} />
            <Row label="Reason" value={profile.reason == null ? "-" : String(profile.reason)} />
          </div>
        )}
      </main>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
