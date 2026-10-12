import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState, type FormEvent } from "react"

export const Route = createFileRoute("/dashboard/kyc")({
  component: MemberKycPage,
})

const KYC_STATUSES = ["PENDING", "COMPLETED", "REJECTED"] as const

function sessionToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") || localStorage.getItem("auth_token") || "" : ""
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionToken()}`,
  }
}

function MemberKycPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [country, setCountry] = useState("")
  const [status, setStatus] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!sessionToken()) {
      navigate({ to: "/auth/login", search: { next: "/dashboard/kyc" } })
      return
    }
    void load()
  }, [])

  function applyProfile(kyc: Record<string, unknown> | null) {
    if (!kyc) {
      setStatus("")
      setReason("")
      return
    }
    setFullName(String(kyc.fullName || ""))
    setCountry(String(kyc.country || ""))
    setStatus(String(kyc.status || ""))
    setReason(kyc.reason == null ? "" : String(kyc.reason))
  }

  async function load() {
    setError("")
    try {
      const res = await fetch("/api/member/kyc", { headers: authHeaders() })
      const json = await res.json()
      if (res.status === 401) {
        navigate({ to: "/auth/login", search: { next: "/dashboard/kyc" } })
        return
      }
      if (!json.ok) {
        setError(json.error || "Ubuntu KYC load failed")
        return
      }
      applyProfile(json.kyc || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ubuntu KYC load failed")
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!sessionToken()) {
      navigate({ to: "/auth/login", search: { next: "/dashboard/kyc" } })
      return
    }
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/member/kyc", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ fullName, country }),
      })
      const json = await res.json()
      if (res.status === 401) {
        navigate({ to: "/auth/login", search: { next: "/dashboard/kyc" } })
        return
      }
      if (!json.ok) {
        setError(json.error || "Ubuntu KYC submit failed")
        return
      }
      applyProfile(json.kyc || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ubuntu KYC submit failed")
    } finally {
      setBusy(false)
    }
  }

  const locked = status === "COMPLETED"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Member book
          </Link>
          <span className="font-display text-lg font-semibold text-gold">Ubuntu member KYC</span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Member KYC</h1>
        <p className="mt-2 text-muted-foreground">
          Ubuntu book only. Submit fullName and country. Status starts PENDING. Admin review is not this page.
          Marketplace and NFT stay closed.
        </p>
        <p className="mt-4 text-xs uppercase tracking-widest text-gold">
          {status && KYC_STATUSES.includes(status as (typeof KYC_STATUSES)[number]) ? status : "No Ubuntu KYC on file"}
        </p>
        {reason && <p className="mt-2 text-sm text-red-400">{reason}</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <form onSubmit={(event) => void submit(event)} className="mt-8 max-w-lg rounded-2xl border border-border bg-card p-6">
          <label className="block text-sm">
            Full name
            <input
              name="fullName"
              value={fullName}
              disabled={locked || busy}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="mt-6 block text-sm">
            Country
            <input
              name="country"
              value={country}
              disabled={locked || busy}
              onChange={(event) => setCountry(event.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={locked || busy}
            className="mt-6 rounded-md border border-gold/50 px-6 py-2 font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
          >
            Submit Ubuntu KYC
          </button>
        </form>
      </main>
    </div>
  )
}
