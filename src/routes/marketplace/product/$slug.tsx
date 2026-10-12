import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterMarketplaceCatalog } from "../../../lib/ubuntuCatalog.mjs"

export const Route = createFileRoute("/marketplace/product/$slug")({
  component: MarketplaceProductPage,
})

function MarketplaceProductPage() {
  const navigate = useNavigate()
  const { slug } = Route.useParams()
  const [companies, setCompanies] = useState<unknown[]>([])
  const [products, setProducts] = useState<unknown[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void loadCatalog()
  }, [])

  async function loadCatalog() {
    try {
      const [companyRes, productRes] = await Promise.all([
        fetch("/api/marketplace/companies"),
        fetch("/api/marketplace/products"),
      ])
      const companyJson = await companyRes.json()
      const productJson = await productRes.json()
      if (companyJson.ok) setCompanies(companyJson.companies || [])
      if (productJson.ok) setProducts(productJson.products || [])
      if (!companyJson.ok) setError(companyJson.error || "Product catalog failed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product catalog failed")
    }
  }

  const catalog = filterMarketplaceCatalog({ companies, products, productSlug: slug })
  const product = catalog.products[0]
  const company = catalog.companies.find((row) => row.id === product?.companyId)

  async function buy() {
    if (!product) return
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/marketplace/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || ""}`,
        },
        body: JSON.stringify({ productId: product.productId }),
      })
      const json = await res.json()
      if (res.status === 401) {
        navigate({ to: "/auth/login", search: { next: `/marketplace/product/${slug}` } })
        return
      }
      if (!json.ok) {
        setError(json.error || "Marketplace checkout failed")
        return
      }
      navigate({
        to: "/dashboard/pay",
        search: { kind: "MARKETPLACE", orderId: String(json.order.id) },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marketplace checkout failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/marketplace/products" className="font-display text-lg font-semibold text-gold">Products</Link>
          <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">Catalog</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Named marketplace checkout is open. NFT buy stays 403.</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <h1 className="font-display text-3xl font-bold">{product?.name || slug}</h1>
        <p className="mt-2 text-muted-foreground">{product?.shortDescription || "Ubuntu catalog. No affiliate data."}</p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 space-y-3">
          <Row label="Price" value={product ? "$" + product.retailPrice : "-"} />
          <Row label="Company" value={company?.name || product?.companyId || "-"} />
          <Row label="Type" value={product?.type || "-"} />
          <Row label="SKU" value={product?.sku || "-"} />
          <Row label="Inventory" value={product?.inventory || "not set"} />
        </div>
        {product ? (
          <button
            type="button"
            className="mt-6 rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground"
            disabled={busy}
            onClick={() => void buy()}
          >
            {busy ? "Creating order..." : "Buy marketplace product"}
          </button>
        ) : null}
        <p className="mt-6 text-sm text-muted-foreground">Named open: marketplace_enabled. NFT stays closed.</p>
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
