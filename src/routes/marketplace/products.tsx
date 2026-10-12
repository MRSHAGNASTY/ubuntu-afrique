import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterMarketplaceCatalog } from "../../lib/ubuntuCatalog.mjs"

export const Route = createFileRoute("/marketplace/products")({
  component: MarketplaceProductsPage,
})

function MarketplaceProductsPage() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState("")
  const [sort, setSort] = useState("name")
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
      if (!companyJson.ok) setError(companyJson.error || "Marketplace catalog failed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marketplace catalog failed")
    }
  }

  const catalog = filterMarketplaceCatalog({ companies, products, query, type, sort })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/marketplace" className="font-display text-lg font-semibold text-gold">Marketplace</Link>
          <Link to="/marketplace/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Company desk</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Named marketplace checkout is open. Open a product to buy. NFT buy stays 403.</p>
        <h1 className="font-display text-3xl font-bold">Products</h1>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name" className="rounded-md border border-border bg-card px-4 py-3" />
          <input value={type} onChange={(event) => setType(event.target.value)} placeholder="Type filter if present" className="rounded-md border border-border bg-card px-4 py-3" />
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-md border border-border bg-card px-4 py-3">
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="price-desc">Price desc</option>
          </select>
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <ul className="mt-8 space-y-3">
          {catalog.products.map((product) => (
            <li key={product.productId} className="rounded-xl border border-border bg-card p-4">
              <Link to="/marketplace/product/$slug" params={{ slug: product.slug }} className="font-medium hover:text-gold">{product.name}</Link>
              <span className="ml-3 text-muted-foreground">${product.retailPrice}</span>
              {product.type ? <span className="ml-3 text-xs text-muted-foreground">{product.type}</span> : null}
              <span className="ml-3 text-xs text-muted-foreground">View only</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
