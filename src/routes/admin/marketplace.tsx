import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { gateUbuntuAdminPage, ubuntuStaffHeaders } from "../../lib/ubuntuAdminClient"

export const Route = createFileRoute("/admin/marketplace")({
  component: AdminMarketplacePage,
})

function AdminMarketplacePage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [confirmSecret, setConfirmSecret] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [settlementWallet, setSettlementWallet] = useState("")
  const [productId, setProductId] = useState("")
  const [productName, setProductName] = useState("")
  const [retailPrice, setRetailPrice] = useState("")
  const [companyPayout, setCompanyPayout] = useState("")
  const [mediaKind, setMediaKind] = useState("LOGO")
  const [mediaUrl, setMediaUrl] = useState("")
  const [companies, setCompanies] = useState<Record<string, unknown>[]>([])
  const [products, setProducts] = useState<Record<string, unknown>[]>([])
  const [media, setMedia] = useState<Record<string, unknown>[]>([])
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
      const [companyRes, productRes, mediaRes] = await Promise.all([
        fetch("/api/admin/marketplace/companies", { headers }),
        fetch("/api/admin/marketplace/products", { headers }),
        fetch("/api/admin/marketplace/media", { headers }),
      ])
      const companyJson = await companyRes.json()
      const productJson = await productRes.json()
      const mediaJson = await mediaRes.json()
      if (!companyRes.ok || !companyJson.ok) {
        setError(companyJson.error || "Company list failed " + companyRes.status)
        return
      }
      setCompanies(companyJson.companies || [])
      setProducts(productJson.products || [])
      setMedia(mediaJson.media || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marketplace desk failed")
    } finally {
      setBusy(false)
    }
  }

  async function post(path: string, body: Record<string, string>) {
    setBusy(true)
    setError("")
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await ubuntuStaffHeaders(confirmSecret)) },
        body: JSON.stringify({ ...body, confirmSecret: confirmSecret.trim() }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || "Request failed " + res.status)
        return
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marketplace write failed")
    } finally {
      setBusy(false)
    }
  }

  async function archive(mediaId: string) {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/marketplace/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await ubuntuStaffHeaders(confirmSecret)) },
        body: JSON.stringify({ mediaId, confirmSecret: confirmSecret.trim() }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || "Archive failed " + res.status)
        return
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed")
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
          <span className="font-display text-lg font-semibold text-gold">Marketplace desk</span>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Ubuntu marketplace</h1>
        <p className="mt-2 text-muted-foreground">
          Companies, products, and media. Named marketplace checkout is open. Do not settle live companies from this desk. NFT stays closed.
        </p>
        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
          <input type="password" autoComplete="off" value={confirmSecret} onChange={(e) => setConfirmSecret(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Paste confirm secret" />
          <button type="button" onClick={() => void load()} disabled={busy} className="rounded-lg bg-gold/90 px-4 py-2 text-sm font-medium text-background">
            {busy ? "Loading..." : "Load desk"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <form className="space-y-3 rounded-2xl border border-border bg-card p-6" onSubmit={(event) => { event.preventDefault(); void post("/api/admin/marketplace/companies", { id: companyId, name: companyName, settlementWallet }) }}>
            <h2 className="font-display text-xl font-semibold">Add company</h2>
            <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} placeholder="Company id" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={settlementWallet} onChange={(e) => setSettlementWallet(e.target.value)} placeholder="Settlement wallet" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" disabled={busy} className="rounded-lg border border-gold/50 px-4 py-2 text-sm">Save company</button>
          </form>
          <form className="space-y-3 rounded-2xl border border-border bg-card p-6" onSubmit={(event) => { event.preventDefault(); void post("/api/admin/marketplace/products", { productId, companyId, name: productName, retailPrice, companyPayout }) }}>
            <h2 className="font-display text-xl font-semibold">Add product</h2>
            <input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Product id" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} placeholder="Retail price" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={companyPayout} onChange={(e) => setCompanyPayout(e.target.value)} placeholder="Company payout" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" disabled={busy} className="rounded-lg border border-gold/50 px-4 py-2 text-sm">Save product</button>
          </form>
        </div>

        <form className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6" onSubmit={(event) => { event.preventDefault(); void post("/api/admin/marketplace/media", { companyId, kind: mediaKind, contentType: "image/png", byteSize: "2048", publicUrl: mediaUrl }) }}>
          <h2 className="font-display text-xl font-semibold">Add media</h2>
          <select value={mediaKind} onChange={(e) => setMediaKind(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="LOGO">LOGO</option>
            <option value="BANNER">BANNER</option>
            <option value="GALLERY">GALLERY</option>
            <option value="PRODUCT">PRODUCT</option>
          </select>
          <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Public image URL" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button type="submit" disabled={busy} className="rounded-lg border border-gold/50 px-4 py-2 text-sm">Save media</button>
        </form>

        <h2 className="mt-10 font-display text-2xl font-bold">Companies</h2>
        <ul className="mt-3 space-y-2">
          {companies.map((row) => (
            <li key={String(row.id)} className="rounded-xl border border-border bg-card p-4 text-sm">
              {String(row.name)} — {String(row.id)} — active {String(row.isActive)}
            </li>
          ))}
        </ul>
        <h2 className="mt-8 font-display text-2xl font-bold">Products</h2>
        <ul className="mt-3 space-y-2">
          {products.map((row) => (
            <li key={String(row.productId)} className="rounded-xl border border-border bg-card p-4 text-sm">
              {String(row.name)} — ${String(row.retailPrice)} — {String(row.companyId)}
            </li>
          ))}
        </ul>
        <h2 className="mt-8 font-display text-2xl font-bold">Media</h2>
        <ul className="mt-3 space-y-2">
          {media.map((row) => (
            <li key={String(row.id)} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm">
              <span>{String(row.kind)} — {String(row.status)} — {String(row.companyId)}</span>
              {String(row.status) !== "ARCHIVED" ? (
                <button type="button" onClick={() => void archive(String(row.id))} className="text-gold hover:underline">Archive</button>
              ) : null}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
