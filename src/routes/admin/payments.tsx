import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { gateUbuntuAdminPage, ubuntuStaffHeaders } from "../../lib/ubuntuAdminClient"

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsPage,
})

type AttestedOrder = {
  kind: string
  orderId: string
  paymentId: string
  amount: string
  provider: string
  status: string
  ownerId: string
  createdAt: string
}

function AdminPaymentsPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [orders, setOrders] = useState<AttestedOrder[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState("")

  useEffect(() => {
    void gate()
  }, [])

  async function gate() {
    const me = await gateUbuntuAdminPage(navigate, "FINANCE")
    if (!me) return
    if (!me.allowed) {
      setError(me.error)
      return
    }
    setAllowed(true)
  }

  async function load() {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/payments/attested", {
        headers: await ubuntuStaffHeaders(confirmSecret),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setOrders([])
        setError(json.error || `Request failed (${res.status})`)
        return
      }
      setOrders(json.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attested list failed")
    } finally {
      setBusy(false)
    }
  }

  async function approve(row: AttestedOrder) {
    setBusy(true)
    setError("")
    setResult("")
    try {
      const res = await fetch("/api/admin/payments/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await ubuntuStaffHeaders(confirmSecret)),
        },
        body: JSON.stringify({
          kind: row.kind,
          orderId: row.orderId,
          paymentId: row.paymentId,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || `Approve failed (${res.status})`)
        return
      }
      setResult("Settled " + row.kind + " " + row.orderId + " on ua_*. Aureus shares were not minted.")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed")
    } finally {
      setBusy(false)
    }
  }

  if (!allowed && !error) {
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
            <Link to="/admin/finance" className="text-sm text-muted-foreground hover:text-foreground">
              Finance
            </Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Member book
            </Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12 space-y-6">
        <h1 className="font-display text-3xl font-bold">Verify & Approve</h1>
        <p className="text-muted-foreground">
          Johan attests the BSC USDT hash already submitted by the member, then settles CARD, FRACTION, or MARKETPLACE on ua_*.
          This does not write aureus_share_purchases. NFT stays 403.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {result && <p className="text-sm text-gold">{result}</p>}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <label className="block text-sm text-muted-foreground" htmlFor="confirm-secret">
            Optional Preview confirm secret (FINANCE role session is enough)
          </label>
          <input
            id="confirm-secret"
            type="password"
            autoComplete="off"
            value={confirmSecret}
            onChange={(event) => setConfirmSecret(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            disabled={busy}
            onClick={() => void load()}
            className="rounded-md border border-gold/50 px-6 py-2 font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
          >
            Load attested hashes
          </button>
        </div>
        <section className="grid gap-4">
          {orders.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">No attested PENDING_PAYMENT rows waiting for Johan.</p>
          )}
          {orders.map((row) => (
            <div key={row.kind + row.orderId} className="rounded-2xl border border-border bg-card p-6 space-y-2">
              <p className="text-xs uppercase tracking-widest text-gold">{row.kind}</p>
              <p className="font-semibold">{row.orderId}</p>
              <p className="text-sm text-muted-foreground">Member {row.ownerId} · ${row.amount} · {row.provider}</p>
              <p className="break-all font-mono text-sm text-gold">{row.paymentId}</p>
              <button
                disabled={busy}
                onClick={() => void approve(row)}
                className="mt-2 rounded-md border border-gold/50 px-6 py-2 font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
              >
                Verify & Approve
              </button>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
