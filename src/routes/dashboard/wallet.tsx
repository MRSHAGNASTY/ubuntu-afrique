import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/dashboard/wallet")({
  component: WalletLedgerPage,
})

type WalletSummary = {
  available: string
  credits: string
  reversals: string
  byType: Record<string, string>
}

type WalletEntry = {
  entryType: string
  amount: string
  status: string
  source?: string
  sourceTransactionId?: string
  ref?: string
  createdAt: string
}

function WalletLedgerPage() {
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [userId, setUserId] = useState("")
  const [summary, setSummary] = useState<WalletSummary | null>(null)
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadWallet()
  }, [])

  async function loadWallet() {
    setError("")
    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || "" : ""
      if (!token) {
        navigate({ to: "/auth/login" })
        return
      }
      const res = await fetch("/api/member/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.status === 401 || !json.ok) {
        if (res.status === 401) {
          navigate({ to: "/auth/login" })
          return
        }
        setError(json.error || "Ubuntu wallet failed")
        return
      }
      setUserId(String(json.userId || ""))
      setSummary(json.summary || { available: "0.00", credits: "0.00", reversals: "0.00", byType: {} })
      setEntries(Array.isArray(json.entries) ? json.entries : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ubuntu wallet failed")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading wallet...</div>
      </div>
    )
  }

  const byType = summary?.byType || {}

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Member book
          </Link>
          <span className="font-display text-lg font-semibold text-gold">Ubuntu wallet ledger</span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Wallet ledger</h1>
        <p className="mt-2 text-muted-foreground">
          Available is credits minus reversals from posted Ubuntu rows. Member {userId || "—"}.
        </p>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Available</div>
            <div className="mt-1 font-display text-2xl font-bold">${summary?.available || "0.00"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Credits</div>
            <div className="mt-1 font-display text-2xl font-bold">${summary?.credits || "0.00"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Reversals</div>
            <div className="mt-1 font-display text-2xl font-bold">${summary?.reversals || "0.00"}</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-8">
          <h2 className="font-display text-xl font-semibold">By type</h2>
          <div className="mt-6 space-y-3 text-sm">
            {Object.keys(byType).length === 0 ? (
              <p className="text-muted-foreground">No posted credit types</p>
            ) : (
              Object.entries(byType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between border-b border-border/50 pb-3">
                  <span className="text-sm text-muted-foreground">{type}</span>
                  <span className="font-display text-lg font-semibold">${amount}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Source / ref</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={5}>
                    No posted or voided wallet rows
                  </td>
                </tr>
              ) : (
                entries.map((row, index) => (
                  <tr key={`${row.createdAt}-${row.entryType}-${index}`} className="border-b border-border/40">
                    <td className="px-6 py-4">{row.createdAt || "—"}</td>
                    <td className="px-6 py-4">{row.entryType}</td>
                    <td className="px-6 py-4">${row.amount}</td>
                    <td className="px-6 py-4">{row.status}</td>
                    <td className="px-6 py-4">{row.source || row.sourceTransactionId || row.ref || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
