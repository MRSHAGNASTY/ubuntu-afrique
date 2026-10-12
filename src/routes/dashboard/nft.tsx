import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { filterNftPreview } from "../../lib/ubuntuCatalog.mjs"

export const Route = createFileRoute("/dashboard/nft")({
  component: NftShareholderPage,
})

type NftAsset = {
  id: string
  status?: string
  currentOwnerId?: string
  resaleCount?: number
}

function NftShareholderPage() {
  const [listings, setListings] = useState<unknown[]>([])
  const [assets, setAssets] = useState<NftAsset[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    void loadPreview()
  }, [])

  async function loadPreview() {
    try {
      const listingRes = await fetch("/api/nft/listings")
      const listingJson = await listingRes.json()
      if (listingJson.ok) setListings(listingJson.listings || [])
      const ledgerRes = await fetch("/api/member/ledger", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ua_session") || ""}`,
        },
      })
      const ledger = await ledgerRes.json()
      if (ledger.ok && ledger.userId) {
        const assetRes = await fetch("/api/nft/my-assets?ownerId=" + encodeURIComponent(String(ledger.userId)))
        const assetJson = await assetRes.json()
        if (assetJson.ok) setAssets(assetJson.assets || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "NFT shareholder preview failed")
    }
  }

  const preview = filterNftPreview(listings)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">NFT shareholder</span>
          <div className="flex gap-6 text-sm">
            <Link to="/nft" className="text-muted-foreground hover:text-foreground">Listing preview</Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Member book</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm text-gold/80">Coming Soon. Read-only preview. Purchase stays 403. nft_marketplace_enabled stays false.</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <h1 className="font-display text-3xl font-bold">Your Ubuntu NFT book</h1>
        <p className="mt-2 text-muted-foreground">{assets.length} owned assets</p>
        <ul className="mt-6 space-y-3">
          {assets.map((asset) => {
            const listing = preview.listings.find((row) => row.nftId === asset.id)
            return (
              <li key={asset.id} className="rounded-xl border border-border bg-card p-4">
                <div className="font-medium">{asset.id}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Status {asset.status || "OWNED"}. Listing {listing ? listing.status + " $" + listing.price : "none"}.
                </p>
              </li>
            )
          })}
        </ul>
        {assets.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No owned NFTs on the Ubuntu book yet.</p> : null}
        <h2 className="mt-10 font-display text-2xl font-bold">Listing preview</h2>
        <ul className="mt-4 space-y-3">
          {preview.listings.map((row) => (
            <li key={row.id} className="rounded-xl border border-border bg-card p-4">
              <Link to="/nft/listing/$id" params={{ id: row.id }} className="hover:text-gold">{row.nftId} — ${row.price}</Link>
              <span className="ml-3 text-sm text-muted-foreground">{row.status}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
