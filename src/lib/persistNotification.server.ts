import type { SupabaseClient } from "@supabase/supabase-js"
import { buildNotification } from "./notificationEngine.mjs"

function tableMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = String(error.message || "").toLowerCase()
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  )
}

export async function persistNotification(ubuntu: SupabaseClient, input: Record<string, unknown>) {
  const note = buildNotification(input)
  const { data, error } = await ubuntu
    .from("ua_notifications")
    .insert({
      user_id: Number(note.userId),
      channel: note.channel,
      event: note.event,
      title: note.title,
      body: note.body,
      payload: note.payload,
    })
    .select("id, user_id, channel, event, title, body, payload, read_at, created_at")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function persistNotificationQuiet(ubuntu: SupabaseClient, input: Record<string, unknown>) {
  try {
    return await persistNotification(ubuntu, input)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (tableMissing({ message })) return null
    return null
  }
}

export async function loadMemberNotifications(ubuntu: SupabaseClient, userId: string | number) {
  const id = Number(userId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("userId must be an existing Ubuntu ua_users.id")
  }
  const { data, error } = await ubuntu
    .from("ua_notifications")
    .select("id, user_id, channel, event, title, body, payload, read_at, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data || []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    channel: String(row.channel),
    event: String(row.event),
    title: String(row.title),
    body: String(row.body),
    payload: row.payload,
    readAt: row.read_at == null ? null : String(row.read_at),
    createdAt: row.created_at == null ? "" : String(row.created_at),
  }))
}

export async function markNotificationRead(ubuntu: SupabaseClient, userId: string | number, notificationId: string) {
  const id = Number(userId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("userId must be an existing Ubuntu ua_users.id")
  }
  const { data, error } = await ubuntu
    .from("ua_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", id)
    .select("id, read_at")
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Ubuntu notification not found")
  return { id: String(data.id), readAt: String(data.read_at) }
}
