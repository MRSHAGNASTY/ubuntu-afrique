import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterNftPreview } from "../../lib/ubuntuCatalog.mjs"
import { NFT_PRODUCTION_DISABLED, quoteNftDistribution } from "../../lib/nftDistribution.mjs"

export const Route = createFileRoute("/nft/")({
  component: NftPreviewPage,
})

function NftPreviewPage() {
  const [listings, setListings] = useState<unknown[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    void loadListings()
  }, [])

  async function loadListings() {
    try {
      const res = await fetch("/api/nft/listings")
      const json = await res.json()
      if (json.ok) setListings(json.listings || [])
      else setError(json.error || "NFT listings failed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "NFT listings failed")
    }
  }

  const preview = filterNftPreview(listings)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">NFT listing preview</span>
          <div className="flex gap-6 text-sm">
            <Link to="/dashboard/nft" className="text-muted-foreground hover:text-foreground">Shareholder</Link>
            <Link to="/marketplace" className="text-muted-foreground hover:text-foreground">Marketplace</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Coming Soon. nft_marketplace_enabled stays false. Purchase stays 403.</p>
        <p className="mb-6 text-sm text-muted-foreground">{NFT_PRODUCTION_DISABLED}. Confirm stays disabled.</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <h1 className="font-display text-3xl font-bold">Listed NFTs</h1>
        <ul className="mt-6 space-y-3">
          {preview.listings.map((row) => {
            const quote = quoteNftDistribution(row.price)
            return (
              <li key={row.id} className="rounded-xl border border-border bg-card p-4">
                <Link to="/nft/listing/$id" params={{ id: row.id }} className="font-medium hover:text-gold">{row.nftId} — ${row.price} — {row.status}</Link>
                <p className="mt-2 text-sm text-muted-foreground">5/5/5/5/80 preview ${quote.aureus}/${quote.sun}/${quote.special}/${quote.networkGap}/${quote.currentSeller}</p>
                <button type="button" disabled className="mt-3 rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground">Confirm disabled</button>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
