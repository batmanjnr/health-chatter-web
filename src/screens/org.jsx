/* Facility Administrator and NHIA/HMO Claims Officer screens. */
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { ROLES } from '../config/roles.js'
import { db, fmtDate, naira, useCollection } from '../lib/store.js'
import { downloadCsv } from '../lib/exportCsv.js'
import { avg, countByDay, daysBetween, fmtDuration, inMonth, lastDays, minutesBetween, monthLabel, pct, sameDay, sumBy, timeAgo } from '../lib/stats.js'
import {
  Alert, Badge, BarChart, Button, Card, Field, Grid, KeyValue, List, Modal, PageHeader, Progress,
  SearchInput, Sparkline, StatGrid, Table, Tabs, Timeline, filterRows, useToast, DeleteButton,
} from '../components/ui/index.jsx'

/* ===================================================================== */
/*                          FACILITY ADMINISTRATOR                       */
/* ===================================================================== */
export function FacilityDashboard() {
  const { user } = useAuth()
  const [wards] = useCollection('wards')
  const [claims] = useCollection('claims')
  const [accounts] = useCollection('accounts')
  const staff = accounts.filter((a) => a.id !== user.id)
  const [payments] = useCollection('payments')
  const [checkins] = useCollection('checkins')
  const [appts] = useCollection('appointments')
  const [notes] = useCollection('clinicalNotes')
  const paid = payments.filter((p) => p.status === 'SUCCESS')
  const revenue = (m) => paid.filter((p) => inMonth(p.at, m)).reduce((s, p) => s + p.amount, 0)
  const revNow = revenue(0)
  const revPrev = revenue(1)
  const waits = lastDays(7).map((d) => Math.round(avg(checkins.filter((c) => c.arrivedAt && c.calledAt && sameDay(c.calledAt, d)).map((c) => minutesBetween(c.arrivedAt, c.calledAt))) ?? 0))
  const waitToday = waits[waits.length - 1]
  const byRole = (r) => staff.filter((x) => x.role === r)
  const activeDoctors = byRole('DOCTOR').filter((x) => x.status === 'ACTIVE').length
  const monthAgo = Date.now() - 30 * 86_400_000
  const weekAgo = Date.now() - 7 * 86_400_000
  const beds = wards.reduce((s, w) => s + w.beds, 0)
  const occ = wards.reduce((s, w) => s + w.occupied, 0)
  return (
    <>
      <PageHeader title={user.facility} subtitle="Operations overview" />
      <StatGrid items={[
        { label: 'Bed occupancy', value: `${Math.round((occ / beds) * 100)}%`, hint: `${occ}/${beds} beds`, icon: 'Bed', tone: 'teal' },
        { label: 'Revenue this month', value: naira(revNow), hint: revPrev ? `${revNow >= revPrev ? '+' : ''}${pct(revNow - revPrev, revPrev)}% vs last month` : 'No payments last month', icon: 'Banknote', tone: 'yellow' },
        { label: 'Claims outstanding', value: naira(claims.filter((c) => !['APPROVED', 'REJECTED'].includes(c.status)).reduce((s, c) => s + c.amount, 0)), icon: 'FileCheck', tone: 'blue' },
        { label: 'Active staff', value: staff.filter((s) => s.status === 'ACTIVE').length, icon: 'Users', tone: 'pink' },
      ]} />
      <Grid>
        <Card title="Outpatient visits (last 7 days)"><BarChart data={countByDay(checkins, 'at')} /></Card>
        <Card title="Ward occupancy">
          {wards.map((w) => (
            <div key={w.id} className="meter-row"><span>{w.name}</span><Progress value={(w.occupied / w.beds) * 100} tone={w.occupied / w.beds > 0.85 ? 'amber' : 'teal'} /><small>{w.occupied}/{w.beds}</small></div>
          ))}
        </Card>
        <Card title="Average wait time (minutes)"><Sparkline points={waits} height={90} /><p className="muted">{waitToday ? `${waitToday} min average today (arrival → called).` : 'No completed check-ins today.'}</p></Card>
        <Card title="Staff utilization">
          <KeyValue items={[
            ['Doctors active', `${activeDoctors} / ${byRole('DOCTOR').length}`],
            ['Nurses active', `${byRole('NURSE').filter((x) => x.status === 'ACTIVE').length} / ${byRole('NURSE').length}`],
            ['Appointments per doctor (30 days)', activeDoctors ? Math.round(appts.filter((a) => new Date(a.at) >= monthAgo).length / activeDoctors) : '—'],
            ['Clinical notes (7 days)', notes.filter((n) => new Date(n.at) >= weekAgo).length],
          ]} />
        </Card>
      </Grid>
    </>
  )
}

export function StaffRoles() {
  const toast = useToast()
  const { inviteUser } = useAuth()
  const { user } = useAuth()
  const [accounts, api] = useCollection('accounts')
  const rows = accounts.filter((a) => a.id !== user.id).map((a) => ({ ...a, dept: a.specialty ?? '—' }))
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const facilityRoles = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_OFFICER', 'PHARMACIST', 'LAB_SCIENTIST', 'CHW']
  const [f, setF] = useState({ name: '', email: '', role: 'RECEPTIONIST', dept: '' })
  return (
    <>
      <PageHeader title="Staff & Roles" subtitle="Invite staff and assign one role each. Clinical roles must pass licence verification." actions={<Button icon="UserPlus" onClick={() => setOpen(true)}>Invite staff</Button>} />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} /></div>
      <Card pad={false}>
        <Table rows={filterRows(rows, q, ['name', 'role', 'dept'])} columns={[
          { label: 'Name', render: (r) => <b>{r.name}</b> }, { label: 'Role', render: (r) => ROLES[r.role]?.label }, { label: 'Department', key: 'dept' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }, { label: 'Email', key: 'email' },
          { label: '', render: (r) => (
            <div className="row-actions">
              {r.status === 'ACTIVE' ? <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { status: 'SUSPENDED' }); toast('Access revoked immediately', 'error') }}>Revoke</Button>
                : <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { status: 'ACTIVE' }); toast('Access restored') }}>{r.status === 'INVITED' ? 'Resend invite' : 'Restore'}</Button>}
            </div>
          ) },
        ]} />
      </Card>
      <Modal open={open} title="Invite staff member" onClose={() => setOpen(false)} footer={<Button onClick={() => inviteUser({ name: f.name, email: f.email, role: f.role, specialty: f.dept }).then(() => { db.refresh(); setOpen(false); toast(`Invite sent to ${f.email}`) }, (err) => toast(err.message, 'error'))}>Send invite</Button>}>
        <div className="form">
          <Field label="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Field label="Work email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Field label="Role" as="select" options={facilityRoles.map((r) => ({ value: r, label: ROLES[r].label }))} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
          <Field label="Department" value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })} />
          <Alert tone="info">{ROLES[f.role].description}{ROLES[f.role].regulator && ` Requires ${ROLES[f.role].regulator} verification.`}</Alert>
        </div>
      </Modal>
    </>
  )
}

export function Departments() {
  const [rows, api] = useCollection('departments')
  return (
    <>
      <PageHeader title="Departments & Services" actions={<Button icon="Plus" onClick={() => api.add({ name: 'New department', head: '—', staff: 0, services: '' })}>Add department</Button>} />
      <div className="cards cards--3">
        {rows.map((d) => (
          <Card key={d.id} title={d.name}>
            <KeyValue items={[['Head', d.head], ['Staff', d.staff], ['Services', d.services]]} />
            <div className="row-actions"><DeleteButton what={`the ${d.name} department`} onConfirm={() => api.remove(d.id)} /></div>
          </Card>
        ))}
      </div>
    </>
  )
}

export function BedsWards() {
  const [rows, api] = useCollection('wards')
  const toast = useToast()
  return (
    <>
      <PageHeader title="Beds & Wards" actions={<Button icon="Plus" onClick={() => api.add({ name: 'New ward', beds: 10, occupied: 0 })}>Add ward</Button>} />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Ward', render: (r) => <b>{r.name}</b> }, { label: 'Beds', key: 'beds' }, { label: 'Occupied', key: 'occupied' },
          { label: 'Occupancy', render: (r) => <Progress value={(r.occupied / r.beds) * 100} tone={r.occupied / r.beds > 0.85 ? 'amber' : 'teal'} /> },
          { label: '', render: (r) => <div className="row-actions"><Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { beds: r.beds + 2 }); toast('2 beds added') }}>+2 beds</Button><DeleteButton what={r.name} onConfirm={() => api.remove(r.id)} /></div> },
        ]} />
      </Card>
    </>
  )
}

export function Reports() {
  const [tab, setTab] = useState('Clinical')
  const [patients] = useCollection('patients')
  const [labs] = useCollection('labOrders')
  const [rx] = useCollection('prescriptions')
  const [appts] = useCollection('appointments')
  const [refs] = useCollection('referrals')
  const [payments] = useCollection('payments')
  const [claims] = useCollection('claims')
  const [sync] = useCollection('syncQueue')
  const [complaints] = useCollection('complaints')
  const diagnoses = sumBy(patients.flatMap((p) => (p.problems ?? []).filter((x) => x.status === 'Active')), (x) => x.name.split(' (')[0].split(' — ')[0]).slice(0, 5)
  const completedLabs = labs.filter((l) => l.status === 'COMPLETED')
  const pastAppts = appts.filter((a) => new Date(a.at) < new Date() && a.status !== 'CANCELLED')
  const quality = [
    ['Completed lab results released', pct(completedLabs.filter((l) => l.released).length, completedLabs.length)],
    ['Prescriptions dispensed', pct(rx.filter((r) => r.status === 'DISPENSED').length, rx.length)],
    ['Past appointments completed', pct(pastAppts.filter((a) => a.status === 'COMPLETED').length, pastAppts.length)],
    ['Referrals scheduled or completed', pct(refs.filter((r) => ['SCHEDULED', 'COMPLETED'].includes(r.status)).length, refs.length)],
  ]
  const paid = payments.filter((p) => p.status === 'SUCCESS')
  const decided = claims.filter((c) => ['APPROVED', 'REJECTED'].includes(c.status))
  const decisionDays = avg(decided.filter((c) => c.submittedAt && c.decidedAt).map((c) => daysBetween(c.submittedAt, c.decidedAt)))
  const sumOf = (status) => claims.filter((c) => c.status === status).reduce((s, c) => s + c.amount, 0)
  const resolved = complaints.filter((c) => c.status === 'RESOLVED')
  const resolutionHours = avg(resolved.filter((c) => c.at && c.resolvedAt).map((c) => daysBetween(c.at, c.resolvedAt) * 24))
  return (
    <>
      <PageHeader title="Reports & Analytics" actions={<Button variant="ghost" icon="Download" onClick={() => downloadCsv(`report-${tab.toLowerCase()}`, tab === 'Clinical' ? [...diagnoses.map((d) => ({ section: 'Top active diagnoses', item: d.label, value: d.value })), ...quality.map(([l, v]) => ({ section: 'Quality (%)', item: l, value: v }))] : tab === 'Financial' ? [...paid.map((p) => ({ section: 'Payment', item: p.id, value: p.amount, date: p.at })), ...claims.map((c) => ({ section: `Claim ${c.status}`, item: c.id, value: c.amount, date: c.submittedAt }))] : [...sync.map((x) => ({ section: 'Sync queue', item: x.item, value: x.status, date: x.createdAt })), ...complaints.map((c) => ({ section: 'Complaint', item: c.category, value: c.status, date: c.at }))])}>Export</Button>} />
      <Tabs tabs={['Clinical', 'Financial', 'Operational']} value={tab} onChange={setTab} />
      {tab === 'Clinical' && (
        <Grid>
          <Card title="Top active diagnoses"><BarChart data={diagnoses} /></Card>
          <Card title="Quality measures">
            {quality.map(([l, v]) => (
              <div key={l} className="meter-row"><span>{l}</span><Progress value={v} /><small>{v}%</small></div>
            ))}
          </Card>
        </Grid>
      )}
      {tab === 'Financial' && (
        <Grid>
          <Card title="Revenue by month (₦ thousands)"><BarChart tone="yellow" data={[5, 4, 3, 2, 1, 0].map((m) => ({ label: monthLabel(m), value: Math.round(paid.filter((p) => inMonth(p.at, m)).reduce((s, p) => s + p.amount, 0) / 1000) }))} /></Card>
          <Card title="Claims">
            <KeyValue items={[['Approval rate', decided.length ? `${pct(decided.filter((c) => c.status === 'APPROVED').length, decided.length)}%` : '—'], ['Avg. days to decision', decisionDays == null ? '—' : decisionDays.toFixed(1)], ['Rejected (value)', naira(sumOf('REJECTED'))], ['Queried (value)', naira(sumOf('QUERIED'))]]} />
          </Card>
        </Grid>
      )}
      {tab === 'Operational' && (
        <Grid>
          <Card title="Offline sync queue"><p className="big">{sync.filter((x) => x.status === 'QUEUED').length} waiting</p><small className="muted">{sync.filter((x) => x.status === 'SYNCED').length} synced so far.</small></Card>
          <Card title="Complaints"><KeyValue items={[['Open', complaints.filter((c) => c.status !== 'RESOLVED').length], ['Resolved this month', resolved.filter((c) => inMonth(c.resolvedAt)).length], ['Avg. resolution', resolutionHours == null ? '—' : `${resolutionHours.toFixed(1)} h`]]} /></Card>
        </Grid>
      )}
    </>
  )
}

export function NcdcReporting() {
  const toast = useToast()
  const [rows, api] = useCollection('notifiable')
  return (
    <>
      <PageHeader title="Public Health Reporting (NCDC)" subtitle="Weekly notifiable disease returns generated from the shared record." actions={<Button icon="Send" onClick={() => { rows.filter((r) => r.status === 'DRAFT').forEach((r) => api.update(r.id, { status: 'SUBMITTED' })); toast('Week 47 return submitted to NCDC') }}>Submit week 47</Button>} />
      <Alert tone="warning" title="Immediately notifiable">Suspected Lassa fever, cholera, measles clusters and yellow fever must be reported within 24 hours.</Alert>
      <Card pad={false}>
        <Table rows={rows} columns={[{ label: 'Disease', key: 'disease' }, { label: 'Cases', key: 'cases' }, { label: 'Epi week', key: 'week' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }]} />
      </Card>
    </>
  )
}

export function FacilityAudit() {
  const { user } = useAuth()
  const [rows] = useCollection('auditLog')
  const [q, setQ] = useState('')
  return (
    <>
      <PageHeader title="Facility Audit Log" subtitle="Who accessed what, when — for your facility only." />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search staff, patient or action" /></div>
      <Card pad={false}>
        <Table rows={filterRows(rows, q, ['actor', 'resource', 'action'])} columns={[
          { label: 'When', render: (r) => fmtDate(r.at, true) }, { label: 'Staff', render: (r) => <span><b>{r.actor}</b><small className="block muted">{ROLES[r.role]?.label}</small></span> },
          { label: 'Action', render: (r) => <Badge>{r.action}</Badge> }, { label: 'Resource', key: 'resource' },
        ]} />
      </Card>
    </>
  )
}

export function FacilityProfile() {
  const { user } = useAuth()
  const toast = useToast()
  const [facilities, facApi] = useCollection('facilities')
  const fac = facilities.find((f) => f.name === user.facility)
  const save = (e) => {
    e.preventDefault()
    if (!fac) return toast('Facility record not found', 'error')
    const f = Object.fromEntries(new FormData(e.currentTarget))
    facApi.update(fac.id, { address: f.address, phone: f.phone, hours: f.hours, medicalOfficer: f.medicalOfficer })
    toast('Profile saved')
  }
  return (
    <>
      <PageHeader title="Facility Profile" />
      {fac?.status === 'VERIFIED'
        ? <Alert tone="success" title="Verified facility">Registration checked against the state facility register.</Alert>
        : <Alert tone="warning" title="Verification pending">A moderator is checking your registration.</Alert>}
      <Grid>
        <Card title="Details">
          <form className="form" onSubmit={save} key={fac?.id ?? 'none'}>
            <Field label="Facility name" defaultValue={user.facility} readOnly />
            <Field label="Address" name="address" defaultValue={fac?.address ?? ''} />
            <Field label="Phone" name="phone" defaultValue={fac?.phone ?? ''} />
            <Field label="Opening hours" name="hours" defaultValue={fac?.hours ?? ''} />
            <Field label="Responsible medical officer" name="medicalOfficer" defaultValue={fac?.medicalOfficer ?? ''} />
            <Button type="submit">Save</Button>
          </form>
        </Card>
        <Card title="Registration & agreements">
          <List items={[
            ...(fac ? [{ id: 'reg', icon: 'FileCheck', title: 'State facility registration', subtitle: fac.regNo, right: <Badge>{fac.status}</Badge> }] : []),
            ...(fac?.agreements ?? []).map((a) => ({ id: a.name, icon: 'FileCheck', title: a.name, right: <Badge>{a.status}</Badge> })),
          ]} empty="No registration documents on file." />
        </Card>
      </Grid>
    </>
  )
}

/* ===================================================================== */
/*                          NHIA / HMO CLAIMS OFFICER                    */
/* ===================================================================== */
export function ClaimsDashboard() {
  const { user } = useAuth()
  const [claims] = useCollection('claims')
  const [pa] = useCollection('preauths')
  const turnaround = avg(claims.filter((c) => c.submittedAt && c.decidedAt).map((c) => daysBetween(c.submittedAt, c.decidedAt)))
  return (
    <>
      <PageHeader title="Claims Adjudication" subtitle={user.payer} />
      <StatGrid items={[
        { label: 'New claims', value: claims.filter((c) => c.status === 'SUBMITTED').length, icon: 'Inbox', tone: 'blue' },
        { label: 'Under review', value: claims.filter((c) => c.status === 'UNDER_REVIEW').length, icon: 'FileSearch', tone: 'yellow' },
        { label: 'Pre-auth pending', value: pa.filter((p) => p.status === 'PENDING').length, icon: 'ShieldCheck', tone: 'pink' },
        { label: 'Approved value (month)', value: naira(claims.filter((c) => c.status === 'APPROVED').reduce((s, c) => s + c.amount, 0)), icon: 'Banknote', tone: 'teal' },
      ]} />
      <Grid>
        <Card title="Claims by status"><BarChart tone="blue" data={['SUBMITTED', 'UNDER_REVIEW', 'QUERIED', 'APPROVED', 'REJECTED'].map((s) => ({ label: s.split('_')[0].slice(0, 6), value: claims.filter((c) => c.status === s).length }))} /></Card>
        <Card title="Average turnaround"><p className="big">{turnaround == null ? '—' : `${turnaround.toFixed(1)} days`}</p><small className="muted">Target ≤ 5 days (NHIA guideline)</small></Card>
      </Grid>
    </>
  )
}

export function ClaimsInbox() {
  const [enrollees] = useCollection('enrollees')
  const toast = useToast()
  const { user } = useAuth()
  const [rows, api] = useCollection('claims')
  const [sel, setSel] = useState(null)
  const [note, setNote] = useState('')
  const [tab, setTab] = useState('OPEN')
  const list = rows.filter((r) => (tab === 'OPEN' ? ['SUBMITTED', 'UNDER_REVIEW', 'QUERIED'].includes(r.status) : ['APPROVED', 'REJECTED'].includes(r.status)))
  const decide = (status) => { api.update(sel.id, { status, query: note || undefined, decidedBy: user.name, decidedAt: new Date().toISOString() }); setSel(null); setNote(''); toast(`Claim ${status.toLowerCase()}`) }
  return (
    <>
      <PageHeader title="Claims Inbox" />
      <Tabs tabs={[{ value: 'OPEN', label: 'Open' }, { value: 'DONE', label: 'Decided' }]} value={tab} onChange={setTab} />
      <Card pad={false}>
        <Table rows={list} onRowClick={(r) => { setSel(r); if (r.status === 'SUBMITTED') api.update(r.id, { status: 'UNDER_REVIEW' }) }} columns={[
          { label: 'Claim', key: 'id' }, { label: 'Provider', key: 'provider' }, { label: 'Enrollee', render: (r) => <span><b>{r.enrollee}</b><small className="block muted">{r.enrolleeId}</small></span> },
          { label: 'Diagnosis', key: 'diagnosis' }, { label: 'Amount', render: (r) => naira(r.amount) }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
      <Modal open={!!sel} title={`Claim ${sel?.id}`} onClose={() => setSel(null)} wide footer={sel && !['APPROVED', 'REJECTED'].includes(sel.status) && (
        <div className="row-actions">
          <Button variant="ghost" onClick={() => decide('QUERIED')} disabled={!note}>Query provider</Button>
          <Button variant="danger" onClick={() => decide('REJECTED')} disabled={!note}>Reject</Button>
          <Button onClick={() => decide('APPROVED')}>Approve</Button>
        </div>
      )}>
        <Grid>
          <KeyValue items={[['Provider', sel?.provider], ['Enrollee', `${sel?.enrollee} (${sel?.enrolleeId})`], ['Diagnosis (ICD-10)', sel?.diagnosis], ['Amount', naira(sel?.amount)], ['Invoice', sel?.invoice]]} />
          <div>
            <h3 className="sub">Audit trail</h3>
            <Timeline items={[{ title: 'Submitted by provider', subtitle: fmtDate(sel?.submittedAt, true), done: true }, { title: 'Eligibility check', subtitle: (() => { const e = enrollees.find((x) => x.id === sel?.enrolleeId); return e ? `Enrollee ${e.status.toLowerCase()} · ${e.plan} plan` : 'Enrollee not found in member list' })(), done: enrollees.some((x) => x.id === sel?.enrolleeId && x.status === 'ACTIVE') }, { title: 'Review', subtitle: sel?.decidedBy ? `By ${sel.decidedBy}` : 'Awaiting claims officer', done: sel?.status !== 'SUBMITTED' }, { title: 'Decision', done: ['APPROVED', 'REJECTED'].includes(sel?.status) }]} />
          </div>
        </Grid>
        {sel?.query && <Alert tone="warning" title="Previous note">{sel.query}</Alert>}
        <Field label="Note to provider (required to query or reject)" as="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>
    </>
  )
}

export function Enrollees() {
  const [rows] = useCollection('enrollees')
  const [q, setQ] = useState('')
  return (
    <>
      <PageHeader title="Enrollee Lookup" />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Name or enrollee ID" /></div>
      <Card pad={false}>
        <Table rows={filterRows(rows, q, ['name', 'id'])} columns={[
          { label: 'Enrollee ID', key: 'id' }, { label: 'Name', key: 'name' }, { label: 'Plan', key: 'plan' }, { label: 'Dependants', key: 'dependants' },
          { label: 'Benefit used', render: (r) => <Progress value={r.utilization} tone={r.utilization > 80 ? 'amber' : 'teal'} /> }, { label: 'Expires', key: 'expires' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
    </>
  )
}

export function PreAuth() {
  const toast = useToast()
  const [rows, api] = useCollection('preauths')
  return (
    <>
      <PageHeader title="Pre-Authorizations" subtitle="Approve high-cost procedures before they happen." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Code', key: 'id' }, { label: 'Enrollee', key: 'enrollee' }, { label: 'Provider', key: 'provider' }, { label: 'Procedure', key: 'procedure' },
          { label: 'Amount', render: (r) => naira(r.amount) }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'PENDING' && <div className="row-actions"><Button size="sm" onClick={() => { api.update(r.id, { status: 'APPROVED' }); toast(`Authorization code ${r.id}-OK issued`) }}>Approve</Button><Button size="sm" variant="ghost" onClick={() => api.update(r.id, { status: 'REJECTED' })}>Decline</Button></div> },
        ]} />
      </Card>
    </>
  )
}

export function ProviderNetwork() {
  const [rows] = useCollection('facilities')
  return (
    <>
      <PageHeader title="Provider Network" subtitle="Accredited facilities your enrollees can use." />
      <Card pad={false}>
        <Table rows={rows.filter((f) => f.status === 'VERIFIED')} columns={[{ label: 'Facility', key: 'name' }, { label: 'Type', key: 'type' }, { label: 'State', key: 'state' }, { label: 'Tariff', render: () => 'Standard 2026' }, { label: 'Status', render: () => <Badge>ACTIVE</Badge> }]} />
      </Card>
    </>
  )
}

export function ClaimsReports() {
  const [claims] = useCollection('claims')
  const byProvider = sumBy(claims, (c) => c.provider.split(',')[0], (c) => c.amount).slice(0, 5).map((x) => ({ ...x, value: Math.round(x.value / 1000) }))
  const mean = avg(claims.map((c) => c.amount)) ?? 0
  const dupes = claims.filter((c, i) => claims.some((o, j) => j !== i && o.enrollee === c.enrollee && o.diagnosis === c.diagnosis && o.provider !== c.provider))
  const signals = [
    ...[...new Set(dupes.map((c) => c.enrollee))].map((e) => ({ id: `dup-${e}`, icon: 'TriangleAlert', tone: 'red', title: 'Duplicate claim pattern', subtitle: `${e} — same diagnosis claimed by more than one provider` })),
    ...claims.filter((c) => mean && c.amount > mean * 2).map((c) => ({ id: `hi-${c.id}`, icon: 'TriangleAlert', tone: 'amber', title: `Unusually high claim ${c.id}`, subtitle: `${c.provider} · ${naira(c.amount)} (average ${naira(Math.round(mean))})` })),
  ]
  return (
    <>
      <PageHeader title="Reports" actions={<Button variant="ghost" icon="Download" onClick={() => downloadCsv('claims', claims, ['id', 'invoice', 'enrollee', 'enrolleeId', 'provider', 'payer', 'amount', 'diagnosis', 'status', 'submittedAt', 'decidedAt', 'decidedBy'])}>Export</Button>} />
      <Grid>
        <Card title="Claims value by provider (₦ thousands)"><BarChart tone="blue" data={byProvider} /></Card>
        <Card title="Fraud & anomaly signals">
          <List items={signals} empty="No anomalies detected." />
        </Card>
      </Grid>
    </>
  )
}
