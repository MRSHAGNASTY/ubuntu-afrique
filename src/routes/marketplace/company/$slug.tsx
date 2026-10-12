import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterMarketplaceCatalog } from "../../../lib/ubuntuCatalog.mjs"

export const Route = createFileRoute("/marketplace/company/$slug")({
  component: MarketplaceCompanyPage,
})

function MarketplaceCompanyPage() {
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
      if (!companyJson.ok) setError(companyJson.error || "Company catalog failed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Company catalog failed")
    }
  }

  const catalog = filterMarketplaceCatalog({ companies, products, slug })
  const company = catalog.companies[0]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/marketplace" className="font-display text-lg font-semibold text-gold">Marketplace</Link>
          <Link to="/marketplace/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Company dashboard
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Named marketplace checkout is open. Open a product to buy. NFT buy stays 403.</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <h1 className="font-display text-3xl font-bold">{company?.name || slug}</h1>
        <p className="mt-2 text-muted-foreground">Ubuntu catalog. No affiliate data.</p>
        <ul className="mt-8 space-y-3">
          {catalog.products.map((product) => (
            <li key={product.productId} className="rounded-xl border border-border bg-card p-4">
              {product.name} — ${product.retailPrice}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
