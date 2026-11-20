/* Small helpers for turning live records into dashboard figures. */

/* The last `n` days (oldest first), each at local midnight. */
export const lastDays = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (n - 1 - i))
    return d
  })

export const dayLabel = (d) => d.toLocaleDateString('en-NG', { weekday: 'short' })
export const sameDay = (iso, d) => !!iso && new Date(iso).toDateString() === d.toDateString()

/* [{ label: 'Mon', value: count }] for rows whose `key` date falls on each of the last n days. */
export const countByDay = (rows, key, n = 7) =>
  lastDays(n).map((d) => ({ label: dayLabel(d), value: rows.filter((r) => sameDay(r[key], d)).length }))

export const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0)

/* Sums `value(row)` per `label(row)`, biggest first. */
export const sumBy = (rows, label, value = () => 1) => {
  const m = new Map()
  rows.forEach((r) => m.set(label(r), (m.get(label(r)) ?? 0) + value(r)))
  return [...m.entries()].map(([l, v]) => ({ label: l, value: v })).sort((a, b) => b.value - a.value)
}

const MONTH = (d) => `${d.getFullYear()}-${d.getMonth()}`
export const inMonth = (iso, monthsAgo = 0) => {
  if (!iso) return false
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - monthsAgo)
  return MONTH(new Date(iso)) === MONTH(d)
}
export const monthLabel = (monthsAgo) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toLocaleDateString('en-NG', { month: 'short' })
}

export const daysBetween = (a, b) => (new Date(b) - new Date(a)) / 86_400_000
export const minutesBetween = (a, b) => (new Date(b) - new Date(a)) / 60_000
export const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null)

export const fmtDuration = (seconds) => {
  if (seconds == null) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`
}

export const timeAgo = (iso) => {
  if (!iso) return 'never'
  const mins = Math.round((Date.now() - new Date(iso)) / 60_000)
  if (mins < 2) return 'now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}
