import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/dashboard/notifications")({
  component: MemberNotificationsPage,
})

type Note = {
  id: string
  event: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

function sessionToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") || "" : ""
}

function MemberNotificationsPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<Note[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!sessionToken()) {
      navigate({ to: "/auth/login", search: { next: "/dashboard/notifications" } })
      return
    }
    void load()
  }, [])

  async function load() {
    setError("")
    try {
      const res = await fetch("/api/member/notifications", {
        headers: { Authorization: `Bearer ${sessionToken()}` },
      })
      const json = await res.json()
      if (res.status === 401) {
        navigate({ to: "/auth/login", search: { next: "/dashboard/notifications" } })
        return
      }
      if (!json.ok) {
        setError(json.error || "Ubuntu notifications failed")
        return
      }
      setNotes(json.notifications || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ubuntu notifications failed")
    }
  }

  async function markRead(notificationId: string) {
    const res = await fetch("/api/member/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken()}`,
      },
      body: JSON.stringify({ notificationId }),
    })
    const json = await res.json()
    if (!json.ok) {
      setError(json.error || "Mark read failed")
      return
    }
    await load()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Member book</Link>
          <span className="font-display text-lg font-semibold text-gold">Notifications</span>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">In-app notifications</h1>
        <p className="mt-2 text-muted-foreground">Ubuntu book only. Email is not sent until a named mail provider.</p>
        {error && <p className="mt-4 text-red-400">{error}</p>}
        <div className="mt-8 space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-xs uppercase tracking-widest text-gold">{note.event}</div>
              <div className="mt-2 font-display text-xl font-semibold">{note.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{note.body}</p>
              <div className="mt-3 text-xs text-muted-foreground">{note.createdAt}</div>
              {note.readAt ? (
                <div className="mt-2 text-xs text-muted-foreground">Read {note.readAt}</div>
              ) : (
                <button type="button" className="mt-3 text-sm text-gold hover:underline" onClick={() => void markRead(note.id)}>
                  Mark read
                </button>
              )}
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-muted-foreground">No notifications</p>}
        </div>
      </main>
    </div>
  )
}
