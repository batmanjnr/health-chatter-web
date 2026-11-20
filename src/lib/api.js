/*
 * Calls to the Healthchatter backend (HealthChatter-Backend), signed with the
 * current Supabase session.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'web',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.")
  }
  if (res.status === 204) return null
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, json.error ?? `Request failed (${res.status})`)
  return json
}

/* Loads a backend endpoint once per mount (for dashboard figures). */
export function useApi(path) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let live = true
    api(path).then((d) => live && setData(d), () => live && setData(null))
    return () => {
      live = false
    }
  }, [path])
  return data
}
