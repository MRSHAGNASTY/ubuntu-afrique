import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Copy, Users, TrendingUp, DollarSign, ArrowLeft, CheckCircle } from "lucide-react"

export const Route = createFileRoute("/affiliate/")({
  component: AffiliatePage,
})

type DirectRow = { userId: string; username: string; email: string; rank: string }

function sessionToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || "" : ""
}

function AffiliatePage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [userId, setUserId] = useState("")
  const [directs, setDirects] = useState<DirectRow[]>([])
  const [teamMemberCount, setTeamMemberCount] = useState(0)
  const [currentRank, setCurrentRank] = useState("SSA")
  const [available, setAvailable] = useState("0.00")
  const [credits, setCredits] = useState("0.00")
  const [entries, setEntries] = useState<Array<{ entryType: string; amount: string; status: string; createdAt: string }>>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionToken()) {
      navigate({ to: "/auth/login", search: { next: "/affiliate" } })
      return
    }
    void load()
  }, [])

  async function load() {
    setError("")
    try {
      const headers = { Authorization: `Bearer ${sessionToken()}` }
      const [networkRes, walletRes, ledgerRes] = await Promise.all([
        fetch("/api/member/network", { headers }),
        fetch("/api/member/wallet", { headers }),
        fetch("/api/member/ledger", { headers }),
      ])
      const network = await networkRes.json()
      const wallet = await walletRes.json()
      const ledger = await ledgerRes.json()
      if (networkRes.status === 401 || walletRes.status === 401 || ledgerRes.status === 401) {
        navigate({ to: "/auth/login", search: { next: "/affiliate" } })
        return
      }
      if (!network.ok) {
        setError(network.error || "Ubuntu network failed")
        return
      }
      if (!wallet.ok) {
        setError(wallet.error || "Ubuntu wallet failed")
        return
      }
      setUsername(String(ledger.username || network.userId || "member"))
      setUserId(String(ledger.userId || network.userId || ""))
      setDirects(network.directs || [])
      setTeamMemberCount(Number(network.teamMemberCount) || 0)
      setCurrentRank(String(network.currentRank || "SSA"))
      setAvailable(wallet.summary?.available || "0.00")
      setCredits(wallet.summary?.credits || "0.00")
      setEntries(Array.isArray(wallet.entries) ? wallet.entries.slice(0, 8) : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ubuntu affiliate failed")
    } finally {
      setLoading(false)
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const referralLink = `${origin}/auth/register?ref=${encodeURIComponent(username || userId || "")}`

  function copyReferralLink() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading Ubuntu affiliate...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Member book</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Affiliate</h1>
        <p className="mt-2 text-muted-foreground">
          Ubuntu ua_users sponsor tree and wallet ledger. Rank {currentRank}. Marketplace and NFT stay closed.
        </p>
        {error && <p className="mt-4 text-red-400">{error}</p>}

        <div className="mb-8 mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Referral link</h2>
          <div className="flex gap-3">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 rounded-lg border border-gold/20 bg-background/60 px-4 py-3 font-mono text-sm text-foreground"
            />
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-2 rounded-lg bg-gold-gradient px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-gold)]"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Directs" value={String(directs.length)} subtext="Personal legs" />
          <StatCard icon={TrendingUp} label="Team members" value={String(teamMemberCount)} subtext="Sponsor-tree count" />
          <StatCard icon={DollarSign} label="Wallet available" value={`$${available}`} subtext="Posted credits minus reversals" />
          <StatCard icon={DollarSign} label="Wallet credits" value={`$${credits}`} subtext="Gap / BLP / NFT types" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="mb-6 font-display text-xl font-semibold">Direct team</h2>
            {directs.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No personal directs yet</p>
            ) : (
              <div className="space-y-4">
                {directs.map((row) => (
                  <div key={row.userId} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
                    <div>
                      <p className="font-semibold">{row.username || row.userId}</p>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                    <p className="font-semibold text-gold">{row.rank || "SSA"}</p>
                  </div>
                ))}
              </div>
            )}
            <Link to="/dashboard/network" className="mt-6 inline-block text-sm text-gold hover:underline">
              Open network
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="mb-6 font-display text-xl font-semibold">Wallet lines</h2>
            {entries.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No posted wallet lines</p>
            ) : (
              <div className="space-y-4">
                {entries.map((row, idx) => (
                  <div key={`${row.createdAt}-${idx}`} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
                    <div>
                      <p className="font-semibold">{row.entryType}</p>
                      <p className="text-xs text-muted-foreground">{row.status}</p>
                    </div>
                    <p className="font-semibold text-gold">${row.amount}</p>
                  </div>
                ))}
              </div>
            )}
            <Link to="/dashboard/wallet" className="mt-6 inline-block text-sm text-gold hover:underline">
              Open wallet
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtext: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-gold">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>
    </div>
  )
}
