/*
 * Live data store backed by the Healthchatter backend (/web/collections/*).
 *
 * Screens keep the same simple interface as before —
 *   const [rows, api] = useCollection('claims'); api.update(id, { status })
 * — but rows now come from the shared database, and every add/update/remove
 * is saved there. Changes show instantly (optimistic) and are rolled back if
 * the server refuses them (e.g. the role isn't allowed to make that change).
 *
 * The server decides what each role may see: patients only get rows about
 * themselves, staff only get the collections their role allows.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { api as request } from './api.js'

const EMPTY = []
// Collections that are plain lists of strings on screen.
const SCALAR = new Set(['specialties', 'consentTypes'])
const REFRESH_AFTER_MS = 30_000

let state = {} // name -> rows
const loadedAt = {} // name -> timestamp of last successful load
const inflight = {} // name -> promise
const listeners = new Set()
const errorListeners = new Set()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function setRows(name, rows) {
  state = { ...state, [name]: rows }
  emit()
}

function reportError(err) {
  console.error(err)
  errorListeners.forEach((l) => l(err))
}

/* Subscribe to failed saves/loads (used by the app shell to show a toast). */
export function onStoreError(l) {
  errorListeners.add(l)
  return () => errorListeners.delete(l)
}

const fromServer = (name, row) => (SCALAR.has(name) ? row.value : row)
const toServer = (name, row) => (SCALAR.has(name) && typeof row !== 'object' ? { value: row } : row)

function load(name, { force = false } = {}) {
  if (inflight[name]) return inflight[name]
  if (!force && loadedAt[name] && Date.now() - loadedAt[name] < REFRESH_AFTER_MS) return Promise.resolve()
  inflight[name] = request(`/web/collections/${name}`)
    .then((rows) => {
      loadedAt[name] = Date.now()
      setRows(name, rows.map((r) => fromServer(name, r)))
    })
    .catch((err) => {
      // 403 = this role can't see the collection; show it as empty.
      loadedAt[name] = Date.now()
      if (err.status !== 403) reportError(err)
      if (!state[name]) setRows(name, EMPTY)
    })
    .finally(() => {
      delete inflight[name]
    })
  return inflight[name]
}

// Pick up other people's changes when the tab comes back into focus.
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    Object.keys(loadedAt).forEach((name) => load(name))
  })
}

const newId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

export const db = {
  get: (name) => state[name] ?? EMPTY,

  /* Loads a collection (if needed) and resolves with its rows. */
  async fetch(name) {
    await load(name)
    return db.get(name)
  },

  add(name, row) {
    const item = SCALAR.has(name) ? row : { id: newId(name.slice(0, 3)), ...row }
    const before = db.get(name)
    setRows(name, [item, ...before])
    request(`/web/collections/${name}`, { method: 'POST', body: toServer(name, item) })
      .then((saved) => {
        // The server may assign its own id (e.g. new user accounts).
        const real = fromServer(name, saved)
        setRows(name, db.get(name).map((r) => (r === item ? real : r)))
      })
      .catch((err) => {
        setRows(name, db.get(name).filter((r) => r !== item))
        reportError(err)
      })
    return item
  },

  update(name, id, patch) {
    const prev = db.get(name).find((r) => r.id === id)
    setRows(name, db.get(name).map((r) => (r.id === id ? { ...r, ...patch } : r)))
    request(`/web/collections/${name}/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }).catch((err) => {
      if (prev) setRows(name, db.get(name).map((r) => (r.id === id ? prev : r)))
      reportError(err)
    })
  },

  remove(name, id) {
    const before = db.get(name)
    setRows(name, before.filter((r) => r.id !== id))
    request(`/web/collections/${name}/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((err) => {
      setRows(name, before)
      reportError(err)
    })
  },

  /* Re-download every collection on screen. */
  refresh() {
    return Promise.all(Object.keys(loadedAt).map((name) => load(name, { force: true })))
  },

  /* Forget everything (on sign-out, so the next user starts clean). */
  reset() {
    state = {}
    Object.keys(loadedAt).forEach((k) => delete loadedAt[k])
    emit()
  },
}

export function useCollection(name) {
  const rows = useSyncExternalStore(subscribe, () => state[name] ?? EMPTY)
  useEffect(() => {
    load(name)
  }, [name])
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
