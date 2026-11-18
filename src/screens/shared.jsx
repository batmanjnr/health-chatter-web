import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { ROLES } from '../config/roles.js'
import { db, fmtDate, fmtTime, useCollection } from '../lib/store.js'
import { Alert, Avatar, Button, Card, Field, Grid, Icon, KeyValue, PageHeader, SearchInput, Tabs, Toggle, filterRows, useToast } from '../components/ui/index.jsx'

/* ================= Messages (every role) ================= */
export function Messages() {
  const [threads, api] = useCollection('threads')
  const [activeId, setActiveId] = useState(threads[0]?.id)
  const [q, setQ] = useState('')
  const [text, setText] = useState('')
  const active = threads.find((t) => t.id === activeId)

  const send = (e) => {
    e.preventDefault()
    if (!text.trim() || !active) return
    const msg = { from: 'me', text: text.trim(), at: new Date().toISOString() }
    api.update(active.id, { messages: [...active.messages, msg], last: msg.text, at: msg.at })
    setText('')
  }

  return (
    <>
      <PageHeader title="Secure Messages" subtitle="End-to-end encrypted. Not for emergencies — call 112." />
      <div className="chat">
        <aside className="chat__list">
          <SearchInput value={q} onChange={setQ} placeholder="Search conversations" />
          {filterRows(threads, q, ['with', 'last']).map((t) => (
            <button key={t.id} className={`chat__thread ${t.id === activeId ? 'is-active' : ''}`} onClick={() => { setActiveId(t.id); api.update(t.id, { unread: 0 }) }}>
              <Avatar name={t.with} />
              <span>
                <b>{t.with}</b>
                <small>{t.last}</small>
              </span>
              {t.unread > 0 && <em className="dot">{t.unread}</em>}
            </button>
          ))}
        </aside>
        <section className="chat__pane">
          {active ? (
            <>
              <header className="chat__head">
                <Avatar name={active.with} />
                <div>
                  <b>{active.with}</b>
                  <small>{active.role}</small>
                </div>
              </header>
              <div className="chat__msgs">
                {active.messages.map((m, i) => (
                  <div key={i} className={`bubble ${m.from === 'me' ? 'bubble--me' : ''}`}>
                    {m.text}
                    <small>{fmtTime(m.at)}</small>
                  </div>
                ))}
              </div>
              <form className="chat__input" onSubmit={send}>
                <button type="button" className="icon-btn" aria-label="Attach file"><Icon name="Paperclip" /></button>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" aria-label="Message" />
                <Button type="submit" icon="Send">Send</Button>
              </form>
            </>
          ) : (
            <p className="muted">Select a conversation.</p>
          )}
        </section>
      </div>
    </>
  )
}

/* ================= Notifications ================= */
export function Notifications() {
  const [items, api] = useCollection('notifications')
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Delivered in-app, by push and by SMS when you're offline."
        actions={<Button variant="ghost" onClick={() => items.forEach((n) => api.update(n.id, { read: true }))}>Mark all read</Button>}
      />
      <Card pad={false}>
        <ul className="list">
          {items.map((n) => (
            <li key={n.id} className={n.read ? '' : 'is-unread'} onClick={() => api.update(n.id, { read: true })}>
              <span className="list__icon list__icon--teal"><Icon name="Bell" size={16} /></span>
              <div className="list__body">
                <b>{n.title}</b>
                <small>{n.body}</small>
              </div>
              <div className="list__right"><small>{fmtDate(n.at, true)}</small></div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

/* ================= Settings ================= */
export function Settings() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('Profile')
  const [prefs, setPrefs] = useState({ sms: true, push: true, email: true, lowData: false, contrast: false, largeText: false, biometric: true })
  const tp = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }))
  const [form, setForm] = useState({ name: user.name, phone: user.phone ?? '', email: user.email })

  return (
    <>
      <PageHeader title="Settings" subtitle={`${ROLES[user.role].label} account`} />
      <Tabs tabs={['Profile', 'Security', 'Notifications', 'Language & Accessibility']} value={tab} onChange={setTab} />

      {tab === 'Profile' && (
        <Card>
          <form className="form form--2" onSubmit={(e) => { e.preventDefault(); updateUser(form); toast('Profile updated') }}>
            <Field label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {user.healthId && <Field label="Health ID" value={user.healthId} readOnly />}
            {user.license && <Field label="Licence number" value={user.license} readOnly hint="Contact support to change — requires re-verification." />}
            {user.facility && <Field label="Facility" value={user.facility} readOnly />}
            <div className="form__actions"><Button type="submit">Save changes</Button></div>
          </form>
        </Card>
      )}

      {tab === 'Security' && (
        <Grid>
          <Card title="Password">
            <form className="form" onSubmit={(e) => { e.preventDefault(); toast('Password changed') }}>
              <Field label="Current password" type="password" required />
              <Field label="New password" type="password" minLength={8} required />
              <Button type="submit">Update password</Button>
            </form>
          </Card>
          <Card title="Sign-in protection">
            <Toggle label="Two-step verification (MFA)" description={ROLES[user.role].mfa ? 'Required for your role and cannot be turned off.' : 'Recommended — SMS or authenticator app.'} checked={ROLES[user.role].mfa || prefs.biometric} onChange={tp('biometric')} />
            <h3 className="sub">Active sessions</h3>
            <KeyValue items={[['This browser', 'Lagos, NG · now'], ['Android app', 'Lagos, NG · 2h ago']]} />
            <Button variant="ghost" onClick={() => toast('Signed out of other devices')}>Sign out other devices</Button>
          </Card>
        </Grid>
      )}

      {tab === 'Notifications' && (
        <Card>
          <Toggle label="Push notifications" checked={prefs.push} onChange={tp('push')} />
          <Toggle label="SMS" description="Reminders and alerts — no clinical details are ever sent by SMS." checked={prefs.sms} onChange={tp('sms')} />
          <Toggle label="Email" checked={prefs.email} onChange={tp('email')} />
        </Card>
      )}

      {tab === 'Language & Accessibility' && (
        <Card>
          <Field label="Language" as="select" options={['English', 'Nigerian Pidgin', 'Hausa', 'Yorùbá', 'Igbo']} defaultValue="English" />
          <Toggle label="Low-data mode" description="Images and attachments load only when you tap them." checked={prefs.lowData} onChange={tp('lowData')} />
          <Toggle label="High contrast" checked={prefs.contrast} onChange={(v) => { tp('contrast')(v); document.documentElement.classList.toggle('hc', v) }} />
          <Toggle label="Larger text" checked={prefs.largeText} onChange={(v) => { tp('largeText')(v); document.documentElement.classList.toggle('lt', v) }} />
          <Button variant="ghost" icon="RefreshCw" onClick={() => { db.reset(); toast('Demo data reset') }}>Reset demo data</Button>
        </Card>
      )}
    </>
  )
}

/* ================= Help & Support ================= */
const FAQ = [
  ['Is Healthchatter for emergencies?', 'No. For emergencies call 112 or go to the nearest emergency department. Telemedicine and the AI assistant are not substitutes for emergency care.'],
  ['Who can see my health record?', 'Only staff involved in your care, based on their role. Every access is logged, and patients can see who viewed their record under Privacy & Consent.'],
  ['Does it work without internet?', 'Yes. Recent records stay viewable offline and new actions are queued, then synced when you reconnect. Patients can also use USSD *347*24#.'],
  ['How are payments handled?', 'Payments go through licensed providers (Paystack, Flutterwave, Moniepoint). Healthchatter never stores your card details.'],
]
export function Help() {
  const toast = useToast()
  const [, api] = useCollection('complaints')
  const { user } = useAuth()
  const [form, setForm] = useState({ category: 'Technical problem', summary: '' })
  return (
    <>
      <PageHeader title="Help & Support" subtitle="We usually reply within one working day." />
      <Alert tone="danger" title="Medical emergency?">Call 112 (Nigeria emergency line) or go to the nearest hospital now.</Alert>
      <Grid>
        <Card title="Frequently asked">
          {FAQ.map(([q, a]) => (
            <details key={q} className="faq">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </Card>
        <Card title="Contact us or raise a complaint">
          <form className="form" onSubmit={(e) => {
            e.preventDefault()
            api.add({ from: user.name, against: 'Platform', category: form.category, summary: form.summary, severity: 'LOW', status: 'OPEN', at: new Date().toISOString() })
            setForm({ ...form, summary: '' })
            toast('Sent — a moderator will follow up')
          }}>
            <Field label="Topic" as="select" options={['Technical problem', 'Billing', 'Professional conduct', 'Wrong medication', 'Privacy concern', 'Other']} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Field label="Tell us what happened" as="textarea" required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            <Button type="submit" icon="Send">Submit</Button>
          </form>
          <KeyValue items={[['Phone', '0700-HEALTHCHAT'], ['Email', 'support@healthchatter.ng'], ['USSD', '*347*24#']]} />
        </Card>
      </Grid>
    </>
  )
}
