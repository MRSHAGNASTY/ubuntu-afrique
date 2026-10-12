import { ubuntu, getUbuntuEnv } from './ubuntuDb'
import { createAureusReadOnlyClient, getAureusReadEnv } from './aureusReadOnly'

function requireUbuntu() {
  const env = getUbuntuEnv()
  if (!env.configured) {
    throw new Error(
      'Missing Ubuntu Afrique database env. Set VITE_UBUNTU_SUPABASE_URL and VITE_UBUNTU_SUPABASE_ANON_KEY. Do not point these at Aureus production.'
    )
  }
}

export const ubuntuDb = ubuntu
export const supabase = ubuntu

const aureusEnv = getAureusReadEnv()
export const aureusRead = aureusEnv.configured
  ? createAureusReadOnlyClient(aureusEnv.url, aureusEnv.key)
  : null

export const PLATFORM_NAME = 'Ubuntu Afrique'

export interface User {
  id: number
  auth_user_id: string
  email: string
  username: string
  created_at: string
}

export interface Investment {
  id: string
  user_id: string
  amount: number
  shares: number
  payment_method: string
  payment_proof: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Commission {
  id: string
  user_id: string
  amount: number
  shares_bonus: number
  type: string
  status: 'pending' | 'paid' | 'rejected'
  created_at: string
}

export const auth = {
  async signIn(email: string, password: string) {
    const aureusRes = await fetch("/api/ua-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const aureusJson = await aureusRes.json().catch(() => null)
    if (aureusJson?.ok && aureusJson.token) {
      localStorage.setItem("ua_session", aureusJson.token)
      return {
        session: { access_token: aureusJson.token },
        user: aureusJson.user,
        identitySource: "aureus" as const,
      }
    }
    if (aureusJson?.challengeRequired) {
      throw new Error(aureusJson.message || "Additional Aureus verification is required")
    }

    requireUbuntu()
    const { data, error } = await ubuntu.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error(aureusJson?.error || error.message || "Invalid credentials")
    }
    return { ...data, identitySource: "ubuntu" as const }
  },

  async signUp(email: string, password: string, username: string, sponsorCode?: string) {
    requireUbuntu()
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username, sponsorCode: sponsorCode || "" }),
    })
    const json = await res.json().catch(() => null)
    if (!json?.ok) throw new Error(json?.error || "Ubuntu civilian register failed")
    const { data, error } = await ubuntu.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message || "Sign in after register failed")
    return { ...data, identitySource: "ubuntu" as const, pendingAureusProvision: false, userId: json.userId }
  }

  async signOut() {
    localStorage.removeItem("ua_session")
    localStorage.removeItem("auth_token")
    if (aureusRead) {
      await aureusRead.auth.signOut()
    }
    const { error } = await ubuntu.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser(): Promise<{
    user: { id?: string; email?: string } | null
    identitySource: "aureus" | "ubuntu"
    profile?: any
    ledger?: any
  }> {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("ua_session") : null
    if (token) {
      const res = await fetch("/api/ua-me", { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const json = await res.json()
        if (json.ok && json.profile) {
          return {
            user: {
              id: String(json.profile.id || json.profile.auth_user_id || ""),
              email: json.profile.email,
            },
            identitySource: "aureus" as const,
            profile: json.profile,
            ledger: json.ledger || { shares: 0, invested: 0, commissions: 0, pending: 0 },
          }
        }
      }
      if (res.status === 401) {
        localStorage.removeItem("ua_session")
      } else {
        throw new Error("Ubuntu session check failed. Refresh the page and sign in again.")
      }
    }
    const { data } = await ubuntu.auth.getUser()
    return { user: data.user, identitySource: "ubuntu" as const }
  },
}

export async function readAureusShareholderByEmail(email: string) {
  if (!aureusRead) return null
  const { data, error } = await aureusRead
    .from('users')
    .select('id, username, email, is_active, created_at')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()
  if (error) throw error
  return data
}
