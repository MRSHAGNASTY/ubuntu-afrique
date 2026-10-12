import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/dashboard/pay")({
  validateSearch: (search: Record<string, unknown>) => ({
    kind: typeof search.kind === "string" ? search.kind : "",
    orderId: typeof search.orderId === "string" ? search.orderId : "",
  }),
  component: PayPage,
})

function sessionToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || "" : ""
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + sessionToken(),
  }
}

function PayPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: "/dashboard/pay" })
  const [pending, setPending] = useState<Array<Record<string, any>>>([])
  const [ticket, setTicket] = useState<Record<string, any> | null>(null)
  const [result, setResult] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!sessionToken()) {
      navigate({ to: "/auth/login", search: { next: "/dashboard/pay" } })
      return
    }
    void load()
  }, [search.kind, search.orderId])

  async function load() {
    setError("")
    setTicket(null)
    setResult(null)
    try {
      if (search.kind && search.orderId) {
        const res = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ kind: search.kind, orderId: search.orderId }),
        })
        const json = await res.json()
        if (res.status === 401) {
          navigate({ to: "/auth/login", search: { next: "/dashboard/pay" } })
          return
        }
        if (!json.ok) {
          setError(json.error || "Payment initiate failed")
          return
        }
        setTicket(json)
        return
      }
      const res = await fetch("/api/payments/pending", { headers: authHeaders() })
      const json = await res.json()
      if (res.status === 401) {
        navigate({ to: "/auth/login", search: { next: "/dashboard/pay" } })
        return
      }
      if (!json.ok) {
        setError(json.error || "Pending payments failed")
        return
      }
      setPending(json.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment gate failed")
    }
  }

  async function pay() {
    if (!ticket) return
    if (!sessionToken()) {
      navigate({ to: "/auth/login", search: { next: "/dashboard/pay" } })
      return
    }
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/payments/complete", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          kind: ticket.kind,
          orderId: ticket.orderId,
          paymentId: ticket.paymentId,
          signature: ticket.signature,
        }),
      })
      const json = await res.json()
      if (res.status === 401) {
        navigate({ to: "/auth/login", search: { next: "/dashboard/pay" } })
        return
      }
      if (!json.ok) {
        setError(json.error || "Payment complete failed")
        return
      }
      setResult(json.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment complete failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Member book
          </Link>
          <span className="font-display text-lg font-semibold text-gold">Ubuntu payment gate</span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Pay CARD, FRACTION, or MARKETPLACE</h1>
        <p className="mt-2 text-muted-foreground">
          Ubuntu staging PSP only. Sign in on this host first. Amount comes from the Ubuntu book. NFT stays closed.
        </p>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {result && (
          <p className="mt-4 text-sm text-gold">
            Paid {result.kind} {result.id} @ ${result.total}
          </p>
        )}
        {ticket && !result && (
          <section className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-6">
            <p className="text-xs uppercase tracking-widest text-gold">{ticket.kind}</p>
            <p className="mt-2 font-display text-2xl font-bold">${ticket.amount} USD</p>
            <p className="mt-2 text-sm text-muted-foreground">Order {ticket.orderId}</p>
            <p className="mt-1 text-sm text-muted-foreground">Provider {ticket.provider}</p>
            <button
              disabled={busy}
              onClick={() => void pay()}
              className="mt-6 rounded-md border border-gold/50 px-6 py-2 font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
            >
              Pay Ubuntu staging
            </button>
          </section>
        )}
        {!ticket && !result && (
          <section className="mt-8 grid gap-4">
            {pending.length === 0 && !error && (
              <p className="text-sm text-muted-foreground">No pending CARD, FRACTION, or MARKETPLACE orders.</p>
            )}
            {pending.map((order) => (
              <button
                key={order.id}
                onClick={() =>
                  navigate({
                    to: "/dashboard/pay",
                    search: { kind: order.kind, orderId: order.id },
                  })
                }
                className="rounded-2xl border border-border bg-card p-6 text-left hover:border-gold/50"
              >
                <p className="text-xs uppercase tracking-widest text-gold">{order.kind}</p>
                <p className="mt-2 font-semibold">{order.productId} qty {order.quantity}</p>
                <p className="text-sm text-muted-foreground">${order.total} {order.status}</p>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}