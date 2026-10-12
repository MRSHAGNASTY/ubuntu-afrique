import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/dashboard/orders")({
  component: MemberOrdersPage,
})

type CardOrder = {
  id: string
  kind: "CARD"
  productId: string
  quantity: number
  total: string
  qv: string
  status: string
  paymentId: string
  trackingNumber: string
  createdAt: string
}

type FractionOrder = {
  id: string
  kind: "FRACTION"
  quantity: number
  total: string
  qv: string
  status: string
  paymentId: string
  underlyingShareEquivalent: string
  aureusPhase: string
  createdAt: string
}

function sessionToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") || "" : ""
}

function MemberOrdersPage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<CardOrder[]>([])
  const [fractions, setFractions] = useState<FractionOrder[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!sessionToken()) {
      navigate({ to: "/auth/login", search: { next: "/dashboard/orders" } })
      return
    }
    void load()
  }, [])

  async function load() {
    setError("")
    try {
      const res = await fetch("/api/member/orders", {
        headers: { Authorization: `Bearer ${sessionToken()}` },
      })
      const json = await res.json()
      if (res.status === 401) {
        navigate({ to: "/auth/login", search: { next: "/dashboard/orders" } })
        return
      }
      if (!json.ok) {
        setError(json.error || "Ubuntu orders failed")
        return
      }
      setCards(json.cards || [])
      setFractions(json.fractions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ubuntu orders failed")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Member book
          </Link>
          <span className="font-display text-lg font-semibold text-gold">My orders</span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Card and fraction orders</h1>
        <p className="mt-2 text-muted-foreground">
          Ubuntu book only. PENDING_PAYMENT opens the staging pay gate. Marketplace and NFT stay closed.
        </p>
        {error && <p className="mt-4 text-red-400">{error}</p>}

        <h2 className="mt-10 font-display text-xl font-semibold">Cards</h2>
        <OrderTable
          empty="No card orders"
          rows={cards.map((row) => ({
            id: row.id,
            kind: row.kind,
            detail: row.productId,
            quantity: row.quantity,
            total: row.total,
            qv: row.qv,
            status: row.status,
            extra: row.trackingNumber ? `Track ${row.trackingNumber}` : "",
          }))}
        />

        <h2 className="mt-10 font-display text-xl font-semibold">Fractions</h2>
        <OrderTable
          empty="No fraction orders"
          rows={fractions.map((row) => ({
            id: row.id,
            kind: row.kind,
            detail: `Phase ${row.aureusPhase} / ${row.underlyingShareEquivalent} underlying`,
            quantity: row.quantity,
            total: row.total,
            qv: row.qv,
            status: row.status,
            extra: "",
          }))}
        />
      </main>
    </div>
  )
}

function OrderTable({
  empty,
  rows,
}: {
  empty: string
  rows: Array<{
    id: string
    kind: "CARD" | "FRACTION"
    detail: string
    quantity: number
    total: string
    qv: string
    status: string
    extra: string
  }>
}) {
  if (!rows.length) {
    return <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Detail</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">QV</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
              <td className="px-4 py-3">{row.detail}{row.extra ? ` — ${row.extra}` : ""}</td>
              <td className="px-4 py-3">{row.quantity}</td>
              <td className="px-4 py-3">${row.total}</td>
              <td className="px-4 py-3">{row.qv}</td>
              <td className="px-4 py-3">{row.status}</td>
              <td className="px-4 py-3">
                {row.status === "PENDING_PAYMENT" ? (
                  <Link
                    to="/dashboard/pay"
                    search={{ kind: row.kind, orderId: row.id }}
                    className="text-gold hover:underline"
                  >
                    Pay
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
