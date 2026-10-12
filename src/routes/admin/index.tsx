import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { auth } from "../../lib/supabase"
import { isAureusAdmin, type AureusMemberProfile } from "../../lib/aureusMember"

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
})

const DESKS = [
  { to: "/admin/finance", role: "FINANCE", title: "Finance", detail: "Ledger and commerce totals" },
  { to: "/admin/cards", role: "CARD", title: "Cards", detail: "Orders, fulfilment, refund" },
  { to: "/admin/fractions", role: "SHARE", title: "Fractions", detail: "Orders, liability remit, refund" },
  { to: "/admin/kyc", role: "KYC", title: "KYC", detail: "Ubuntu review only" },
  { to: "/admin/ranks", role: "SUPPORT", title: "Ranks", detail: "Progress and promote" },
  { to: "/admin/reports", role: "FINANCE", title: "Reports", detail: "Date-range Ubuntu book" },
] as const

function AdminPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<AureusMemberProfile | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

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
        setError("This account is not an administrator.")
        return
      }
      setProfile(member)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin profile")
    } finally {
      setLoading(false)
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
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Member book
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        {error && <p className="text-red-400">{error}</p>}
        {profile && (
          <div className="space-y-6">
            <h1 className="font-display text-3xl font-bold">Ubuntu Afrique administration</h1>
            <p className="text-muted-foreground">
              Desks use the Preview confirm secret or an Ubuntu role (FINANCE, KYC, CARD, SHARE, MARKETPLACE, SUPPORT).
              Ubuntu Afrique does not write Aureus tables. Marketplace and NFT stay closed.
            </p>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <Row label="Aureus identity (read-only)" value={String(profile.id)} />
              <Row label="Username" value={profile.username} />
              <Row label="Email" value={profile.email} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {DESKS.map((desk) => (
                <Link
                  key={desk.to}
                  to={desk.to}
                  className="rounded-2xl border border-border bg-card p-6 hover:border-gold/50"
                >
                  <div className="text-xs uppercase tracking-widest text-gold">{desk.role}</div>
                  <div className="mt-2 font-display text-xl font-semibold">{desk.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{desk.detail}</div>
                </Link>
              ))}
            </div>
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
