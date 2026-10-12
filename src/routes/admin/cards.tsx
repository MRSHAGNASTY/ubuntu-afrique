import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { auth } from "../../lib/supabase"
import { isAureusAdmin } from "../../lib/aureusMember"

export const Route = createFileRoute("/admin/cards")({
  component: AdminCardsPage,
})

const NEXT_STATUS: Record<string, string> = {
  PROCESSING: "ORDERED_FROM_PROVIDER",
  ORDERED_FROM_PROVIDER: "READY_FOR_SHIPPING",
  READY_FOR_SHIPPING: "SHIPPED",
  SHIPPED: "DELIVERED",
}

type CardOrder = {
  id: string
  user_id: number | string
  product_id: string
  quantity: number
  total: string
  qv: string
  order_status: string
  fulfilment_status?: string
  payment_id?: string
  created_at?: string
}

function AdminCardsPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [productFilter, setProductFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [orders, setOrders] = useState<CardOrder[]>([])
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

  const visible = useMemo(() => {
    return orders.filter((row) => {
      const product = String(row.product_id || "")
      const status = String(row.order_status || "")
      if (productFilter === "PLASTIC" && !product.includes("PLASTIC")) return false
      if (productFilter === "METAL" && !product.includes("METAL")) return false
      if (statusFilter !== "ALL" && status !== statusFilter) return false
      return true
    })
  }, [orders, productFilter, statusFilter])

  async function load() {
    const secret = confirmSecret.trim()
    if (!secret) {
      setError("Confirm secret required")
      return
    }
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/cards/orders?limit=100", {
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
      setError(err instanceof Error ? err.message : "Card list failed")
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
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Card action failed")
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
          <span className="font-display text-lg font-semibold text-gold">CARD desk</span>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Card fulfilment</h1>
        <p className="mt-2 text-muted-foreground">
          Preview confirm secret required. Fulfilment advances one step. Marketplace and NFT stay closed.
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
          <div className="flex flex-wrap gap-3">
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="ALL">All cards</option>
              <option value="PLASTIC">Plastic</option>
              <option value="METAL">Metal</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="ALL">All statuses</option>
              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
              <option value="PAID">PAID</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
            <button type="button" onClick={() => void load()} disabled={busy} className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-background">
              {busy ? "Loading..." : "Load orders"}
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Buyer</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Fulfilment</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const next = NEXT_STATUS[String(row.fulfilment_status || "")]
                return (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-3 font-mono text-xs">{row.id}</td>
                    <td className="px-3 py-3">{String(row.user_id)}</td>
                    <td className="px-3 py-3">{row.product_id}</td>
                    <td className="px-3 py-3">${row.total}</td>
                    <td className="px-3 py-3">{row.order_status}</td>
                    <td className="px-3 py-3">{row.fulfilment_status || "-"}</td>
                    <td className="px-3 py-3 space-x-2">
                      {row.order_status === "PAID" && next ? (
                        <button type="button" className="text-gold hover:underline" onClick={() => void post("/api/admin/cards/status", { orderId: row.id, status: next })}>
                          Advance
                        </button>
                      ) : null}
                      {row.order_status === "PAID" ? (
                        <button type="button" className="text-red-400 hover:underline" onClick={() => void post("/api/admin/cards/refund", { orderId: row.id, reason: "admin desk refund" })}>
                          Refund
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {visible.length === 0 && <p className="px-3 py-6 text-sm text-muted-foreground">No card orders loaded</p>}
        </div>
      </main>
    </div>
  )
}
