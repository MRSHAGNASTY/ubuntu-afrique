import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/dashboard/cards")({
  component: CardCheckoutPage,
})

function CardCheckoutPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Array<Record<string, any>>>([])
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState("")
  const [result, setResult] = useState<Record<string, any> | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const res = await fetch("/api/cards/products")
      const json = await res.json()
      if (json.ok) setProducts(json.products || [])
      else setError(json.error || "Card catalog failed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Card catalog failed")
    }
  }

  async function buy(productType: string) {
    setError("")
    setResult(null)
    setBusy(true)
    try {
      const res = await fetch("/api/cards/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || ""}`,
        },
        body: JSON.stringify({ productType, quantity }),
      })
      const json = await res.json()
      if (!json.ok) {
        setError(json.error || "CARD checkout failed")
        return
      }
      setResult(json.order)
      navigate({
        to: "/dashboard/pay",
        search: { kind: "CARD", orderId: String(json.order.id) },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "CARD checkout failed")
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
          <span className="font-display text-lg font-semibold text-gold">Ubuntu CARD checkout</span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Public CARD checkout</h1>
        <p className="mt-2 text-muted-foreground">
          Named open: CARD, FRACTION, and MARKETPLACE. This page places a CARD. After pending, paste the BSC USDT hash. Johan Verify & Approve settles the Ubuntu book. NFT stays closed.
        </p>
        <p className="mt-2 text-sm text-gold/80">
          Creates PENDING_PAYMENT, then opens /dashboard/pay for the Ubuntu BSC hash till.
        </p>
        <label className="mt-8 block text-sm">
          Quantity
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value || 1))}
            className="mt-2 w-32 rounded-md border border-border bg-card px-3 py-2"
          />
        </label>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {result && (
          <p className="mt-4 text-sm text-gold">
            Pending CARD {result.productId} {result.id} @ ${result.total}
          </p>
        )}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <div key={product.productType} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-widest text-gold">{product.productType}</p>
              <h2 className="mt-2 font-display text-xl font-bold">{product.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">Retail {product.unit?.retailPrice}</p>
              <button
                disabled={busy}
                onClick={() => void buy(String(product.productType))}
                className="mt-6 rounded-md border border-gold/50 px-6 py-2 font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
              >
                Place CARD order
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
