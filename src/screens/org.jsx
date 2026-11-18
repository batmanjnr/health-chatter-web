/* Facility Administrator and NHIA/HMO Claims Officer screens. */
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { ROLES } from '../config/roles.js'
import { fmtDate, naira, useCollection } from '../lib/store.js'
import {
  Alert, Badge, BarChart, Button, Card, Field, Grid, KeyValue, List, Modal, PageHeader, Progress,
  SearchInput, Sparkline, StatGrid, Table, Tabs, Timeline, filterRows, useToast,
} from '../components/ui/index.jsx'

/* ===================================================================== */
/*                          FACILITY ADMINISTRATOR                       */
/* ===================================================================== */
export function FacilityDashboard() {
  const { user } = useAuth()
  const [wards] = useCollection('wards')
  const [claims] = useCollection('claims')
  const [staff] = useCollection('staff')
  const beds = wards.reduce((s, w) => s + w.beds, 0)
  const occ = wards.reduce((s, w) => s + w.occupied, 0)
  return (
    <>
      <PageHeader title={user.facility} subtitle="Operations overview" />
      <StatGrid items={[
        { label: 'Bed occupancy', value: `${Math.round((occ / beds) * 100)}%`, hint: `${occ}/${beds} beds`, icon: 'Bed', tone: 'teal' },
        { label: 'Revenue this month', value: naira(18450000), hint: '+12% vs last month', icon: 'Banknote', tone: 'yellow' },
        { label: 'Claims outstanding', value: naira(claims.filter((c) => !['APPROVED', 'REJECTED'].includes(c.status)).reduce((s, c) => s + c.amount, 0)), icon: 'FileCheck', tone: 'blue' },
        { label: 'Active staff', value: staff.filter((s) => s.status === 'ACTIVE').length, icon: 'Users', tone: 'pink' },
      ]} />
      <Grid>
        <Card title="Outpatient visits (last 7 days)"><BarChart data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({ label: d, value: [212, 248, 230, 265, 290, 120, 64][i] }))} /></Card>
        <Card title="Ward occupancy">
          {wards.map((w) => (
            <div key={w.id} className="meter-row"><span>{w.name}</span><Progress value={(w.occupied / w.beds) * 100} tone={w.occupied / w.beds > 0.85 ? 'amber' : 'teal'} /><small>{w.occupied}/{w.beds}</small></div>
          ))}
        </Card>
        <Card title="Average wait time (minutes)"><Sparkline points={[62, 58, 55, 49, 51, 44, 41]} height={90} /><p className="muted">Down 34% since go-live.</p></Card>
        <Card title="Staff utilization">
          <KeyValue items={[['Doctors on duty', '18 / 22'], ['Nurses on duty', '46 / 52'], ['Avg. patients per doctor', '31'], ['Documentation time / visit', '4.2 min']]} />
        </Card>
      </Grid>
    </>
  )
}

export function StaffRoles() {
  const toast = useToast()
  const [rows, api] = useCollection('staff')
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
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }, { label: 'Last active', render: (r) => r.lastActive ? fmtDate(r.lastActive, true) : '—' },
          { label: '', render: (r) => (
            <div className="row-actions">
              {r.status === 'ACTIVE' ? <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { status: 'SUSPENDED' }); toast('Access revoked immediately', 'error') }}>Revoke</Button>
                : <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { status: 'ACTIVE' }); toast('Access restored') }}>{r.status === 'INVITED' ? 'Resend invite' : 'Restore'}</Button>}
            </div>
          ) },
        ]} />
      </Card>
      <Modal open={open} title="Invite staff member" onClose={() => setOpen(false)} footer={<Button onClick={() => { api.add({ ...f, status: 'INVITED', lastActive: null }); setOpen(false); toast(`Invite sent to ${f.email}`) }}>Send invite</Button>}>
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
          { label: '', render: (r) => <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { beds: r.beds + 2 }); toast('2 beds added') }}>+2 beds</Button> },
        ]} />
      </Card>
    </>
  )
}

export function Reports() {
  const [tab, setTab] = useState('Clinical')
  return (
    <>
      <PageHeader title="Reports & Analytics" actions={<Button variant="ghost" icon="Download">Export</Button>} />
      <Tabs tabs={['Clinical', 'Financial', 'Operational']} value={tab} onChange={setTab} />
      {tab === 'Clinical' && (
        <Grid>
          <Card title="Top diagnoses this month"><BarChart data={[{ label: 'Malaria', value: 142 }, { label: 'HTN', value: 98 }, { label: 'T2DM', value: 61 }, { label: 'URTI', value: 55 }, { label: 'ANC', value: 88 }]} /></Card>
          <Card title="Quality measures">
            {[['BP controlled (<140/90)', 64], ['HbA1c checked in 6 months', 71], ['Antenatal 4+ visits', 58], ['Results acknowledged < 24h', 92]].map(([l, v]) => (
              <div key={l} className="meter-row"><span>{l}</span><Progress value={v} /><small>{v}%</small></div>
            ))}
          </Card>
        </Grid>
      )}
      {tab === 'Financial' && (
        <Grid>
          <Card title="Revenue by month (₦ millions)"><BarChart tone="yellow" data={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((m, i) => ({ label: m, value: [12.1, 13.4, 14.0, 15.8, 16.4, 18.5][i] }))} /></Card>
          <Card title="Claims">
            <KeyValue items={[['Approval rate', '86%'], ['Avg. days to payment', '23'], ['Rejected (value)', naira(1240000)], ['Leakage prevented', naira(3100000)]]} />
          </Card>
        </Grid>
      )}
      {tab === 'Operational' && (
        <Grid>
          <Card title="Uptime (facility server)"><p className="big">99.6%</p><small className="muted">2 outages, both covered by offline mode.</small></Card>
          <Card title="Support tickets"><KeyValue items={[['Open', 4], ['Resolved this month', 38], ['Avg. resolution', '6.2 h']]} /></Card>
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
  const short = (user.facility ?? '').split(' ')[0]
  return (
    <>
      <PageHeader title="Facility Audit Log" subtitle="Who accessed what, when — for your facility only." />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search staff, patient or action" /></div>
      <Card pad={false}>
        <Table rows={filterRows(rows.filter((r) => r.facility === 'LUTH' || r.facility?.startsWith(short)), q, ['actor', 'resource', 'action'])} columns={[
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
  return (
    <>
      <PageHeader title="Facility Profile" />
      <Alert tone="success" title="Verified facility">Registration checked against the Lagos State Ministry of Health register.</Alert>
      <Grid>
        <Card title="Details">
          <form className="form" onSubmit={(e) => { e.preventDefault(); toast('Profile saved') }}>
            <Field label="Facility name" defaultValue={user.facility} />
            <Field label="Address" defaultValue="Ishaga Rd, Idi-Araba, Surulere, Lagos" />
            <Field label="Phone" defaultValue="+234 1 280 1234" />
            <Field label="Opening hours" defaultValue="24 hours (Emergency) · OPD 08:00–16:00" />
            <Field label="Responsible medical officer" defaultValue="Prof. A. Adeyemo (MDCN/R/10221)" />
            <Button type="submit">Save</Button>
          </form>
        </Card>
        <Card title="Registration & agreements">
          <List items={[
            { id: 1, icon: 'FileCheck', title: 'State facility registration', subtitle: 'LSMOH/HF/0012', right: <Badge>VERIFIED</Badge> },
            { id: 2, icon: 'FileCheck', title: 'Facility Agreement', right: <Badge>SIGNED</Badge> },
            { id: 3, icon: 'FileCheck', title: 'Data Processing Agreement', right: <Badge>SIGNED</Badge> },
            { id: 4, icon: 'FileCheck', title: 'NHIA accreditation', right: <Badge>VERIFIED</Badge> },
          ]} />
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
        <Card title="Average turnaround"><p className="big">3.4 days</p><small className="muted">Target ≤ 5 days (NHIA guideline)</small></Card>
      </Grid>
    </>
  )
}

export function ClaimsInbox() {
  const toast = useToast()
  const { user } = useAuth()
  const [rows, api] = useCollection('claims')
  const [sel, setSel] = useState(null)
  const [note, setNote] = useState('')
  const [tab, setTab] = useState('OPEN')
  const list = rows.filter((r) => (tab === 'OPEN' ? ['SUBMITTED', 'UNDER_REVIEW', 'QUERIED'].includes(r.status) : ['APPROVED', 'REJECTED'].includes(r.status)))
  const decide = (status) => { api.update(sel.id, { status, query: note || undefined, decidedBy: user.name }); setSel(null); setNote(''); toast(`Claim ${status.toLowerCase()}`) }
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
            <Timeline items={[{ title: 'Submitted by provider', subtitle: fmtDate(sel?.submittedAt, true), done: true }, { title: 'Eligibility verified', subtitle: 'Enrollee active on date of service', done: true }, { title: 'Tariff check', subtitle: 'Within agreed tariff', done: true }, { title: 'Decision', done: ['APPROVED', 'REJECTED'].includes(sel?.status) }]} />
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
  return (
    <>
      <PageHeader title="Reports" actions={<Button variant="ghost" icon="Download">Export</Button>} />
      <Grid>
        <Card title="Claims value by provider (₦ thousands)"><BarChart tone="blue" data={[{ label: 'LUTH', value: 820 }, { label: 'Reddington', value: 640 }, { label: 'Evercare', value: 410 }, { label: 'PHC Ikeja', value: 90 }]} /></Card>
        <Card title="Fraud & anomaly signals">
          <List items={[
            { id: 1, icon: 'TriangleAlert', tone: 'red', title: 'Duplicate claim pattern', subtitle: 'Same enrollee, same service, 2 providers in 24h' },
            { id: 2, icon: 'TriangleAlert', tone: 'amber', title: 'Unusual MRI volume', subtitle: 'Evercare +240% vs 3-month average' },
          ]} />
        </Card>
      </Grid>
    </>
  )
}
