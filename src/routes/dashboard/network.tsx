import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/dashboard/network")({
  component: NetworkPage,
})

type SponsorRow = {
  userId: string
  username: string
  email: string
  rank: string
}

type DirectRow = {
  userId: string
  username: string
  email: string
  rank: string
}

type NetworkPayload = {
  ok: boolean
  error?: string
  userId?: string
  sponsor?: SponsorRow | null
  directs?: DirectRow[]
  teamMemberCount?: number
  qualifiedLegs?: number
  currentRank?: string
  pagination?: { page: number; pageSize: number; total: number; totalPages: number }
  checkoutEnabled?: boolean
  marketplaceEnabled?: boolean
  nftMarketplaceEnabled?: boolean
}

function sessionToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") || "" : ""
}

function NetworkPage() {
  const navigate = useNavigate()
  const [network, setNetwork] = useState<NetworkPayload | null>(null)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!sessionToken()) {
      navigate({ to: "/auth/login", search: { next: "/dashboard/network" } })
      return
    }
    void load(page)
  }, [page])

  async function load(nextPage: number) {
    setError("")
    try {
      const res = await fetch(`/api/member/network?page=${nextPage}&pageSize=25`, {
        headers: {
          Authorization: `Bearer ${sessionToken()}`,
        },
      })
      const json = await res.json()
      if (res.status === 401) {
        navigate({ to: "/auth/login", search: { next: "/dashboard/network" } })
        return
      }
      if (!json.ok) {
        setError(json.error || "Network load failed")
        setNetwork(json)
        return
      }
      setNetwork(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network load failed")
    }
  }

  const directs = network?.directs || []
  const sponsor = network?.sponsor
  const pagination = network?.pagination

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Member book
          </Link>
          <span className="font-display text-lg font-semibold text-gold">Ubuntu network</span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Network</h1>
        <p className="mt-2 text-muted-foreground">
          Personal directs and sponsor only. Genealogy is not walked for this page. Marketplace and NFT stay closed.
        </p>
        <p className="mt-2 text-sm text-gold/80">
          Rank {network?.currentRank || "—"} · Team members {network?.teamMemberCount ?? 0} · Qualified legs{" "}
          {network?.qualifiedLegs ?? 0}
        </p>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Sponsor</h2>
          {sponsor ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {sponsor.username || sponsor.userId} · {sponsor.email || "no email"} · {sponsor.rank || "unranked"}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No sponsor on the Ubuntu tree.</p>
          )}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-widest text-gold">Team members</p>
            <p className="mt-2 font-display text-2xl font-bold">{network?.teamMemberCount ?? 0}</p>
            <p className="mt-2 text-sm text-muted-foreground">Directs on ua_sponsor_tree. Depth is not walked.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-widest text-gold">Qualified legs</p>
            <p className="mt-2 font-display text-2xl font-bold">{network?.qualifiedLegs ?? 0}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Two ASMs under one personal leg still count as one qualified leg.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Directs</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Username</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Rank</th>
                  <th className="pb-2 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {directs.length === 0 ? (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={4}>
                      No personal directs.
                    </td>
                  </tr>
                ) : (
                  directs.map((row) => (
                    <tr key={row.userId} className="border-t border-border/60">
                      <td className="py-3">{row.username || "—"}</td>
                      <td className="py-3">{row.email || "—"}</td>
                      <td className="py-3">{row.rank || "—"}</td>
                      <td className="py-3">{row.userId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-md border border-gold/50 px-4 py-2 font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-md border border-gold/50 px-4 py-2 font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
