import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterMarketplaceCatalog } from "../../lib/ubuntuCatalog.mjs"

export const Route = createFileRoute("/marketplace/")({
  component: MarketplacePage,
})

function MarketplacePage() {
  const [query, setQuery] = useState("")
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

  const catalog = filterMarketplaceCatalog({ companies, products, query })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">Ubuntu Afrique Marketplace</span>
          <div className="flex gap-6 text-sm">
            <Link to="/marketplace/products" className="text-muted-foreground hover:text-foreground">Products</Link>
            <Link to="/marketplace/dashboard" className="text-muted-foreground hover:text-foreground">Company desk</Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link to="/nft" className="text-muted-foreground hover:text-foreground">NFT preview</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Named marketplace checkout is open. NFT buy stays 403.</p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search companies or products"
          className="mb-8 w-full rounded-md border border-border bg-card px-4 py-3"
        />
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <h1 className="font-display text-3xl font-bold">Companies</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {catalog.companies.map((company) => (
            <Link
              key={company.id}
              to="/marketplace/company/$slug"
              params={{ slug: company.slug }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="font-display text-xl font-semibold">{company.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Catalog only. Checkout closed.</p>
            </Link>
          ))}
        </div>
        <h2 className="mt-12 font-display text-2xl font-bold">Products</h2>
        <ul className="mt-4 space-y-3">
          {catalog.products.map((product) => (
            <li key={product.productId} className="rounded-xl border border-border bg-card p-4">
              <Link to="/marketplace/product/$slug" params={{ slug: product.slug }} className="font-medium hover:text-gold">
                {product.name}
              </Link>
              <span className="ml-3 text-muted-foreground">${product.retailPrice}</span>
              <span className="ml-3 text-xs text-muted-foreground">View only</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
