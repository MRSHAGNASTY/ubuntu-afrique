import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterMarketplaceCatalog } from "../../lib/ubuntuCatalog.mjs"

export const Route = createFileRoute("/marketplace/dashboard")({
  component: MarketplaceDashboardPage,
})

function MarketplaceDashboardPage() {
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
      if (!companyJson.ok) setError(companyJson.error || "Company dashboard failed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Company dashboard failed")
    }
  }

  const catalog = filterMarketplaceCatalog({ companies, products })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">Company dashboard</span>
          <div className="flex gap-6 text-sm">
            <Link to="/marketplace/products" className="text-muted-foreground hover:text-foreground">Products</Link>
            <Link to="/marketplace" className="text-muted-foreground hover:text-foreground">Catalog</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Company desk: profile, products, and inventory only. No affiliate or network. Named checkout is on the product page.</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <h1 className="font-display text-3xl font-bold">Ubuntu company desk</h1>
        <ul className="mt-6 space-y-4">
          {catalog.companies.map((company) => {
            const companyProducts = catalog.products.filter((row) => row.companyId === company.id)
            const inventoryRows = companyProducts.filter((row) => row.inventory)
            return (
              <li key={company.id} className="rounded-xl border border-border bg-card p-4">
                <div className="font-display text-xl font-semibold">{company.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">Profile {company.id}. Active {String(company.isActive)}.</p>
                <p className="mt-2 text-sm">{companyProducts.length} products. Inventory rows {inventoryRows.length}.</p>
                <ul className="mt-3 space-y-2">
                  {companyProducts.map((product) => (
                    <li key={product.productId} className="text-sm">
                      <Link to="/marketplace/product/$slug" params={{ slug: product.slug }} className="hover:text-gold">{product.name}</Link>
                      <span className="ml-2 text-muted-foreground">${product.retailPrice}</span>
                      <span className="ml-2 text-muted-foreground">inv {product.inventory || "not set"}</span>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
