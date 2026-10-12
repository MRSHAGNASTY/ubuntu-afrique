import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterMarketplaceCatalog } from "../../../lib/ubuntuCatalog.mjs"

export const Route = createFileRoute("/marketplace/product/$slug")({
  component: MarketplaceProductPage,
})

function MarketplaceProductPage() {
  const { slug } = Route.useParams()
  const [companies, setCompanies] = useState<unknown[]>([])
  const [products, setProducts] = useState<unknown[]>([])
  const [error, setError] = useState("")

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/marketplace/products" className="font-display text-lg font-semibold text-gold">Products</Link>
          <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">Catalog</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Coming Soon. View only. No checkout button. Public buy stays 403.</p>
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
        <p className="mt-6 text-sm text-muted-foreground">Purchase is closed. marketplace_enabled stays false.</p>
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
