import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { auth } from "../../lib/supabase"
import { isAureusAdmin } from "../../lib/aureusMember"

export const Route = createFileRoute("/admin/fractions")({
  component: AdminFractionsPage,
})

type FractionOrder = {
  id: string
  buyer_id: number | string
  quantity: number
  total_amount: string
  qv: string
  transaction_status: string
  underlying_share_equivalent?: string
  aureus_phase?: number
  payment_id?: string
}

function AdminFractionsPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [orders, setOrders] = useState<FractionOrder[]>([])
  const [error, setError] = useState("")
  const [note, setNote] = useState("")
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
      const res = await fetch("/api/admin/fractions/orders?limit=100", {
        headers: { "x-ua-commerce-confirm": secret },
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setOrders([])
        setError(json.error || `Request failed (${res.status})`)
        return
      }
      setOrders(json.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fraction list failed")
    } finally {
      setBusy(false)
    }
  }

  async function post(path: string, body: Record<string, string>) {
    const secret = confirmSecret.trim()
    if (!secret) {
      setError("Confirm secret required")
      return
    }
    setBusy(true)
    setError("")
    setNote("")
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ua-commerce-confirm": secret },
        body: JSON.stringify({ ...body, confirmSecret: secret }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || `Request failed (${res.status})`)
        return
      }
      if (path.includes("liability/remit")) {
        setNote("Remitted. Reserved still does not mean remitted.")
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fraction action failed")
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">SHARE desk</span>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Fractions and liability</h1>
        <p className="mt-2 text-muted-foreground">
          Reserved does not mean remitted. Remit amount comes from the paid fraction, not this form.
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-4">
          <input
            type="password"
            autoComplete="off"
            value={confirmSecret}
            onChange={(event) => setConfirmSecret(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Paste confirm secret"
          />
          <button type="button" onClick={() => void load()} disabled={busy} className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-background">
            {busy ? "Loading..." : "Load fraction orders"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {note && <p className="text-sm text-gold">{note}</p>}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Buyer</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Underlying</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row) => (
                <tr key={row.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-3 font-mono text-xs">{row.id}</td>
                  <td className="px-3 py-3">{String(row.buyer_id)}</td>
                  <td className="px-3 py-3">{row.quantity}</td>
                  <td className="px-3 py-3">${row.total_amount}</td>
                  <td className="px-3 py-3">{row.underlying_share_equivalent || "-"}</td>
                  <td className="px-3 py-3">{row.transaction_status}</td>
                  <td className="px-3 py-3 space-x-2">
                    {row.transaction_status === "PAID" ? (
                      <button type="button" className="text-gold hover:underline" onClick={() => void post("/api/admin/liability/remit", { sourceTransactionId: row.id })}>
                        Remit
                      </button>
                    ) : null}
                    {row.transaction_status === "PAID" ? (
                      <button type="button" className="text-red-400 hover:underline" onClick={() => void post("/api/admin/fractions/refund", { orderId: row.id, reason: "admin desk refund" })}>
                        Refund
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="px-3 py-6 text-sm text-muted-foreground">No fraction orders loaded</p>}
        </div>
      </main>
    </div>
  )
}
