import { useEffect, useState } from 'react'
import { api as request } from '../lib/api.js'
import { openFile, uploadFile } from '../lib/files.js'
import { supabase } from '../lib/supabase.js'
import { useApi } from '../lib/api.js'
import { timeAgo } from '../lib/stats.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { ROLES } from '../config/roles.js'
import { db, fmtDate, fmtTime, useCollection } from '../lib/store.js'
import { Alert, Avatar, Button, Card, Field, Grid, Icon, KeyValue, PageHeader, SearchInput, Tabs, Toggle, filterRows, useToast } from '../components/ui/index.jsx'

/* ================= Messages (every role) ================= */
export function Messages() {
  const { user } = useAuth()
  const toast = useToast()
  // Conversations use the same Message table as the mobile app, so a patient
  // messaging their doctor on the website shows up on the doctor's phone too.
  const [convos, setConvos] = useState([])
  const [contacts, setContacts] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [q, setQ] = useState('')
  const [text, setText] = useState('')
  const loadConvos = () => request('/web/conversations').then(setConvos, () => {})
  const loadThread = (id) => request(`/messages/${id}`).then(setMsgs, () => setMsgs([]))
  useEffect(() => {
    loadConvos()
    request('/web/contacts').then(setContacts, () => {})
    const t = setInterval(loadConvos, 15000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (!activeId) return undefined
    loadThread(activeId)
    request(`/messages/${activeId}/read`, { method: 'PATCH' }).then(loadConvos, () => {})
    const t = setInterval(() => loadThread(activeId), 10000)
    return () => clearInterval(t)
  }, [activeId])

  const people = [
    ...convos,
    ...contacts.filter((c) => !convos.some((x) => x.id === c.id)).map((c) => ({ ...c, last: '', unread: 0 })),
  ]
  const active = people.find((p) => p.id === activeId)
  const sub = (p) => [ROLES[p.role]?.label, p.facility].filter(Boolean).join(' · ')

  const sendContent = (content) =>
    request('/messages', { method: 'POST', body: { receiverId: activeId, content } }).then(() => { loadThread(activeId); loadConvos() }, (err) => toast(err.message, 'error'))

  const send = (e) => {
    e.preventDefault()
    if (!text.trim() || !active) return
    sendContent(text.trim())
    setText('')
  }
  const attach = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !active) return
    uploadFile(file).then((f) => sendContent(`📎 ${f.name} [file:${f.id}]`), (err) => toast(err.message, 'error'))
  }
  const FILE = /\[file:([0-9a-f-]{36})\]/

  return (
    <>
      <PageHeader title="Secure Messages" subtitle="Not for emergencies — call 112." />
      <div className="chat">
        <aside className="chat__list">
          <SearchInput value={q} onChange={setQ} placeholder="Search people and conversations" />
          {filterRows(people, q, ['name', 'last', 'facility']).map((t) => (
            <button key={t.id} className={`chat__thread ${t.id === activeId ? 'is-active' : ''}`} onClick={() => setActiveId(t.id)}>
              <Avatar name={t.name} />
              <span>
                <b>{t.name}</b>
                <small>{t.last ? t.last.replace(FILE, '') : sub(t)}</small>
              </span>
              {t.unread > 0 && <em className="dot">{t.unread}</em>}
            </button>
          ))}
          {!people.length && <p className="muted">No one to message yet.</p>}
        </aside>
        <section className="chat__pane">
          {active ? (
            <>
              <header className="chat__head">
                <Avatar name={active.name} />
                <div>
                  <b>{active.name}</b>
                  <small>{sub(active)}</small>
                </div>
              </header>
              <div className="chat__msgs">
                {msgs.map((m) => {
                  const file = m.content.match(FILE)
                  return (
                    <div key={m.id} className={`bubble ${m.senderId === user.id ? 'bubble--me' : ''}`}>
                      {file ? <button type="button" className="link" onClick={() => openFile(file[1]).catch((err) => toast(err.message, 'error'))}>{m.content.replace(FILE, '').trim()}</button> : m.content}
                      <small>{fmtTime(m.sentAt)}</small>
                    </div>
                  )
                })}
                {!msgs.length && <p className="muted">No messages yet — say hello.</p>}
              </div>
              <form className="chat__input" onSubmit={send}>
                <label className="icon-btn" aria-label="Attach file"><Icon name="Paperclip" /><input type="file" accept=".pdf,image/*" hidden onChange={attach} /></label>
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
  // Preferences are saved to the account (userPrefs), so they follow you
  // to any browser.
  const [prefRows, prefApi] = useCollection('userPrefs')
  const saved = prefRows[0]
  const prefs = { sms: true, push: true, email: true, lowData: false, contrast: false, largeText: false, biometric: true, language: 'English', ...saved }
  const tp = (k) => (v) => {
    if (saved) prefApi.update(saved.id, { [k]: v })
    else prefApi.add({ ...prefs, [k]: v })
  }
  useEffect(() => {
    document.documentElement.classList.toggle('hc', !!prefs.contrast)
    document.documentElement.classList.toggle('lt', !!prefs.largeText)
  }, [prefs.contrast, prefs.largeText])
  const [form, setForm] = useState({ name: user.name, phone: user.phone ?? '', email: user.email })
  const sessions = useApi('/web/me/sessions') ?? {}
  const changePassword = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: data.get('current') })
    if (check.error) return toast('Your current password is incorrect', 'error')
    const { error } = await supabase.auth.updateUser({ password: data.get('password') })
    if (error) return toast(error.message, 'error')
    form.reset()
    toast('Password changed')
  }

  return (
    <>
      <PageHeader title="Settings" subtitle={`${ROLES[user.role].label} account`} />
      <Tabs tabs={['Profile', 'Security', 'Notifications', 'Language & Accessibility']} value={tab} onChange={setTab} />

      {tab === 'Profile' && (
        <Card>
          <form className="form form--2" onSubmit={(e) => { e.preventDefault(); updateUser({ name: form.name, phone: form.phone }).then(() => toast('Profile updated'), (err) => toast(err.message, 'error')) }}>
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
            <form className="form" onSubmit={changePassword}>
              <Field label="Current password" name="current" type="password" required />
              <Field label="New password" name="password" type="password" minLength={8} required />
              <Button type="submit">Update password</Button>
            </form>
          </Card>
          <Card title="Sign-in protection">
            <Toggle label="Two-step verification (MFA)" description={ROLES[user.role].mfa ? 'Required for your role and cannot be turned off.' : 'Recommended — SMS or authenticator app.'} checked={ROLES[user.role].mfa || prefs.biometric} onChange={tp('biometric')} />
            <h3 className="sub">Active sessions</h3>
            <KeyValue items={[['This browser', 'now'], ['Mobile app', timeAgo(sessions.APP)]]} />
            <Button variant="ghost" onClick={() => supabase.auth.signOut({ scope: 'others' }).then(({ error }) => toast(error ? error.message : 'Signed out of other devices', error ? 'error' : 'success'))}>Sign out other devices</Button>
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
          <Field label="Language" as="select" options={['English', 'Nigerian Pidgin', 'Hausa', 'Yorùbá', 'Igbo']} value={prefs.language} onChange={(e) => tp('language')(e.target.value)} />
          <Toggle label="Low-data mode" description="Images and attachments load only when you tap them." checked={prefs.lowData} onChange={tp('lowData')} />
          <Toggle label="High contrast" checked={prefs.contrast} onChange={tp('contrast')} />
          <Toggle label="Larger text" checked={prefs.largeText} onChange={tp('largeText')} />
          <Button variant="ghost" icon="RefreshCw" onClick={() => { db.refresh().then(() => toast('Data refreshed')) }}>Refresh data</Button>
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
