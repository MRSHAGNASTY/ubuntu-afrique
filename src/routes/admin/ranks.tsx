import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { auth } from "../../lib/supabase"
import { isAureusAdmin } from "../../lib/aureusMember"

export const Route = createFileRoute("/admin/ranks")({
  component: AdminRanksPage,
})

function AdminRanksPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [userId, setUserId] = useState("")
  const [progress, setProgress] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void gate()
  }, [])

  async function gate() {
    const current = await auth.getCurrentUser()
    if (!current.user || current.identitySource !== "aureus" || !isAureusAdmin(current.profile)) {
      navigate({ to: "/auth/login" })
      return
    }
    setAllowed(true)
  }

  async function loadProgress() {
    const secret = confirmSecret.trim()
    const id = userId.trim()
    if (!secret || !id) {
      setError("Confirm secret and Ubuntu userId are required")
      return
    }
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/ranks/progress?userId=${encodeURIComponent(id)}`, {
        headers: { "x-ua-commerce-confirm": secret },
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setProgress(null)
        setError(json.error || `Request failed (${res.status})`)
        return
      }
      setProgress(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rank progress failed")
    } finally {
      setBusy(false)
    }
  }

  async function promote() {
    const secret = confirmSecret.trim()
    const id = userId.trim()
    if (!secret || !id) {
      setError("Confirm secret and Ubuntu userId are required")
      return
    }
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/ranks/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ua-commerce-confirm": secret },
        body: JSON.stringify({ userId: id, confirmSecret: secret }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || `Request failed (${res.status})`)
        return
      }
      await loadProgress()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rank promote failed")
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

  const p = progress?.progress

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">Ranks desk</span>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Corporate rank</h1>
        <p className="mt-2 text-muted-foreground">
          Rank is calculated on the Ubuntu book. This page does not auto-promote. Enter a userId, load progress, then promote only if you mean it.
        </p>
        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
          <input type="password" autoComplete="off" value={confirmSecret} onChange={(e) => setConfirmSecret(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Paste confirm secret" />
          <input value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Ubuntu ua_users.id" />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void loadProgress()} disabled={busy} className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-background">Load progress</button>
            <button type="button" onClick={() => void promote()} disabled={busy} className="rounded-lg border border-gold/50 px-4 py-2 text-sm text-gold">Promote if qualified</button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        {progress && (
          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6">
            <Row label="Current rank" value={String(progress.currentRank || "")} />
            <Row label="Next rank" value={String(progress.nextRank || "Top rank")} />
            <Row label="Team volume" value={`$${p?.teamVolume?.have || "0"} / $${p?.teamVolume?.need || "0"}`} />
            <Row label="Team members" value={`${p?.teamMembers?.have || 0} / ${p?.teamMembers?.need || 0}`} />
            <Row label="Qualified legs" value={`${p?.qualifiedLegs?.have || 0} / ${p?.qualifiedLegs?.need || 0}`} />
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
