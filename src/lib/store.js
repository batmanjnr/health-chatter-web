/*
 * Tiny in-browser data store. Each collection (e.g. "claims") starts from
 * the seed data and every change is saved to localStorage, so actions such
 * as "Approve claim" stick while you click around. Replace these hooks with
 * real API calls when the backend supports each role.
 */
import { useSyncExternalStore } from 'react'
import * as seed from '../data/seed.js'

const KEY = 'hc-web-store-v1'
const listeners = new Set()
const EMPTY = []

function initial() {
  const base = {}
  for (const [k, v] of Object.entries(seed)) {
    if (Array.isArray(v)) base[k] = v
  }
  return base
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial(), ...JSON.parse(raw) }
  } catch {
    /* storage unavailable — fall back to seed */
  }
  return initial()
}

let state = load()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore quota / private mode */
  }
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

const newId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

export const db = {
  get: (name) => state[name] ?? [],
  add(name, row) {
    const item = { id: newId(name.slice(0, 3)), ...row }
    state = { ...state, [name]: [item, ...(state[name] ?? [])] }
    save()
    return item
  },
  update(name, id, patch) {
    state = {
      ...state,
      [name]: (state[name] ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }
    save()
  },
  remove(name, id) {
    state = { ...state, [name]: (state[name] ?? []).filter((r) => r.id !== id) }
    save()
  },
  reset() {
    state = initial()
    save()
  },
}

export function useCollection(name) {
  const rows = useSyncExternalStore(subscribe, () => state[name] ?? EMPTY)
  return [
    rows,
    {
      add: (row) => db.add(name, row),
      update: (id, patch) => db.update(name, id, patch),
      remove: (id) => db.remove(name, id),
    },
  ]
}

export const naira = (n) =>
  typeof n === 'number' ? `₦${n.toLocaleString('en-NG')}` : n

export const fmtDate = (iso, withTime = false) => {
  if (!iso) return '—'
  const x = new Date(iso)
  if (Number.isNaN(x.getTime())) return iso
  return x.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : { year: 'numeric' }),
  })
}

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })

export const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()
