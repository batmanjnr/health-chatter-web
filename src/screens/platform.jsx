/* Moderator, Compliance Officer (DPO) and Super Admin screens. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { PERMISSIONS, ROLES, ROLE_KEYS } from '../config/roles.js'
import { db, fmtDate, useCollection } from '../lib/store.js'
import { useApi } from '../lib/api.js'
import { docId, docName, openFile } from '../lib/files.js'
import { downloadCsv } from '../lib/exportCsv.js'
import { avg, countByDay, daysBetween, fmtDuration, inMonth, lastDays, minutesBetween, monthLabel, pct, sameDay, sumBy, timeAgo } from '../lib/stats.js'
import {
  Alert, Badge, BarChart, Button, Card, Field, Grid, Icon, KeyValue, List, Modal, PageHeader,
  SearchInput, Sparkline, StatGrid, Table, Tabs, Toggle, filterRows, useToast, DeleteButton,
} from '../components/ui/index.jsx'

const audit = (user, action, resource) =>
  db.add('auditLog', { at: new Date().toISOString(), actor: user.name, role: user.role, action, resource, facility: 'Platform' })

/* ===================================================================== */
/*                                MODERATOR                              */
/* ===================================================================== */
export function ModeratorDashboard() {
  const { user } = useAuth()
  const [v] = useCollection('verifications')
  const [accounts] = useCollection('accounts')
  const [c] = useCollection('complaints')
  const [sus] = useCollection('suspended')
  const [rv] = useCollection('reviews')
  return (
    <>
      <PageHeader title="Trust & Safety" subtitle={`${user.facility ?? 'Your hospital'} — only verified professionals and fair content.`} />
      <StatGrid items={[
        { label: 'Providers to verify', value: v.filter((x) => x.status === 'PENDING').length, icon: 'BadgeCheck', tone: 'teal' },
        { label: 'Staff accounts', value: accounts.filter((x) => x.id !== user.id).length, icon: 'Users', tone: 'blue' },
        { label: 'Open complaints', value: c.filter((x) => x.status !== 'RESOLVED').length, icon: 'Flag', tone: 'pink' },
        { label: 'Suspended', value: sus.length, icon: 'UserX', tone: 'yellow' },
      ]} />
      <Grid>
        <Card title="Verification queue" action={<Link to="/moderator/verification">Open</Link>}>
          <List items={v.filter((x) => x.status === 'PENDING').map((x) => ({ id: x.id, avatar: x.name, title: x.name, subtitle: `${ROLES[x.role]?.label} · ${x.regulator} ${x.license}`, right: x.registryMatch ? <Badge tone="green">Registry match</Badge> : <Badge tone="red">No match</Badge> }))} empty="All caught up." />
        </Card>
        <Card title="Flagged content" action={<Link to="/moderator/content">Open</Link>}>
          <List items={rv.filter((x) => x.status !== 'PUBLISHED').map((x) => ({ id: x.id, icon: 'Star', tone: 'amber', title: x.target, subtitle: x.flag ?? x.text, right: <Badge>{x.status}</Badge> }))} empty="Nothing flagged." />
        </Card>
      </Grid>
    </>
  )
}

export function ProviderVerification() {
  const toast = useToast()
  const { user } = useAuth()
  const [rows, api] = useCollection('verifications')
  const [accounts, acc] = useCollection('accounts')
  const [sel, setSel] = useState(null)
  const [note, setNote] = useState('')
  const [tab, setTab] = useState('PENDING')
  const decide = (status) => {
    api.update(sel.id, { status, note })
    const a = accounts.find((x) => x.id === sel.userId)
    if (a) acc.update(a.id, { status: status === 'APPROVED' ? 'ACTIVE' : 'PENDING_VERIFICATION' })
    audit(user, status === 'APPROVED' ? 'VERIFY' : 'REJECT', `${sel.regulator} ${sel.license} — ${sel.name}`)
    toast(status === 'APPROVED' ? `${sel.name} verified — workspace unlocked` : `${sel.name} rejected — applicant notified`, status === 'APPROVED' ? 'success' : 'error')
    setSel(null); setNote('')
  }
  return (
    <>
      <PageHeader title="Provider Verification" subtitle="Check every licence against the regulator's register before activation (MDCN, NMCN, PCN, MLSCN, RRBN, CHPRBN)." />
      <Tabs tabs={[{ value: 'PENDING', label: 'Pending' }, { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' }]} value={tab} onChange={setTab} />
      <Card pad={false}>
        <Table rows={rows.filter((r) => r.status === tab)} onRowClick={setSel} empty="Nothing here." columns={[
          { label: 'Applicant', render: (r) => <b>{r.name}</b> }, { label: 'Role', render: (r) => ROLES[r.role]?.label }, { label: 'Regulator', key: 'regulator' },
          { label: 'Licence', key: 'license' }, { label: 'Registry', render: (r) => r.registryMatch ? <Badge tone="green">Match</Badge> : <Badge tone="red">No match</Badge> },
          { label: 'Submitted', render: (r) => fmtDate(r.submitted) },
        ]} />
      </Card>
      <Modal open={!!sel} title={sel?.name} onClose={() => setSel(null)} wide footer={sel?.status === 'PENDING' && (
        <div className="row-actions">
          <Button variant="ghost" disabled={!note} onClick={() => { api.update(sel.id, { status: 'INFO_REQUESTED', note }); audit(user, 'UPDATE', `More info requested — ${sel.name}`); setSel(null); setNote(''); toast('More information requested — applicant notified') }}>Request more info</Button>
          <Button variant="danger" disabled={!note} onClick={() => decide('REJECTED')}>Reject</Button>
          <Button onClick={() => decide('APPROVED')}>Approve</Button>
        </div>
      )}>
        <Grid>
          <KeyValue items={[['Role', ROLES[sel?.role]?.label], ['Regulator', sel?.regulator], ['Licence no.', sel?.license], ['Specialty', sel?.specialty], ['Submitted', fmtDate(sel?.submitted, true)]]} />
          <div>
            <h3 className="sub">Documents</h3>
            <List empty="No documents uploaded." items={(sel?.docs ?? []).map((d) => ({ id: docId(d) ?? docName(d), icon: 'FileText', title: docName(d), right: docId(d) ? <Button size="sm" variant="ghost" onClick={() => openFile(docId(d)).catch((err) => toast(err.message, 'error'))}>View</Button> : <small className="muted">Name only</small> }))} />
          </div>
        </Grid>
        {sel && (sel.registryMatch
          ? <Alert tone="success" title={`${sel.regulator} register: active licence found`}>Name and number match. Annual practising licence valid for 2026.</Alert>
          : <Alert tone="danger" title={`${sel.regulator} register: no current licence`}>Licence appears expired or the number doesn't match the name.</Alert>)}
        <Field label="Decision note (required to reject)" as="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>
    </>
  )
}

export function FacilityVerification() {
  const toast = useToast()
  const { user } = useAuth()
  const [rows, api] = useCollection('facilities')
  return (
    <>
      <PageHeader title="Facility Verification" subtitle="Hospitals, clinics, labs and pharmacies must show state/federal registration and a responsible officer." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Facility', render: (r) => <b>{r.name}</b> }, { label: 'Type', key: 'type' }, { label: 'State', key: 'state' }, { label: 'Registration', key: 'regNo' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'PENDING' && (
            <div className="row-actions">
              <Button size="sm" onClick={() => { api.update(r.id, { status: 'VERIFIED' }); audit(user, 'VERIFY', `Facility ${r.name}`); toast(`${r.name} verified`) }}>Verify</Button>
              <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { status: 'REJECTED' }); toast('Rejected', 'error') }}>Reject</Button>
            </div>
          ) },
        ]} />
      </Card>
    </>
  )
}

export function Complaints() {
  const toast = useToast()
  const [rows, api] = useCollection('complaints')
  const [, sus] = useCollection('suspended')
  const [sel, setSel] = useState(null)
  return (
    <>
      <PageHeader title="Complaints & Reports" subtitle="Patient complaints about providers, pharmacies and the platform. Serious clinical issues go to the Clinical Governance Committee." />
      <Card pad={false}>
        <Table rows={rows} onRowClick={setSel} columns={[
          { label: 'Severity', render: (r) => <Badge>{r.severity}</Badge>, width: 90 }, { label: 'From', key: 'from' }, { label: 'About', key: 'against' }, { label: 'Category', key: 'category' },
          { label: 'Summary', key: 'summary' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
      <Modal open={!!sel} title={`${sel?.category} — ${sel?.against}`} onClose={() => setSel(null)} footer={sel && sel.status !== 'RESOLVED' && (
        <div className="row-actions">
          <Button variant="ghost" onClick={() => { api.update(sel.id, { status: 'INVESTIGATING' }); setSel(null); toast('Investigation opened') }}>Investigate</Button>
          <Button variant="ghost" onClick={() => { api.update(sel.id, { status: 'ESCALATED' }); setSel(null); toast('Escalated to Clinical Governance Committee') }}>Escalate</Button>
          {sel.against !== 'Platform' && <Button variant="danger" onClick={() => { sus.add({ name: sel.against, role: 'PROVIDER', reason: sel.category, since: new Date().toISOString(), until: 'Under review' }); api.update(sel.id, { status: 'RESOLVED' }); setSel(null); toast('Account suspended', 'error') }}>Suspend</Button>}
          <Button onClick={() => { api.update(sel.id, { status: 'RESOLVED', resolvedAt: new Date().toISOString() }); setSel(null); toast('Resolved') }}>Resolve</Button>
        </div>
      )}>
        <KeyValue items={[['From', sel?.from], ['About', sel?.against], ['Received', fmtDate(sel?.at, true)], ['Severity', <Badge key="s">{sel?.severity}</Badge>]]} />
        <p>{sel?.summary}</p>
        <Field label="Internal note" as="textarea" />
      </Modal>
    </>
  )
}

export function ContentModeration() {
  const toast = useToast()
  const [rows, api] = useCollection('reviews')
  return (
    <>
      <PageHeader title="Reviews & Health Content" subtitle="Remove personal data, solicitation and misinformation. Health articles need clinical sign-off." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Author', key: 'author' }, { label: 'About', key: 'target' }, { label: 'Rating', render: (r) => r.rating ? '★'.repeat(r.rating) : '—' },
          { label: 'Text', render: (r) => <span>{r.text}{r.flag && <small className="block text-danger">{r.flag}</small>}</span> }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status !== 'PUBLISHED' && r.status !== 'REMOVED' && (
            <div className="row-actions"><Button size="sm" onClick={() => { api.update(r.id, { status: 'PUBLISHED' }); toast('Published') }}>Publish</Button><Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { status: 'REMOVED' }); toast('Removed', 'error') }}>Remove</Button></div>
          ) },
        ]} />
      </Card>
    </>
  )
}

export function AiReview() {
  const toast = useToast()
  const [rows, api] = useCollection('aiFlags')
  const [sel, setSel] = useState(null)
  return (
    <>
      <PageHeader title="AI Safety Review" subtitle="Review flagged assistant conversations: emergency escalation, medication advice, possible hallucinations." />
      <Card pad={false}>
        <Table rows={rows} onRowClick={setSel} columns={[
          { label: 'When', render: (r) => fmtDate(r.at, true) }, { label: 'User', key: 'user' }, { label: 'Prompt', render: (r) => <span className="clip">{r.prompt}</span> },
          { label: 'Flag', render: (r) => <Badge>{r.flag}</Badge> }, { label: 'Model', key: 'model' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
      <Modal open={!!sel} title="Conversation review" onClose={() => setSel(null)} wide footer={sel?.status === 'NEEDS_REVIEW' && (
        <div className="row-actions">
          <Button variant="ghost" onClick={() => { api.update(sel.id, { status: 'ESCALATED' }); setSel(null); toast('Sent to clinical reviewer') }}>Escalate to clinician</Button>
          <Button variant="danger" onClick={() => { api.update(sel.id, { status: 'FLAGGED' }); setSel(null); toast('Marked unsafe — added to guardrail test set', 'error') }}>Unsafe response</Button>
          <Button onClick={() => { api.update(sel.id, { status: 'OK' }); setSel(null); toast('Marked safe') }}>Safe</Button>
        </div>
      )}>
        <div className="chat__msgs">
          <div className="bubble bubble--me">{sel?.prompt}</div>
          <div className={`bubble ${sel?.flag === 'EMERGENCY_ESCALATION' ? 'bubble--danger' : ''}`}>{sel?.response}</div>
        </div>
        <KeyValue items={[['Model / version', sel?.model], ['Flag', sel?.flag], ['User consented to AI', 'Yes']]} />
      </Modal>
    </>
  )
}

export function Suspended() {
  const toast = useToast()
  const [rows, api] = useCollection('suspended')
  return (
    <>
      <PageHeader title="Suspended Accounts" />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Account', render: (r) => <b>{r.name}</b> }, { label: 'Role', render: (r) => ROLES[r.role]?.label ?? r.role }, { label: 'Reason', key: 'reason' },
          { label: 'Since', render: (r) => fmtDate(r.since) }, { label: 'Until', key: 'until' },
          { label: '', render: (r) => <Button size="sm" variant="ghost" onClick={() => { api.remove(r.id); toast('Account reinstated') }}>Reinstate</Button> },
        ]} />
      </Card>
    </>
  )
}

/* ===================================================================== */
/*                       COMPLIANCE OFFICER (DPO)                        */
/* ===================================================================== */
export function ComplianceDashboard() {
  const [bg] = useCollection('breakGlass')
  const [dsr] = useCollection('dataRequests')
  const [inc] = useCollection('incidents')
  const [pr] = useCollection('processors')
  const [log] = useCollection('auditLog')
  const [checklist] = useCollection('complianceChecklist')
  const week = lastDays(7)
  const inWeek = (iso) => iso && new Date(iso) >= week[0]
  const access = week.map((d) => log.filter((l) => sameDay(l.at, d)).length)
  const denied = log.filter((l) => l.action === 'DENIED' && inWeek(l.at)).length
  const glassCount = log.filter((l) => l.action === 'BREAK_GLASS' && inWeek(l.at)).length
  return (
    <>
      <PageHeader title="Data Protection" subtitle="Nigeria Data Protection Act 2023 — controller of major importance (NDPC registration)." />
      <StatGrid items={[
        { label: 'Break-glass to review', value: bg.filter((b) => b.status === 'PENDING_REVIEW').length, icon: 'Siren', tone: 'pink' },
        { label: 'Open data requests', value: dsr.filter((d) => d.status !== 'COMPLETED').length, icon: 'Inbox', tone: 'blue' },
        { label: 'Active incidents', value: inc.filter((i) => i.status !== 'CLOSED').length, icon: 'TriangleAlert', tone: 'yellow' },
        { label: 'Vendors without DPA', value: pr.filter((p) => p.dpa !== 'SIGNED').length, icon: 'Scale', tone: 'teal' },
      ]} />
      <Grid>
        <Card title="Compliance checklist">
          {[...checklist].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((c) => [c.item, c.done]).map(([l, ok]) => (
            <div key={l} className="check-row"><span className={ok ? 'text-ok' : 'text-warn'}><Icon name={ok ? 'CircleCheck' : 'CircleAlert'} size={16} /></span> {l}</div>
          ))}
        </Card>
        <Card title="Record access (last 7 days)"><Sparkline points={access} height={90} /><p className="muted">{denied} denied attempts · {glassCount} break-glass</p></Card>
      </Grid>
    </>
  )
}

export function AuditTrail() {
  const [rows] = useCollection('auditLog')
  const [q, setQ] = useState('')
  const [action, setAction] = useState('All')
  return (
    <>
      <PageHeader title="Audit Trail" subtitle="Immutable log: who accessed a record → when → what they accessed → what they changed." actions={<Button variant="ghost" icon="Download" onClick={() => downloadCsv('audit-trail', rows, ['at', 'actor', 'role', 'action', 'resource', 'ip', 'facility'])}>Export</Button>} />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Staff, patient or resource" />
        <Field label="Action" as="select" options={['All', 'VIEW', 'UPDATE', 'RELEASE', 'DISPENSE', 'BREAK_GLASS', 'DENIED', 'ROLE_CHANGE', 'VERIFY']} value={action} onChange={(e) => setAction(e.target.value)} />
      </div>
      <Card pad={false}>
        <Table rows={filterRows(rows, q, ['actor', 'resource', 'facility']).filter((r) => action === 'All' || r.action === action)} columns={[
          { label: 'When', render: (r) => fmtDate(r.at, true) }, { label: 'Actor', render: (r) => <span><b>{r.actor}</b><small className="block muted">{ROLES[r.role]?.label}</small></span> },
          { label: 'Action', render: (r) => <Badge>{r.action}</Badge> }, { label: 'Resource', key: 'resource' }, { label: 'Facility', key: 'facility' }, { label: 'IP', key: 'ip' },
        ]} />
      </Card>
    </>
  )
}

export function BreakGlassReviews() {
  const toast = useToast()
  const [rows, api] = useCollection('breakGlass')
  return (
    <>
      <PageHeader title="Break-Glass Reviews" subtitle="Every emergency override must be reviewed within 72 hours." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'When', render: (r) => fmtDate(r.at, true) }, { label: 'Staff', key: 'actor' }, { label: 'Patient', key: 'patient' }, { label: 'Reason given', key: 'reason' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'PENDING_REVIEW' && <div className="row-actions"><Button size="sm" onClick={() => { api.update(r.id, { status: 'JUSTIFIED' }); toast('Marked justified') }}>Justified</Button><Button size="sm" variant="danger" onClick={() => { api.update(r.id, { status: 'DENIED' }); toast('Flagged for review', 'error') }}>Not justified</Button></div> },
        ]} />
      </Card>
    </>
  )
}

export function ConsentRegistry() {
  const [rows] = useCollection('consents')
  const [types] = useCollection('consentTypes')
  const [q, setQ] = useState('')
  return (
    <>
      <PageHeader title="Consent Registry" subtitle="Layered consent: account → privacy → telemedicine → record sharing → lab results → insurance → AI → marketing." />
      <div className="cards cards--4">
        {types.slice(2).map((t) => {
          const all = rows.filter((r) => r.type === t)
          const granted = all.filter((r) => r.status.startsWith('GRANTED')).length
          return <Card key={t} title={t}><p className="big">{all.length ? Math.round((granted / all.length) * 100) : 100}%</p><small className="muted">opted in</small></Card>
        })}
      </div>
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search patient" /></div>
      <Card pad={false}>
        <Table rows={filterRows(rows, q, ['patient', 'type'])} columns={[{ label: 'Patient', key: 'patient' }, { label: 'Consent', key: 'type' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }, { label: 'Updated', render: (r) => fmtDate(r.at) }]} />
      </Card>
    </>
  )
}

export function DataRequests() {
  const toast = useToast()
  const [rows, api] = useCollection('dataRequests')
  return (
    <>
      <PageHeader title="Data Subject Requests" subtitle="Access, correction and deletion requests must be answered within 30 days." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Subject', key: 'subject' }, { label: 'Type', render: (r) => <Badge>{r.type}</Badge> }, { label: 'Detail', key: 'detail' }, { label: 'Due', render: (r) => fmtDate(r.due) },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status !== 'COMPLETED' && <div className="row-actions">
            {r.status === 'NEW' && <Button size="sm" variant="ghost" onClick={() => api.update(r.id, { status: 'IN_PROGRESS' })}>Start</Button>}
            <Button size="sm" onClick={() => { api.update(r.id, { status: 'COMPLETED' }); toast(r.type === 'ACCESS' ? 'Secure export link sent to patient' : 'Completed & patient notified') }}>Complete</Button>
          </div> },
        ]} />
      </Card>
      <Alert tone="info">Deletion keeps clinical records for the legally required retention period; identity and marketing data are erased.</Alert>
    </>
  )
}

export function Incidents() {
  const toast = useToast()
  const [rows, api] = useCollection('incidents')
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: '', severity: 'MEDIUM', records: 0, note: '' })
  return (
    <>
      <PageHeader title="Breach Incidents" subtitle="Detect → contain → investigate → notify (NDPC within 72 hours if personal data is at risk) → recover." actions={<Button variant="danger" icon="Siren" onClick={() => setOpen(true)}>Report incident</Button>} />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Incident', render: (r) => <span><b>{r.title}</b><small className="block muted">{r.note}</small></span> }, { label: 'Severity', render: (r) => <Badge>{r.severity}</Badge> },
          { label: 'Detected', render: (r) => fmtDate(r.detected, true) }, { label: 'Records', key: 'records' }, { label: 'NDPC notified', render: (r) => r.ndpcNotified ? <Badge tone="green">Yes</Badge> : <Badge tone="gray">No</Badge> },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status !== 'CLOSED' && <div className="row-actions">{!r.ndpcNotified && r.records > 0 && <Button size="sm" variant="danger" onClick={() => { api.update(r.id, { ndpcNotified: true }); toast('NDPC notification filed') }}>Notify NDPC</Button>}<Button size="sm" variant="ghost" onClick={() => api.update(r.id, { status: 'CLOSED' })}>Close</Button></div> },
        ]} />
      </Card>
      <Modal open={open} title="Report incident" onClose={() => setOpen(false)} footer={<Button variant="danger" onClick={() => { api.add({ ...f, records: Number(f.records), status: 'INVESTIGATING', detected: new Date().toISOString(), ndpcNotified: false }); setOpen(false); toast('Incident logged — response team paged', 'error') }}>Log incident</Button>}>
        <div className="form">
          <Field label="What happened" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Field label="Severity" as="select" options={['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })} />
          <Field label="Records possibly affected" type="number" value={f.records} onChange={(e) => setF({ ...f, records: e.target.value })} />
          <Field label="Containment so far" as="textarea" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </div>
      </Modal>
    </>
  )
}

export function Processors() {
  const [rows, api] = useCollection('processors')
  const toast = useToast()
  return (
    <>
      <PageHeader title="Processors & Data Processing Agreements" subtitle="Every vendor touching patient data needs a DPA. Cross-border transfers need NDPA safeguards." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Vendor', render: (r) => <b>{r.vendor}</b> }, { label: 'Purpose', key: 'purpose' }, { label: 'Data location', key: 'location' }, { label: 'Transfer safeguard', key: 'transfer' },
          { label: 'DPA', render: (r) => <Badge>{r.dpa}</Badge> },
          { label: '', render: (r) => <div className="row-actions">{r.dpa !== 'SIGNED' && <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { dpa: 'SIGNED' }); toast('DPA recorded') }}>Mark signed</Button>}<DeleteButton what={r.vendor} onConfirm={() => api.remove(r.id)} /></div> },
        ]} />
      </Card>
    </>
  )
}

/* ===================================================================== */
/*                               SUPER ADMIN                             */
/* ===================================================================== */
export function AdminDashboard() {
  const [accounts] = useCollection('accounts')
  const [facilities] = useCollection('facilities')
  const [ig] = useCollection('integrations')
  const stats = useApi('/web/stats/platform')
  const ch = stats?.channels ?? {}
  const chTotal = (ch.WEB ?? 0) + (ch.APP ?? 0)
  return (
    <>
      <PageHeader title="Platform Overview" subtitle="Healthchatter Core + Connect" />
      <StatGrid items={[
        { label: 'Registered patients', value: stats ? stats.patients.toLocaleString('en-NG') : '…', hint: stats ? `+${stats.newPatientsThisWeek} this week` : undefined, icon: 'Users', tone: 'teal' },
        { label: 'Verified providers', value: stats ? stats.verifiedProviders.toLocaleString('en-NG') : '…', icon: 'BadgeCheck', tone: 'blue' },
        { label: 'Facilities live', value: facilities.filter((f) => f.status === 'VERIFIED').length, icon: 'Hospital', tone: 'pink' },
        { label: 'API server uptime', value: stats ? fmtDuration(stats.server.uptimeSeconds) : '…', hint: 'since last restart', icon: 'Server', tone: 'yellow' },
      ]} />
      <Grid>
        <Card title="Daily active users"><BarChart data={(stats?.dailyActive ?? []).map((d) => ({ label: new Date(d.day).toLocaleDateString('en-NG', { weekday: 'short' }), value: d.users }))} /></Card>
        <Card title="Accounts by role">
          <List items={ROLE_KEYS.map((r) => ({ id: r, icon: 'User', title: ROLES[r].label, right: <b>{accounts.filter((a) => a.role === r).length}</b> }))} />
        </Card>
        <Card title="Integrations" action={<Link to="/admin/integrations">Manage</Link>}>
          <List items={ig.map((i) => ({ id: i.id, icon: 'Plug', title: i.name, subtitle: i.latency, right: <Badge>{i.status}</Badge> }))} />
        </Card>
        <Card title="Channels">
          <KeyValue items={[['Website', `${pct(ch.WEB ?? 0, chTotal)}% · ${ch.WEB ?? 0} users`], ['Mobile app', `${pct(ch.APP ?? 0, chTotal)}% · ${ch.APP ?? 0} users`]]} />
        </Card>
      </Grid>
    </>
  )
}

export function AdminUsers() {
  const toast = useToast()
  const { user, inviteUser, sendPasswordReset } = useAuth()
  const [rows, api] = useCollection('accounts')
  const [verifs, vapi] = useCollection('verifications')
  const [ver, setVer] = useState(null) // account being verified
  const [vf, setVf] = useState({ license: '', note: '' })
  // Licensed staff (doctors, nurses, pharmacists, lab scientists, CHWs) need their
  // licence checked; everyone else shows "Not required".
  const licensed = (r) => !!ROLES[r]?.regulator
  const verOf = (a) => verifs.find((x) => x.userId === a.id)
  const licenceStatus = (a) => {
    if (!licensed(a.role)) return 'NOT_REQUIRED'
    const v = verOf(a)
    if (v?.status === 'APPROVED') return 'VERIFIED'
    if (v?.status === 'REJECTED') return 'REJECTED'
    return v || a.status === 'PENDING_VERIFICATION' ? 'PENDING' : 'NOT_VERIFIED'
  }
  const openVerify = (a) => {
    setVf({ license: a.license ?? (verOf(a)?.license !== '—' ? verOf(a)?.license ?? '' : ''), note: '' })
    setVer(a)
  }
  const decideLicence = (approve) => {
    const a = ver
    const v = verOf(a)
    const now = new Date().toISOString()
    const record = { status: approve ? 'APPROVED' : 'REJECTED', license: vf.license, note: vf.note || undefined, verifiedBy: user.name, verifiedAt: now }
    if (v) vapi.update(v.id, record)
    else vapi.add({ userId: a.id, name: a.name, role: a.role, regulator: ROLES[a.role].regulator, specialty: a.specialty ?? '—', submitted: now, docs: [], ...record })
    api.update(a.id, { license: vf.license, ...(a.id !== user.id && { status: approve ? 'ACTIVE' : 'PENDING_VERIFICATION' }) })
    audit(user, approve ? 'VERIFY' : 'REJECT', `${ROLES[a.role].regulator} ${vf.license} — ${a.name}`)
    setVer(null)
    toast(approve ? `${a.name} verified — account active` : `${a.name} rejected — account on hold`, approve ? 'success' : 'error')
  }
  const [q, setQ] = useState('')
  const [role, setRole] = useState('All')
  const [sel, setSel] = useState(null)
  const [open, setOpen] = useState(false)
  const [facilities] = useCollection('facilities')
  const isSuper = user.role === 'SUPER_ADMIN'
  // Super Admin creates any staff role (incl. each hospital's moderator);
  // a hospital moderator creates staff for their own hospital only.
  const creatable = isSuper
    ? ROLE_KEYS.filter((r) => r !== 'PATIENT')
    : ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_OFFICER', 'PHARMACIST', 'LAB_SCIENTIST', 'CHW', 'FACILITY_ADMIN']
  const hospitalBound = (r) => !['SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'CLAIMS_OFFICER', 'PATIENT'].includes(r)
  const hospitals = facilities.filter((x) => x.status === 'VERIFIED').map((x) => x.name)
  const [f, setF] = useState({ name: '', email: '', role: isSuper ? 'MODERATOR' : 'DOCTOR', facility: '' })
  const facilityChoice = f.facility || hospitals[0] || ''
  return (
    <>
      <PageHeader title={isSuper ? 'Users' : 'Staff Accounts'} subtitle={isSuper ? 'Create each hospital\'s moderator here. Moderators then create their own hospital\'s staff.' : `Create and manage staff accounts for ${user.facility}.`} actions={<Button icon="UserPlus" onClick={() => setOpen(true)}>Create user</Button>} />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} />
        <Field label="Role" as="select" options={[{ value: 'All', label: 'All roles' }, ...ROLE_KEYS.map((r) => ({ value: r, label: ROLES[r].label }))]} value={role} onChange={(e) => setRole(e.target.value)} />
      </div>
      <Card pad={false}>
        <Table rows={filterRows(rows, q, ['name', 'email']).filter((r) => role === 'All' || r.role === role)} onRowClick={setSel} columns={[
          { label: 'Name', render: (r) => <span><b>{r.name}</b><small className="block muted">{r.email}</small></span> }, { label: 'Role', render: (r) => ROLES[r.role]?.label },
          { label: 'Organisation', render: (r) => r.facility ?? r.payer ?? '—' }, { label: 'MFA', render: (r) => ROLES[r.role]?.mfa ? <Badge tone="green">Required</Badge> : <Badge tone="gray">Optional</Badge> },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: 'Licence', render: (r) => {
            const st = licenceStatus(r)
            return (
              <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                <Badge tone={st === 'VERIFIED' ? 'green' : st === 'NOT_REQUIRED' ? 'gray' : st === 'REJECTED' ? 'red' : 'amber'}>{st}</Badge>
                {st !== 'VERIFIED' && st !== 'NOT_REQUIRED' && r.id !== user.id && <Button size="sm" icon="BadgeCheck" onClick={() => openVerify(r)}>Verify</Button>}
              </div>
            )
          } },
        ]} />
      </Card>
      <Modal open={!!sel} title={sel?.name} onClose={() => setSel(null)} footer={sel && sel.id !== user.id && (
        <div className="row-actions">
          {sel.status === 'SUSPENDED'
            ? <Button onClick={() => { api.update(sel.id, { status: 'ACTIVE' }); audit(user, 'UPDATE', `User ${sel.name} reactivated`); setSel(null); toast('Reactivated') }}>Reactivate</Button>
            : <Button variant="danger" onClick={() => { api.update(sel.id, { status: 'SUSPENDED' }); audit(user, 'UPDATE', `User ${sel.name} suspended`); setSel(null); toast('Suspended — sessions revoked', 'error') }}>Suspend</Button>}
          <Button variant="ghost" onClick={() => { sendPasswordReset(sel.email).then(() => toast('Password reset link sent'), (err) => toast(err.message, 'error')); setSel(null) }}>Reset password</Button>
        </div>
      )}>
        <KeyValue items={[['Email', sel?.email], ['Phone', sel?.phone], ['Role', ROLES[sel?.role]?.label], ['Status', <Badge key="s">{sel?.status}</Badge>]]} />
        <Field label="Change role" as="select" options={(isSuper ? ROLE_KEYS : creatable).map((r) => ({ value: r, label: ROLES[r].label }))} value={sel?.role ?? ''} onChange={(e) => { api.update(sel.id, { role: e.target.value }); audit(user, 'ROLE_CHANGE', `User ${sel.name} → ${e.target.value}`); setSel({ ...sel, role: e.target.value }); toast('Role changed — logged') }} hint="Every role change is recorded in the platform audit log." />
      </Modal>
      <Modal open={!!ver} title={`Verify ${ver?.name ?? ''}`} onClose={() => setVer(null)} footer={ver && (
        <div className="row-actions">
          <Button variant="ghost" onClick={() => decideLicence(false)}>Reject</Button>
          <Button icon="BadgeCheck" disabled={!vf.license.trim()} onClick={() => decideLicence(true)}>Approve licence</Button>
        </div>
      )}>
        <div className="form">
          <KeyValue items={[['Role', ROLES[ver?.role]?.label], ['Regulator', ROLES[ver?.role]?.regulator], ['Hospital', ver?.facility ?? '—'], ['Email', ver?.email]]} />
          {ver && verOf(ver)?.docs?.length > 0 && <List items={verOf(ver).docs.map((d) => ({ id: d, icon: 'FileCheck', title: d }))} />}
          <Field label={`${ROLES[ver?.role]?.regulator ?? ''} licence number`} value={vf.license} onChange={(e) => setVf({ ...vf, license: e.target.value })} hint="Check it against the regulator's register before approving." />
          <Field label="Note (shown to the staff member if rejected)" as="textarea" value={vf.note} onChange={(e) => setVf({ ...vf, note: e.target.value })} />
          <Alert tone="info">Approving activates the account. Rejecting keeps it on hold until a valid licence is provided.</Alert>
        </div>
      </Modal>
      <Modal open={open} title="Create user" onClose={() => setOpen(false)} footer={<Button onClick={() => inviteUser({ name: f.name, email: f.email, role: f.role, facility: isSuper && hospitalBound(f.role) ? facilityChoice : undefined }).then(() => { db.refresh(); audit(user, 'ROLE_CHANGE', `Created ${f.name} as ${f.role}`); setOpen(false); toast('User created — invite emailed') }, (err) => toast(err.message, 'error'))}>Create & invite</Button>}>
        <div className="form">
          <Field label="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Field label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Field label="Role" as="select" options={creatable.map((r) => ({ value: r, label: ROLES[r].label }))} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
          {isSuper && hospitalBound(f.role) && (
            <Field label="Hospital" as="select" options={hospitals} value={facilityChoice} onChange={(e) => setF({ ...f, facility: e.target.value })} hint="The account will only see this hospital's data." />
          )}
        </div>
      </Modal>
    </>
  )
}

export function RolesMatrix() {
  return (
    <>
      <PageHeader title="Roles & Permissions" subtitle="Least privilege by default. This matrix is enforced in the app and must be mirrored in the API." />
      <div className="cards cards--3">
        {ROLE_KEYS.map((r) => (
          <Card key={r} title={ROLES[r].label} action={ROLES[r].mfa ? <Badge tone="green">MFA</Badge> : null}>
            <p className="muted">{ROLES[r].description}</p>
            <small>{ROLES[r].nav.length + 3} screens · {PERMISSIONS.filter((p) => p.roles.includes(r)).length} permissions</small>
          </Card>
        ))}
      </div>
      <Card title="Permission matrix" pad={false}>
        <div className="table-wrap">
          <table className="table matrix">
            <thead><tr><th>Permission</th>{ROLE_KEYS.map((r) => <th key={r} title={ROLES[r].label}>{ROLES[r].label.split(' ')[0]}</th>)}</tr></thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.key}><td>{p.label}</td>{ROLE_KEYS.map((r) => <td key={r} className="matrix__cell">{p.roles.includes(r) ? <Icon name="Check" size={16} className="text-ok" /> : <span className="muted">·</span>}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

export function AdminFacilities() {
  const [rows] = useCollection('facilities')
  const [q, setQ] = useState('')
  return (
    <>
      <PageHeader title="Facilities" />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} /></div>
      <Card pad={false}>
        <Table rows={filterRows(rows, q, ['name', 'type', 'state'])} columns={[
          { label: 'Facility', render: (r) => <b>{r.name}</b> }, { label: 'Type', key: 'type' }, { label: 'State', key: 'state' }, { label: 'Staff', key: 'staff' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
    </>
  )
}

export function AdminHmos() {
  const toast = useToast()
  const [rows, api] = useCollection('hmos')
  const [name, setName] = useState('')
  return (
    <>
      <PageHeader title="HMOs & Payers" subtitle="Only NHIA-accredited HMOs can be added. Healthchatter connects payers — it is not one." />
      <Card>
        <form className="toolbar" onSubmit={(e) => { e.preventDefault(); api.add({ name, type: 'Private HMO', accredited: true, enrollees: '—', integration: 'Pending' }); setName(''); toast('HMO added') }}>
          <Field label="Add accredited HMO" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit" icon="Plus">Add</Button>
        </form>
      </Card>
      <Card pad={false}>
        <Table rows={rows} columns={[{ label: 'Payer', render: (r) => <b>{r.name}</b> }, { label: 'Type', key: 'type' }, { label: 'Enrollees', key: 'enrollees' }, { label: 'Integration', render: (r) => <Badge tone={r.integration === 'API' ? 'green' : r.integration === 'Pending' ? 'amber' : 'blue'}>{r.integration}</Badge> }, { label: 'NHIA accredited', render: (r) => r.accredited ? <Badge tone="green">Yes</Badge> : <Badge tone="red">No</Badge> }, { label: '', render: (r) => <DeleteButton what={r.name} onConfirm={() => api.remove(r.id)} /> }]} />
      </Card>
    </>
  )
}

export function Integrations() {
  const toast = useToast()
  const [rows, api] = useCollection('integrations')
  return (
    <>
      <PageHeader title="Integrations" />
      <div className="cards cards--3">
        {rows.map((i) => (
          <Card key={i.id} title={i.name} action={<Badge>{i.status}</Badge>}>
            <KeyValue items={[['Latency', i.latency]]} />
            <div className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => toast(i.status === 'CONNECTED' ? `${i.name} is connected` : `${i.name} isn't connected yet — no credentials are set on the server`, i.status === 'CONNECTED' ? 'success' : 'error')}>Test</Button>
              {i.status === 'NOT_CONFIGURED' && <Button size="sm" onClick={() => { api.update(i.id, { status: 'PENDING_SETUP', requestedAt: new Date().toISOString() }); toast('Marked for setup — add its credentials on the server') }}>Configure</Button>}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

export function AiModels() {
  const toast = useToast()
  const [rows, api] = useCollection('aiModels')
  return (
    <>
      <PageHeader title="AI Models" subtitle="Model & version tracking, guardrails and rollout. No training on patient records without consent." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Model', render: (r) => <b>{r.name} {r.version}</b> }, { label: 'Provider', key: 'provider' }, { label: 'Guardrails', key: 'guardrails' },
          { label: 'Deployed', render: (r) => fmtDate(r.deployed) }, { label: 'Stage', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'STAGING' && <Button size="sm" onClick={() => { rows.filter((x) => x.name === r.name && x.status === 'PRODUCTION').forEach((x) => api.update(x.id, { status: 'RETIRED' })); api.update(r.id, { status: 'PRODUCTION' }); toast('Promoted to production') }}>Promote</Button> },
          { label: '', render: (r) => <DeleteButton what={`${r.name} ${r.version}`} onConfirm={() => api.remove(r.id)} /> },
        ]} />
      </Card>
      <Card title="Safety settings">
        <Toggle label="Emergency keyword escalation" description="Chest pain, breathing difficulty, seizures, suicidal thoughts → show 112 and alert on-call clinician." checked onChange={() => {}} />
        <Toggle label="Block dosing advice" checked onChange={() => {}} />
        <Toggle label="Human review of flagged chats" checked onChange={() => {}} />
      </Card>
    </>
  )
}

export function SecuritySettings() {
  const toast = useToast()
  const [settings, settingsApi] = useCollection('platformSettings')
  const saved = settings.find((r) => r.id === 'security')
  const [s, setS] = useState({ mfaStaff: true, mfaPatients: false, session: '30', lockout: '5', ipAllow: false, pw: '10' })
  useEffect(() => {
    if (saved) setS((cur) => ({ ...cur, ...saved }))
  }, [saved])
  const save = () => {
    const { mfaStaff, mfaPatients, session, lockout, ipAllow, pw } = s
    if (saved) settingsApi.update('security', { mfaStaff, mfaPatients, session, lockout, ipAllow, pw })
    else settingsApi.add({ id: 'security', mfaStaff, mfaPatients, session, lockout, ipAllow, pw })
    toast('Security policy saved')
  }
  return (
    <>
      <PageHeader title="Security Settings" actions={<Button onClick={save}>Save policy</Button>} />
      <Grid>
        <Card title="Authentication">
          <Toggle label="Require MFA for all staff roles" checked={s.mfaStaff} onChange={(v) => setS({ ...s, mfaStaff: v })} />
          <Toggle label="Require MFA for patients" description="Patients can use biometric/PIN on mobile." checked={s.mfaPatients} onChange={(v) => setS({ ...s, mfaPatients: v })} />
          <Field label="Minimum password length" type="number" value={s.pw} onChange={(e) => setS({ ...s, pw: e.target.value })} />
          <Field label="Lock account after failed attempts" type="number" value={s.lockout} onChange={(e) => setS({ ...s, lockout: e.target.value })} />
        </Card>
        <Card title="Sessions & access">
          <Field label="Idle timeout for staff (minutes)" type="number" value={s.session} onChange={(e) => setS({ ...s, session: e.target.value })} />
          <Toggle label="Restrict admin access to office IP ranges" checked={s.ipAllow} onChange={(v) => setS({ ...s, ipAllow: v })} />
          <KeyValue items={[['Encryption in transit', 'TLS 1.3'], ['Encryption at rest', 'AES-256'], ['Last penetration test', saved?.lastPenTest ? fmtDate(saved.lastPenTest) : 'Not recorded'], ['Next scheduled', saved?.nextPenTest ? fmtDate(saved.nextPenTest) : 'Not scheduled']]} />
        </Card>
      </Grid>
    </>
  )
}

export function SystemHealth() {
  const sys = useApi('/web/stats/system')
  const [sync] = useCollection('syncQueue')
  return (
    <>
      <PageHeader title="System Health" />
      <StatGrid items={[
        { label: 'API p95 latency', value: sys?.p95LatencyMs != null ? `${sys.p95LatencyMs} ms` : '—', hint: 'last hour', icon: 'Activity', tone: 'teal' },
        { label: 'Error rate', value: sys ? `${(sys.errorRate * 100).toFixed(2)}%` : '—', hint: sys ? `${sys.requestsLastHour} requests in the last hour` : undefined, icon: 'CircleAlert', tone: 'blue' },
        { label: 'Offline syncs pending', value: sync.filter((x) => x.status === 'QUEUED').length, icon: 'RefreshCw', tone: 'yellow' },
        { label: 'Last backup', value: 'Not connected', hint: 'Backups are managed in Supabase', icon: 'Database', tone: 'pink' },
      ]} />
      <Grid>
        <Card title="Requests per minute"><Sparkline points={sys?.requestsPerMinute ?? []} height={100} /></Card>
        <Card title="Environments">
          <List items={[
            { id: 'api', icon: 'Server', title: 'API server', subtitle: sys ? `Node ${sys.nodeVersion} · up ${fmtDuration(sys.uptimeSeconds)}` : 'Not reachable', right: sys ? <Badge tone="green">Healthy</Badge> : <Badge tone="red">Down</Badge> },
            { id: 'db', icon: 'Database', title: 'Database (Supabase Postgres)', subtitle: sys?.dbLatencyMs != null ? `${sys.dbLatencyMs} ms query time` : 'Not reachable', right: sys?.dbLatencyMs != null ? <Badge tone="green">Healthy</Badge> : <Badge tone="red">Down</Badge> },
          ]} />
        </Card>
      </Grid>
    </>
  )
}

export function PlatformAudit() {
  return <AuditTrail />
}
