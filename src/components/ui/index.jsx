/* Shared UI kit for the signed-in app. Styles live in src/app.css. */
import { createContext, useCallback, useContext, useState } from 'react'
import { ICONS } from './icons.js'

export function Icon({ name, size = 18, ...rest }) {
  const C = ICONS[name] ?? ICONS.Circle
  return <C size={size} strokeWidth={2} aria-hidden="true" {...rest} />
}

/* ---------- Layout ---------- */
export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="ph">
      <div>
        {back}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="ph__actions">{actions}</div>}
    </div>
  )
}

export function Card({ title, action, children, className = '', pad = true }) {
  return (
    <section className={`card ${pad ? '' : 'card--flush'} ${className}`}>
      {(title || action) && (
        <header className="card__head">
          {title && <h2>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Grid({ cols = 2, children, className = '' }) {
  return <div className={`grid grid--${cols} ${className}`}>{children}</div>
}

/* ---------- Stats ---------- */
export function Stat({ label, value, hint, icon, tone = 'teal' }) {
  return (
    <div className={`stat stat--${tone}`}>
      {icon && (
        <span className="stat__icon">
          <Icon name={icon} size={18} />
        </span>
      )}
      <div>
        <small>{label}</small>
        <b>{value}</b>
        {hint && <em>{hint}</em>}
      </div>
    </div>
  )
}

export function StatGrid({ items }) {
  return (
    <div className="stats">
      {items.map((s) => (
        <Stat key={s.label} {...s} />
      ))}
    </div>
  )
}

/* ---------- Badges ---------- */
const TONES = {
  green: ['ACTIVE', 'APPROVED', 'VERIFIED', 'PAID', 'SUCCESS', 'COMPLETED', 'DISPENSED', 'DELIVERED', 'CONFIRMED', 'CONNECTED', 'SIGNED', 'GRANTED', 'GRANTED_BY_GUARDIAN', 'PUBLISHED', 'DONE', 'SYNCED', 'RELEASED', 'REPORTED', 'JUSTIFIED', 'OK', 'PRODUCTION', 'NORMAL', 'AVAILABLE', 'CHECKED_IN', 'SUBMITTED_OK', 'GREEN', 'FULL', 'READY', 'RESOLVED'],
  amber: ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'QUERIED', 'WAITING', 'NEW', 'DUE', 'AWAITING_DOCTOR', 'AWAITING_REPORT', 'PENDING_REVIEW', 'PENDING_APPROVAL', 'NEEDS_REVIEW', 'DEGRADED', 'IN_REVIEW', 'INVESTIGATING', 'DRAFT', 'QUEUED', 'CLEANING', 'DISCHARGE_DUE', 'YELLOW', 'MEDIUM', 'STAGING', 'INVITED', 'PENDING_VERIFICATION', 'OUT_FOR_DELIVERY', 'UNPAID', 'EXPECTED', 'IN_ASSESSMENT', 'ORANGE', 'APPOINTMENTS_ONLY', 'CONTAINED', 'OPEN', 'FLAGGED_REVIEW', 'SHADOW', 'LAPSED'],
  red: ['REJECTED', 'FAILED', 'CANCELLED', 'SUSPENDED', 'URGENT', 'HIGH', 'RED', 'FLAGGED', 'MISSING', 'DENIED', 'BREAK_GLASS', 'EMERGENCY_ESCALATION', 'AUTO_ESCALATED', 'OUT_OF_STOCK', 'OCCUPIED', 'WITHDRAWN', 'NOT_CONFIGURED', 'CRITICAL'],
  blue: ['SCHEDULED', 'SUBMITTED', 'CLAIM_SUBMITTED', 'ORDERED', 'TELEMEDICINE', 'PLANNED', 'ROUTINE', 'ACCESS', 'CORRECTION', 'DELETION', 'IN_PERSON', 'ADMISSION', 'TRANSFER', 'DISCHARGE', 'MEDICATION_ADVICE', 'COLLECTED', 'VIEW', 'UPDATE', 'RELEASE', 'DISPENSE', 'ROLE_CHANGE'],
}
export function toneOf(status) {
  const s = String(status).toUpperCase()
  for (const [tone, list] of Object.entries(TONES)) if (list.includes(s)) return tone
  return 'gray'
}
/* ENUM_VALUES → "Enum values"; short codes (MFA, NHIA, API) and normal text are left alone. */
export const pretty = (v) => {
  const s = String(v ?? '')
  if (!/^[A-Z0-9_]+$/.test(s) || (s.length <= 4 && !s.includes('_') && !['PAID', 'DONE', 'OPEN', 'HIGH', 'NEW', 'LOW', 'RED', 'VIEW', 'FULL', 'DUE'].includes(s))) return s
  return s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function Badge({ children, tone }) {
  const t = tone ?? toneOf(children)
  return <span className={`badge badge--${t}`}>{typeof children === 'string' ? pretty(children) : children}</span>
}

/* ---------- Buttons & forms ---------- */
export function Button({ variant = 'primary', size, icon, children, className = '', ...rest }) {
  return (
    <button className={`b b--${variant} ${size ? `b--${size}` : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  )
}

export function Field({ label, as = 'input', options, hint, children, className = '', ...rest }) {
  let control
  if (as === 'select') {
    control = (
      <select {...rest}>
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o} value={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>{o.label}</option>
          ),
        )}
      </select>
    )
  } else if (as === 'textarea') {
    control = <textarea rows={4} {...rest} />
  } else {
    control = <input {...rest} />
  }
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children ?? control}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="toggle">
      <div>
        <b>{label}</b>
        {description && <small>{description}</small>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true" />
    </label>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="search">
      <Icon name="Search" size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

/* ---------- Data display ---------- */
export function Table({ columns, rows, onRowClick, empty = 'Nothing here yet.' }) {
  if (!rows.length) return <EmptyState text={empty} />
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key ?? c.label} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={onRowClick ? 'is-click' : ''}>
              {columns.map((c) => (
                <td key={c.key ?? c.label} data-label={c.label}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => {
        const key = typeof t === 'string' ? t : t.value
        const label = typeof t === 'string' ? t : t.label
        return (
          <button key={key} role="tab" aria-selected={value === key} className={value === key ? 'is-active' : ''} onClick={() => onChange(key)}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function KeyValue({ items }) {
  return (
    <dl className="kv">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function List({ items, empty = 'Nothing here yet.' }) {
  if (!items.length) return <EmptyState text={empty} />
  return (
    <ul className="list">
      {items.map((it) => (
        <li key={it.id ?? it.title} onClick={it.onClick} className={it.onClick ? 'is-click' : ''}>
          {it.icon && (
            <span className={`list__icon list__icon--${it.tone ?? 'teal'}`}>
              <Icon name={it.icon} size={16} />
            </span>
          )}
          {it.avatar && <Avatar name={it.avatar} />}
          <div className="list__body">
            <b>{it.title}</b>
            {it.subtitle && <small>{it.subtitle}</small>}
          </div>
          {it.right && <div className="list__right">{it.right}</div>}
        </li>
      ))}
    </ul>
  )
}

export function Timeline({ items }) {
  return (
    <ol className="timeline">
      {items.map((it, i) => (
        <li key={i} className={it.done ? 'is-done' : ''}>
          <b>{it.title}</b>
          {it.subtitle && <small>{it.subtitle}</small>}
        </li>
      ))}
    </ol>
  )
}

export function Avatar({ name = '?', size = 34 }) {
  const initials = name
    .replace(/^(Dr\.|Nurse|Pharm\.|Mrs\.|Mr\.|Barr\.)\s*/i, '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5
  return (
    <span className={`avatar-c avatar-c--${hue}`} style={{ width: size, height: size }}>
      {initials}
    </span>
  )
}

export function Progress({ value, tone = 'teal' }) {
  return (
    <div className={`progress progress--${tone}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Alert({ tone = 'info', title, children, icon }) {
  const ic = icon ?? { info: 'Info', warning: 'TriangleAlert', danger: 'Siren', success: 'CircleCheck' }[tone]
  return (
    <div className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon name={ic} size={18} />
      <div>
        {title && <b>{title}</b>}
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ text, icon = 'Inbox' }) {
  return (
    <div className="empty">
      <Icon name={icon} size={28} />
      <p>{text}</p>
    </div>
  )
}

export function BarChart({ data, height = 160, tone = 'teal' }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className={`bars bars--${tone}`} style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="bars__col" title={`${d.label}: ${d.value}`}>
          <span style={{ height: `${(d.value / max) * 100}%` }} />
          <small>{d.label}</small>
        </div>
      ))}
    </div>
  )
}

export function Sparkline({ points, height = 60, color = 'var(--c-brand)' }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const step = 100 / (points.length - 1)
  const d = points
    .map((p, i) => `${i ? 'L' : 'M'}${i * step},${100 - ((p - min) / (max - min || 1)) * 90 - 5}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/* ---------- Overlays ---------- */
export function Modal({ open, title, onClose, children, footer, wide }) {
  if (!open) return null
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className={`modal__box ${wide ? 'modal__box--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="X" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}

const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const toast = useCallback((text, tone = 'success') => {
    const id = Math.random()
    setItems((x) => [...x, { id, text, tone }])
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <Icon name={t.tone === 'error' ? 'CircleAlert' : 'CircleCheck'} size={16} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

/* Small helper: filter rows by a search string across given keys. */
export function filterRows(rows, q, keys) {
  if (!q) return rows
  const s = q.toLowerCase()
  return rows.filter((r) => keys.some((k) => String(r[k] ?? '').toLowerCase().includes(s)))
}
