import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { gateUbuntuAdminPage, ubuntuStaffHeaders } from "../../lib/ubuntuAdminClient"

export const Route = createFileRoute("/admin/nft")({
  component: AdminNftPage,
})

function AdminNftPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [assets, setAssets] = useState<Record<string, unknown>[]>([])
  const [listings, setListings] = useState<Record<string, unknown>[]>([])
  const [recon, setRecon] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void gate()
  }, [])

  async function gate() {
    const me = await gateUbuntuAdminPage(navigate, "MARKETPLACE")
    if (!me) return
    if (!me.allowed) {
      setError(me.error)
      return
    }
    setAllowed(true)
  }

  async function load() {
    setBusy(true)
    setError("")
    try {
      const headers = await ubuntuStaffHeaders(confirmSecret)
      const [assetRes, listingRes, reconRes] = await Promise.all([
        fetch("/api/admin/nft/assets", { headers }),
        fetch("/api/admin/nft/listings", { headers }),
        fetch("/api/admin/nft/recon", { headers }),
      ])
      const assetJson = await assetRes.json()
      const listingJson = await listingRes.json()
      const reconJson = await reconRes.json()
      if (!assetRes.ok || !assetJson.ok) {
        setError(assetJson.error || "NFT asset list failed " + assetRes.status)
        return
      }
      setAssets(assetJson.assets || [])
      setListings(listingJson.listings || [])
      setRecon(reconJson)
    } catch (err) {
      setError(err instanceof Error ? err.message : "NFT desk failed")
    } finally {
      setBusy(false)
    }
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading Ubuntu Afrique admin...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold text-gold">NFT desk</span>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Ubuntu NFT recon</h1>
        <p className="mt-2 text-muted-foreground">
          Read-only assets and sales recon. Public buy stays 403. nft_marketplace_enabled stays false. Do not transfer or insert sales.
        </p>
        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
          <input type="password" autoComplete="off" value={confirmSecret} onChange={(e) => setConfirmSecret(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Paste confirm secret" />
          <button type="button" onClick={() => void load()} disabled={busy} className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-background">
            {busy ? "Loading..." : "Load desk"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {recon ? <p className="text-sm">Sales {String(recon.sales || 0)}. Checksum {String(recon.checksum || "-")}. Flags off.</p> : null}
        </div>
        <h2 className="mt-10 font-display text-2xl font-bold">Assets</h2>
        <ul className="mt-3 space-y-2">
          {assets.map((row) => (
            <li key={String(row.id)} className="rounded-xl border border-border bg-card p-4 text-sm">
              {String(row.id)} — {String(row.status)} — owner {String(row.currentOwnerId)}
            </li>
          ))}
        </ul>
        <h2 className="mt-8 font-display text-2xl font-bold">Listings</h2>
        <ul className="mt-3 space-y-2">
          {listings.map((row) => (
            <li key={String(row.id)} className="rounded-xl border border-border bg-card p-4 text-sm">
              {String(row.nftId)} — ${String(row.price)} — {String(row.status)}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
