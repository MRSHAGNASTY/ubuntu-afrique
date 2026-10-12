import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { auth } from "../../lib/supabase"
import { isAureusAdmin } from "../../lib/aureusMember"

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsPage,
})

function AdminReportsPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [preset, setPreset] = useState("weekly")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [report, setReport] = useState<Record<string, any> | null>(null)
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

  async function load() {
    const secret = confirmSecret.trim()
    if (!secret) {
      setError("Confirm secret required")
      return
    }
    setBusy(true)
    setError("")
    try {
      const params = new URLSearchParams({ preset })
      if (preset === "custom") {
        params.set("from", from)
        params.set("to", to)
      }
      const res = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: { "x-ua-commerce-confirm": secret },
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setReport(null)
        setError(json.error || `Request failed (${res.status})`)
        return
      }
      setReport(json.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed")
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">Reports</span>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Ubuntu reports</h1>
        <p className="mt-2 text-muted-foreground">
          Read-only Ubuntu book. Marketplace and NFT stay closed. NFT sales should be 0 until named.
        </p>
        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
          <input type="password" autoComplete="off" value={confirmSecret} onChange={(e) => setConfirmSecret(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Paste confirm secret" />
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
          {preset === "custom" && (
            <div className="flex gap-3">
              <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          )}
          <button type="button" onClick={() => void load()} disabled={busy} className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-background">
            {busy ? "Loading..." : "Load report"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        {report && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card title="Range" value={`${report.range?.from || ""} → ${report.range?.to || ""}`} />
            <Card title="Sales total" value={`$${report.salesTotal}`} />
            <Card title="Card sales" value={`${report.cardSales?.count || 0} / $${report.cardSales?.amount || "0.00"}`} />
            <Card title="Fraction sales" value={`${report.fractionSales?.count || 0} / $${report.fractionSales?.amount || "0.00"}`} />
            <Card title="QV" value={String(report.qv)} />
            <Card title="Gap paid" value={`$${report.gapPaid}`} />
            <Card title="Unclaimed gap" value={`$${report.unclaimedGap}`} />
            <Card title="Wallet liability" value={`$${report.walletLiability}`} />
            <Card title="Remaining underlying" value={String(report.remainingUnderlying)} />
            <Card title="Ranks" value={String(report.userRankCount)} />
            <Card title="Marketplace settlement" value={`$${report.marketplaceSettlement}`} />
            <Card title="NFT sales" value={String(report.nftSalesCount)} />
          </div>
        )}
      </main>
    </div>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="mt-2 font-display text-xl font-semibold">{value}</div>
    </div>
  )
}
