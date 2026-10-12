import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useEffect, useState, type ReactNode } from "react"
import { auth } from "../../lib/supabase"
import { isAureusAdmin, type AureusMemberProfile } from "../../lib/aureusMember"
import type { FinanceSummary } from "../../lib/persistFinanceRead.server"

export const Route = createFileRoute("/admin/finance")({
  component: AdminFinancePage,
})

function AdminFinancePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<AureusMemberProfile | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [fetchError, setFetchError] = useState("")
  const [fetching, setFetching] = useState(false)
  const [summary, setSummary] = useState<FinanceSummary | null>(null)

  useEffect(() => {
    void loadAdmin()
  }, [])

  async function loadAdmin() {
    try {
      const current = await auth.getCurrentUser()
      if (!current.user || current.identitySource !== "aureus") {
        navigate({ to: "/auth/login" })
        return
      }
      const member = current.profile
      if (!isAureusAdmin(member)) {
        setError("This Aureus account is not an administrator.")
        return
      }
      setProfile(member)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin profile")
    } finally {
      setLoading(false)
    }
  }

  async function loadSummary() {
    const secret = confirmSecret.trim()
    if (!secret) {
      setFetchError("Enter the commerce confirm secret to load Ubuntu finance totals.")
      return
    }
    setFetching(true)
    setFetchError("")
    try {
      const response = await fetch("/api/admin/finance/summary", {
        headers: { "x-ua-commerce-confirm": secret },
      })
      const body = (await response.json()) as {
        ok?: boolean
        error?: string
        checkoutEnabled?: boolean
        summary?: FinanceSummary
      }
      if (!response.ok || !body.ok) {
        setSummary(null)
        setFetchError(body.error || `Request failed (${response.status})`)
        return
      }
      setSummary(body.summary ?? null)
    } catch (err) {
      setSummary(null)
      setFetchError(err instanceof Error ? err.message : "Failed to load finance summary")
    } finally {
      setFetching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading Ubuntu Afrique admin...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">Ubuntu Afrique Admin</span>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
              Admin home
            </Link>
            <Link to="/admin/cards" className="text-sm text-muted-foreground hover:text-foreground">
              Cards
            </Link>
            <Link to="/admin/fractions" className="text-sm text-muted-foreground hover:text-foreground">
              Fractions
            </Link>
            <Link to="/admin/kyc" className="text-sm text-muted-foreground hover:text-foreground">
              KYC
            </Link>
            <Link to="/admin/ranks" className="text-sm text-muted-foreground hover:text-foreground">
              Ranks
            </Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              User dashboard
            </Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        {error && <p className="text-red-400">{error}</p>}
        {profile && (
          <div className="space-y-6">
            <h1 className="font-display text-3xl font-bold">Finance (read-only)</h1>
            <p className="text-muted-foreground">
              Ubuntu Afrique ledger and commerce totals from the Ubuntu database only. Checkout is not open.
              Ubuntu Afrique does not write Aureus tables.
            </p>
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              Public checkout is disabled. This page does not create orders or confirm payments.
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <label className="block text-sm text-muted-foreground" htmlFor="confirm-secret">
                Commerce confirm secret (required to load totals)
              </label>
              <input
                id="confirm-secret"
                type="password"
                autoComplete="off"
                value={confirmSecret}
                onChange={(event) => setConfirmSecret(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Paste confirm secret"
              />
              <button
                type="button"
                onClick={() => void loadSummary()}
                disabled={fetching}
                className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-background hover:bg-gold disabled:opacity-50"
              >
                {fetching ? "Loading..." : "Load finance summary"}
              </button>
              {fetchError && <p className="text-red-400 text-sm">{fetchError}</p>}
            </div>

            {summary && (
              <div className="grid gap-4 md:grid-cols-2">
                <SummaryCard title="Gap / commission ledger">
                  <Row label="Transaction count" value={String(summary.gapCommission.count)} />
                  <Row label="Amount sum" value={summary.gapCommission.amountSum} />
                  <Row label="Wallet ledger entries" value={String(summary.walletLedger.count)} />
                </SummaryCard>

                <SummaryCard title="Underlying inventory (AUREUS_100K)">
                  <Row label="Remaining underlying" value={summary.remainingUnderlying} />
                  <Row label="User rank rows" value={String(summary.userRankCount)} />
                </SummaryCard>

                <SummaryCard title="BLP periods" className="md:col-span-2">
                  {summary.blpPeriods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No BLP periods in Ubuntu (or table not present).</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {summary.blpPeriods.map((period) => (
                        <li
                          key={period.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0"
                        >
                          <span className="font-medium">{period.id}</span>
                          <span className="text-muted-foreground">{period.status}</span>
                          <span>Sales {period.commissionableSales}</span>
                          <span>BLP {period.blpTotal}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SummaryCard>

                <SummaryCard title="Card orders by status">
                  <StatusCounts counts={summary.cardOrdersByStatus} emptyLabel="No card orders" />
                </SummaryCard>

                <SummaryCard title="Fraction transactions by status">
                  <StatusCounts counts={summary.fractionTransactionsByStatus} emptyLabel="No fraction rows" />
                </SummaryCard>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function SummaryCard({
  title,
  children,
  className = "",
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 space-y-3 ${className}`}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function StatusCounts({ counts, emptyLabel }: { counts: Record<string, number>; emptyLabel: string }) {
  const entries = Object.entries(counts)
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }
  return (
    <ul className="space-y-2">
      {entries.map(([status, count]) => (
        <Row key={status} label={status} value={String(count)} />
      ))}
    </ul>
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
