import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterNftPreview } from "../../../lib/ubuntuCatalog.mjs"
import { NFT_PRODUCTION_DISABLED, quoteNftDistribution } from "../../../lib/nftDistribution.mjs"

export const Route = createFileRoute("/nft/listing/$id")({
  component: NftListingPreviewPage,
})

function NftListingPreviewPage() {
  const { id } = Route.useParams()
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
      else setError(json.error || "NFT listing failed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "NFT listing failed")
    }
  }

  const preview = filterNftPreview(listings)
  const listing = preview.listings.find((row) => row.id === id)
  const quote = listing ? quoteNftDistribution(listing.price) : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/nft" className="font-display text-lg font-semibold text-gold">NFT preview</Link>
          <Link to="/dashboard/nft" className="text-sm text-muted-foreground hover:text-foreground">Shareholder</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Coming Soon. Read-only 5/5/5/5/80 preview. Purchase stays 403.</p>
        <p className="mb-6 text-sm text-muted-foreground">{NFT_PRODUCTION_DISABLED}</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <h1 className="font-display text-3xl font-bold">{listing?.nftId || id}</h1>
        <p className="mt-2 text-muted-foreground">{listing ? "$" + listing.price + " " + listing.status : "Listing not found"}</p>
        {quote ? (
          <div className="mt-8 space-y-3 rounded-2xl border border-border bg-card p-6">
            <Row label="Aureus 5%" value={"$" + quote.aureus} />
            <Row label="SUN 5%" value={"$" + quote.sun} />
            <Row label="Special 5%" value={"$" + quote.special} />
            <Row label="Network Gap 5%" value={"$" + quote.networkGap} />
            <Row label="Current seller 80%" value={"$" + quote.currentSeller} />
            <Row label="Checksum" value={quote.checksum + "%"} />
          </div>
        ) : null}
        <button type="button" disabled className="mt-6 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">
          Confirm disabled
        </button>
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
