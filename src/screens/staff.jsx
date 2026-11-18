/* Nurse, Community Health Worker and Receptionist screens. */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { fmtDate, fmtTime, useCollection } from '../lib/store.js'
import {
  Alert, Avatar, Badge, Button, Card, Field, Grid, Icon, KeyValue, List, Modal, PageHeader,
  Progress, SearchInput, StatGrid, Table, Tabs, filterRows, useToast,
} from '../components/ui/index.jsx'

const LEVELS = { RED: 'Immediate', ORANGE: 'Very urgent (10 min)', YELLOW: 'Urgent (60 min)', GREEN: 'Standard (2 h)' }

/* ===================================================================== */
/*                                 NURSE                                 */
/* ===================================================================== */
export function NurseDashboard() {
  const { user } = useAuth()
  const [triage] = useCollection('triageQueue')
  const [tasks] = useCollection('nursingTasks')
  const [wards] = useCollection('wards')
  return (
    <>
      <PageHeader title={`Hello, ${user.name}`} subtitle={`${user.facility} · Day shift 07:00–19:00`} />
      <StatGrid items={[
        { label: 'Waiting for triage', value: triage.filter((t) => t.status === 'WAITING').length, hint: `${triage.filter((t) => t.level === 'RED').length} red`, icon: 'Siren', tone: 'pink' },
        { label: 'Tasks due', value: tasks.filter((t) => t.status === 'DUE').length, icon: 'ClipboardCheck', tone: 'yellow' },
        { label: 'Bed occupancy', value: `${Math.round((wards.reduce((s, w) => s + w.occupied, 0) / wards.reduce((s, w) => s + w.beds, 0)) * 100)}%`, icon: 'Bed', tone: 'teal' },
        { label: 'Discharges today', value: 2, icon: 'LogOut', tone: 'blue' },
      ]} />
      <Grid>
        <Card title="Triage queue" action={<Link to="/nurse/triage">Open</Link>}>
          <List items={triage.map((t) => ({ id: t.id, avatar: t.patient, title: t.patient, subtitle: t.complaint, right: <Badge>{t.level}</Badge> }))} />
        </Card>
        <Card title="Due now" action={<Link to="/nurse/tasks">All tasks</Link>}>
          <List items={tasks.filter((t) => t.status === 'DUE').map((t) => ({ id: t.id, icon: t.type === 'MAR' ? 'Pill' : 'ClipboardCheck', title: t.task, subtitle: `${t.patient} · ${t.bed} · ${fmtTime(t.due)}` }))} />
        </Card>
      </Grid>
    </>
  )
}

export function Triage() {
  const toast = useToast()
  const [rows, api] = useCollection('triageQueue')
  const [sel, setSel] = useState(null)
  const [level, setLevel] = useState('YELLOW')
  const order = ['RED', 'ORANGE', 'YELLOW', 'GREEN']
  return (
    <>
      <PageHeader title="Triage Queue" subtitle="Sorted by acuity (South African Triage Scale)." actions={<Button icon="UserPlus" onClick={() => setSel({ patient: '', complaint: '', age: '' })}>New arrival</Button>} />
      <div className="legend">{order.map((l) => <span key={l}><Badge>{l}</Badge> {LEVELS[l]}</span>)}</div>
      <Card pad={false}>
        <Table rows={[...rows].sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))} columns={[
          { label: 'Level', render: (r) => <Badge>{r.level}</Badge>, width: 90 },
          { label: 'Patient', render: (r) => <span><b>{r.patient}</b><small className="block muted">{r.age} yrs</small></span> },
          { label: 'Complaint', key: 'complaint' },
          { label: 'Arrived', render: (r) => fmtTime(r.arrived) },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => <Button size="sm" onClick={() => { setSel(r); setLevel(r.level) }}>Assess</Button> },
        ]} />
      </Card>
      <Modal open={!!sel} title={sel?.id ? `Triage — ${sel.patient}` : 'New arrival'} onClose={() => setSel(null)} wide footer={
        <Button onClick={() => {
          if (sel.id) api.update(sel.id, { level, status: 'IN_ASSESSMENT' })
          else api.add({ ...sel, level, status: 'WAITING', arrived: new Date().toISOString() })
          setSel(null); toast(level === 'RED' ? 'RED — doctor & resus team alerted' : 'Triage saved', level === 'RED' ? 'error' : 'success')
        }}>Save triage</Button>
      }>
        <div className="form form--2">
          {!sel?.id && <>
            <Field label="Patient name" value={sel?.patient ?? ''} onChange={(e) => setSel({ ...sel, patient: e.target.value })} />
            <Field label="Age" type="number" value={sel?.age ?? ''} onChange={(e) => setSel({ ...sel, age: e.target.value })} />
            <Field label="Presenting complaint" className="span-2" value={sel?.complaint ?? ''} onChange={(e) => setSel({ ...sel, complaint: e.target.value })} />
          </>}
          <Field label="Pulse (bpm)" type="number" /><Field label="Blood pressure" placeholder="120/80" />
          <Field label="Resp. rate" type="number" /><Field label="Temperature (°C)" type="number" step="0.1" />
          <Field label="SpO₂ (%)" type="number" /><Field label="AVPU" as="select" options={['Alert', 'Voice', 'Pain', 'Unresponsive']} />
          <Field label="Triage level" as="select" options={order.map((o) => ({ value: o, label: `${o} — ${LEVELS[o]}` }))} value={level} onChange={(e) => setLevel(e.target.value)} className="span-2" />
        </div>
      </Modal>
    </>
  )
}

export function RecordVitals() {
  const toast = useToast()
  const { user } = useAuth()
  const [patients] = useCollection('patients')
  const [vitals, api] = useCollection('vitals')
  const [f, setF] = useState({ patient: patients[0]?.name, bp: '', pulse: '', temp: '', spo2: '', rr: '', weight: '', glucose: '' })
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const sys = Number(f.bp.split('/')[0])
  return (
    <>
      <PageHeader title="Record Vitals" subtitle="Works offline — readings sync when you're back online." />
      <Grid>
        <Card>
          <form className="form form--2" onSubmit={(e) => { e.preventDefault(); api.add({ ...f, by: user.name, at: new Date().toISOString() }); toast('Vitals saved to chart'); setF({ ...f, bp: '', pulse: '', temp: '', spo2: '', rr: '', weight: '', glucose: '' }) }}>
            <Field label="Patient" as="select" options={patients.map((p) => p.name)} value={f.patient} onChange={s('patient')} className="span-2" />
            <Field label="Blood pressure (mmHg)" placeholder="120/80" required value={f.bp} onChange={s('bp')} />
            <Field label="Pulse (bpm)" type="number" value={f.pulse} onChange={s('pulse')} />
            <Field label="Temperature (°C)" type="number" step="0.1" value={f.temp} onChange={s('temp')} />
            <Field label="SpO₂ (%)" type="number" value={f.spo2} onChange={s('spo2')} />
            <Field label="Resp. rate" type="number" value={f.rr} onChange={s('rr')} />
            <Field label="Weight (kg)" type="number" value={f.weight} onChange={s('weight')} />
            <Field label="Blood glucose (mmol/L)" type="number" step="0.1" value={f.glucose} onChange={s('glucose')} />
            {sys >= 160 && <Alert tone="danger" title="Severe hypertension">Inform the doctor now.</Alert>}
            <div className="form__actions"><Button type="submit">Save vitals</Button></div>
          </form>
        </Card>
        <Card title="Recorded this shift" pad={false}>
          <Table rows={vitals} empty="No readings yet." columns={[{ label: 'Patient', key: 'patient' }, { label: 'BP', key: 'bp' }, { label: 'Pulse', key: 'pulse' }, { label: 'Temp', key: 'temp' }, { label: 'Time', render: (r) => fmtTime(r.at) }]} />
        </Card>
      </Grid>
    </>
  )
}

export function Ward() {
  const toast = useToast()
  const [wards] = useCollection('wards')
  const [beds, api] = useCollection('beds')
  const [sel, setSel] = useState(null)
  return (
    <>
      <PageHeader title="Ward & Bed Management" />
      <div className="cards cards--4">
        {wards.map((w) => (
          <Card key={w.id} title={w.name}>
            <p className="big">{w.occupied}/{w.beds}</p>
            <Progress value={(w.occupied / w.beds) * 100} tone={w.occupied / w.beds > 0.85 ? 'amber' : 'teal'} />
          </Card>
        ))}
      </div>
      <Card title="Male Medical Ward — bed board">
        <div className="beds">
          {beds.map((b) => (
            <button key={b.id} className={`bed bed--${b.status.toLowerCase()}`} onClick={() => setSel(b)}>
              <Icon name="Bed" size={18} />
              <b>{b.label}</b>
              <small>{b.patient ?? (b.status === 'CLEANING' ? 'Cleaning' : 'Free')}</small>
            </button>
          ))}
        </div>
      </Card>
      <Modal open={!!sel} title={sel?.label} onClose={() => setSel(null)} footer={
        <div className="row-actions">
          {sel?.status === 'CLEANING' && <Button onClick={() => { api.update(sel.id, { status: 'AVAILABLE' }); setSel(null); toast('Bed ready') }}>Mark clean</Button>}
          {sel?.patient && <Button variant="ghost" onClick={() => { api.update(sel.id, { status: 'DISCHARGE_DUE' }); setSel(null); toast('Flagged for discharge') }}>Flag for discharge</Button>}
          {sel?.status === 'DISCHARGE_DUE' && <Button onClick={() => { api.update(sel.id, { status: 'CLEANING', patient: null }); setSel(null); toast('Patient discharged — summary sent') }}>Complete discharge</Button>}
        </div>
      }>
        <KeyValue items={[['Status', <Badge key="s">{sel?.status}</Badge>], ['Patient', sel?.patient ?? '—'], ['Ward', sel?.ward]]} />
      </Modal>
    </>
  )
}

export function Tasks() {
  const toast = useToast()
  const [rows, api] = useCollection('nursingTasks')
  const [tab, setTab] = useState('ALL')
  return (
    <>
      <PageHeader title="Tasks & Medication Administration (MAR)" />
      <Tabs tabs={[{ value: 'ALL', label: 'All' }, { value: 'MAR', label: 'Medications' }, { value: 'OBS', label: 'Observations' }, { value: 'CARE', label: 'Care' }]} value={tab} onChange={setTab} />
      <Card pad={false}>
        <Table rows={rows.filter((r) => tab === 'ALL' || r.type === tab)} columns={[
          { label: 'Due', render: (r) => fmtTime(r.due) }, { label: 'Patient', render: (r) => `${r.patient} · ${r.bed}` }, { label: 'Task', key: 'task' },
          { label: 'Type', render: (r) => <Badge tone="blue">{r.type}</Badge> }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status !== 'DONE' && (
            <div className="row-actions">
              <Button size="sm" onClick={() => { api.update(r.id, { status: 'DONE' }); toast(r.type === 'MAR' ? 'Dose given — recorded on MAR' : 'Task done') }}>{r.type === 'MAR' ? 'Given' : 'Done'}</Button>
              {r.type === 'MAR' && <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { status: 'REFUSED' }); toast('Recorded as refused', 'error') }}>Refused</Button>}
            </div>
          ) },
        ]} />
      </Card>
    </>
  )
}

export function OfflineSync() {
  const toast = useToast()
  const [rows, api] = useCollection('syncQueue')
  const queued = rows.filter((r) => r.status === 'QUEUED')
  return (
    <>
      <PageHeader title="Offline Sync" subtitle="Work captured without internet waits here and syncs automatically." actions={<Button icon="RefreshCw" disabled={!queued.length} onClick={() => { queued.forEach((r) => api.update(r.id, { status: 'SYNCED' })); toast(`${queued.length} items synced`) }}>Sync now</Button>} />
      <Alert tone={queued.length ? 'warning' : 'success'} title={queued.length ? `${queued.length} items waiting to sync` : 'Everything is synced'}>Last successful sync: today, 07:31.</Alert>
      <Card pad={false}>
        <Table rows={rows} columns={[{ label: 'Item', key: 'item' }, { label: 'Captured', render: (r) => fmtDate(r.createdAt, true) }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }]} />
      </Card>
    </>
  )
}

/* ===================================================================== */
/*                      COMMUNITY HEALTH WORKER                          */
/* ===================================================================== */
export function ChwDashboard() {
  const { user } = useAuth()
  const [visits] = useCollection('homeVisits')
  const [screens] = useCollection('screenings')
  const [sync] = useCollection('syncQueue')
  return (
    <>
      <PageHeader title={`Hello, ${user.name}`} subtitle={`${user.facility} catchment · Mushin LGA`} />
      <StatGrid items={[
        { label: 'Visits today', value: visits.filter((v) => new Date(v.at).toDateString() === new Date().toDateString()).length, icon: 'Footprints', tone: 'teal' },
        { label: 'High-risk screenings', value: screens.filter((s) => s.flag === 'HIGH').length, icon: 'TriangleAlert', tone: 'pink' },
        { label: 'Pending referrals', value: 1, icon: 'Send', tone: 'blue' },
        { label: 'Waiting to sync', value: sync.filter((s) => s.status === 'QUEUED').length, icon: 'RefreshCw', tone: 'yellow' },
      ]} />
      <Card title="Today's route">
        <List items={visits.map((v) => ({ id: v.id, icon: 'MapPin', title: v.household, subtitle: `${v.purpose} · ${v.address}`, right: <Badge>{v.status}</Badge> }))} />
      </Card>
    </>
  )
}

export function HomeVisits() {
  const toast = useToast()
  const [rows, api] = useCollection('homeVisits')
  const [sel, setSel] = useState(null)
  const [, sync] = useCollection('syncQueue')
  return (
    <>
      <PageHeader title="Home Visits" />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'When', render: (r) => fmtDate(r.at, true) }, { label: 'Household', key: 'household' }, { label: 'Address', key: 'address' }, { label: 'Purpose', key: 'purpose' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status !== 'DONE' && <Button size="sm" onClick={() => setSel(r)}>Record visit</Button> },
        ]} />
      </Card>
      <Modal open={!!sel} title={`Visit — ${sel?.household}`} onClose={() => setSel(null)} footer={<Button onClick={() => { api.update(sel.id, { status: 'DONE' }); sync.add({ item: `Home visit note — ${sel.household}`, createdAt: new Date().toISOString(), status: 'QUEUED' }); setSel(null); toast('Visit saved offline — will sync') }}>Save visit</Button>}>
        <div className="form">
          <Field label="Who was seen" />
          <Field label="Findings" as="textarea" />
          <label className="check"><input type="checkbox" /> <span>Danger signs present — refer to facility</span></label>
          <Field label="GPS location" value="6.5276° N, 3.3488° E (captured)" readOnly />
        </div>
      </Modal>
    </>
  )
}

export function ChwRegister({ title = 'Register Patient' }) {
  const toast = useToast()
  const [, patients] = useCollection('patients')
  const [, sync] = useCollection('syncQueue')
  const { user } = useAuth()
  const blank = { name: '', dob: '', gender: 'Female', phone: '', nin: '', lga: '', address: '', next: '', insurance: 'Self-pay', policy: '', guardian: '' }
  const [f, setF] = useState(blank)
  const [done, setDone] = useState(null)
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <>
      <PageHeader title={title} subtitle="Every patient gets a Healthchatter Health ID that works at any facility. NIN links records via NIMC." />
      {done && <Alert tone="success" title={`Registered — Health ID ${done}`}>Print the ID card or send it to the patient by SMS.</Alert>}
      <Card>
        <form className="form form--2" onSubmit={(e) => {
          e.preventDefault()
          const healthId = `HC-${Math.floor(200000 + Math.random() * 99999)}`
          const age = f.dob ? Math.floor((Date.now() - new Date(f.dob)) / 3.15576e10) : ''
          patients.add({ name: f.name, age, gender: f.gender, healthId, nin: f.nin, phone: f.phone, insurance: f.insurance, lga: f.lga, allergies: [], problems: [], medications: [], guardian: f.guardian || undefined })
          if (user.role === 'CHW') sync.add({ item: `New registration — ${f.name}`, createdAt: new Date().toISOString(), status: 'QUEUED' })
          setDone(healthId); setF(blank); toast('Patient registered')
        }}>
          <Field label="Full name" required value={f.name} onChange={s('name')} />
          <Field label="Date of birth" type="date" required value={f.dob} onChange={s('dob')} />
          <Field label="Sex" as="select" options={['Female', 'Male']} value={f.gender} onChange={s('gender')} />
          <Field label="Phone" type="tel" value={f.phone} onChange={s('phone')} />
          <Field label="NIN" inputMode="numeric" maxLength={11} value={f.nin} onChange={s('nin')} hint="Optional — verified with NIMC when online." />
          <Field label="LGA" value={f.lga} onChange={s('lga')} />
          <Field label="Address" className="span-2" value={f.address} onChange={s('address')} />
          <Field label="Next of kin (name & phone)" value={f.next} onChange={s('next')} />
          <Field label="Parent/guardian (if under 18)" value={f.guardian} onChange={s('guardian')} />
          <Field label="Coverage" as="select" options={['Self-pay', 'NHIA (FSSHIP)', 'AXA Mansard Health', 'Hygeia HMO', 'Lagos State Health Scheme (Ilera Eko)']} value={f.insurance} onChange={s('insurance')} />
          {f.insurance !== 'Self-pay' && <Field label="Enrollee ID" value={f.policy} onChange={s('policy')} />}
          <label className="check span-2"><input type="checkbox" required /><span>Patient (or guardian) consented to registration and has been read the privacy notice.</span></label>
          <div className="form__actions"><Button type="submit" icon="UserPlus">Register & issue Health ID</Button></div>
        </form>
      </Card>
    </>
  )
}

export function Screening() {
  const toast = useToast()
  const [rows, api] = useCollection('screenings')
  const [f, setF] = useState({ name: '', type: 'Blood pressure', result: '' })
  return (
    <>
      <PageHeader title="Community Screening" subtitle="BP, malaria RDT, MUAC, pregnancy danger signs, TB symptoms." />
      <Grid>
        <Card title="New screening">
          <form className="form" onSubmit={(e) => {
            e.preventDefault()
            const high = (f.type === 'Blood pressure' && Number(f.result.split('/')[0]) >= 140) || /pos/i.test(f.result) || (f.type === 'MUAC (child)' && parseFloat(f.result) < 12.5)
            api.add({ ...f, flag: high ? 'HIGH' : 'NORMAL', at: new Date().toISOString() })
            toast(high ? 'High risk — create a referral' : 'Saved', high ? 'error' : 'success')
            setF({ name: '', type: f.type, result: '' })
          }}>
            <Field label="Person screened" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Field label="Screening" as="select" options={['Blood pressure', 'Malaria RDT', 'MUAC (child)', 'Pregnancy danger signs', 'TB symptom screen', 'Blood glucose']} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} />
            <Field label="Result" required value={f.result} onChange={(e) => setF({ ...f, result: e.target.value })} placeholder={f.type === 'Blood pressure' ? '140/90' : f.type === 'MUAC (child)' ? '12.0 cm' : 'Positive / Negative'} />
            <Button type="submit">Save</Button>
          </form>
        </Card>
        <Card title="Recent" pad={false}>
          <Table rows={rows} columns={[{ label: 'Name', key: 'name' }, { label: 'Screening', key: 'type' }, { label: 'Result', key: 'result' }, { label: 'Flag', render: (r) => <Badge>{r.flag}</Badge> }]} />
        </Card>
      </Grid>
    </>
  )
}

/* ===================================================================== */
/*                              RECEPTIONIST                             */
/* ===================================================================== */
export function ReceptionDashboard() {
  const { user } = useAuth()
  const [checkins] = useCollection('checkins')
  const [appts] = useCollection('appointments')
  const [adt] = useCollection('admissions')
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="Front Desk" subtitle={user.facility} actions={<><Button variant="ghost" icon="Search" onClick={() => navigate('/reception/search')}>Find patient</Button><Button icon="UserPlus" onClick={() => navigate('/reception/register')}>Register</Button></>} />
      <StatGrid items={[
        { label: 'Checked in', value: checkins.filter((c) => c.status === 'CHECKED_IN').length, icon: 'UserCheck', tone: 'teal' },
        { label: 'Waiting', value: checkins.filter((c) => c.status === 'WAITING').length, icon: 'Clock', tone: 'yellow' },
        { label: "Today's appointments", value: appts.filter((a) => new Date(a.at).toDateString() === new Date().toDateString()).length, icon: 'CalendarDays', tone: 'blue' },
        { label: 'Pending discharges', value: adt.filter((a) => a.type === 'DISCHARGE' && a.by === 'Pending').length, icon: 'Bed', tone: 'pink' },
      ]} />
      <Alert tone="info" icon="Lock">Your role can see demographics, appointments and insurance — not clinical notes or results.</Alert>
      <Card title="Check-in queue" action={<Link to="/reception/checkin">Manage</Link>}>
        <List items={checkins.map((c) => ({ id: c.id, avatar: c.patient, title: c.patient, subtitle: `${c.healthId} · ${c.appt}`, right: <Badge>{c.status}</Badge> }))} />
      </Card>
    </>
  )
}

export function PatientSearch() {
  const [patients] = useCollection('patients')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  return (
    <>
      <PageHeader title="Patient Search" subtitle="Search by name, Health ID, NIN or phone. Duplicate matches are flagged." />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Name, HC-…, NIN or phone" /></div>
      <Card pad={false}>
        <Table rows={filterRows(patients, q, ['name', 'healthId', 'nin', 'phone'])} onRowClick={setSel} columns={[
          { label: 'Patient', render: (r) => <span className="cell-user"><Avatar name={r.name} /><b>{r.name}</b></span> },
          { label: 'Health ID', key: 'healthId' }, { label: 'NIN', render: (r) => r.nin ? `•••••••${r.nin.slice(-4)}` : '—' },
          { label: 'Phone', key: 'phone' }, { label: 'Coverage', key: 'insurance' },
        ]} />
      </Card>
      <Modal open={!!sel} title={sel?.name} onClose={() => setSel(null)}>
        <KeyValue items={[['Health ID', sel?.healthId], ['Age / sex', `${sel?.age} · ${sel?.gender}`], ['Phone', sel?.phone], ['LGA', sel?.lga], ['Coverage', sel?.insurance]]} />
        <Alert tone="warning" icon="Lock">Clinical record restricted for receptionists. Access attempt would be logged.</Alert>
      </Modal>
    </>
  )
}

export function CheckIn() {
  const toast = useToast()
  const [rows, api] = useCollection('checkins')
  return (
    <>
      <PageHeader title="Check-in Queue" />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Patient', render: (r) => <span><b>{r.patient}</b><small className="block muted">{r.healthId}</small></span> }, { label: 'Appointment', key: 'appt' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => (
            <div className="row-actions">
              {r.status === 'EXPECTED' && <Button size="sm" onClick={() => { api.update(r.id, { status: 'WAITING' }); toast('Arrived — insurance verified') }}>Arrived</Button>}
              {r.status === 'WAITING' && <Button size="sm" onClick={() => { api.update(r.id, { status: 'CHECKED_IN' }); toast('Sent to nurse for vitals') }}>Send to nurse</Button>}
            </div>
          ) },
        ]} />
      </Card>
    </>
  )
}

export function ReceptionAppointments() {
  const toast = useToast()
  const [rows, api] = useCollection('appointments')
  const [patients] = useCollection('patients')
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ patient: patients[0]?.name, doctor: 'Dr. Emeka Obi', at: '', type: 'IN_PERSON', reason: '' })
  return (
    <>
      <PageHeader title="Appointments" subtitle="Book, reschedule and cancel on behalf of patients. Reminders go by SMS." actions={<Button icon="CalendarPlus" onClick={() => setOpen(true)}>Book appointment</Button>} />
      <Card pad={false}>
        <Table rows={[...rows].sort((a, b) => a.at.localeCompare(b.at))} columns={[
          { label: 'When', render: (r) => fmtDate(r.at, true) }, { label: 'Patient', key: 'patient' }, { label: 'Doctor', key: 'doctor' },
          { label: 'Type', render: (r) => <Badge>{r.type}</Badge> }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && <Button size="sm" variant="ghost" onClick={() => { api.update(r.id, { status: 'CANCELLED' }); toast('Cancelled — patient notified') }}>Cancel</Button> },
        ]} />
      </Card>
      <Modal open={open} title="Book appointment" onClose={() => setOpen(false)} footer={<Button disabled={!f.at} onClick={() => { const p = patients.find((x) => x.name === f.patient); api.add({ ...f, patientId: p?.id, at: new Date(f.at).toISOString(), status: 'CONFIRMED', specialty: 'Internal Medicine', facility: 'LUTH, Idi-Araba' }); setOpen(false); toast('Booked — SMS reminder scheduled') }}>Book</Button>}>
        <div className="form">
          <Field label="Patient" as="select" options={patients.map((p) => p.name)} value={f.patient} onChange={(e) => setF({ ...f, patient: e.target.value })} />
          <Field label="Doctor" as="select" options={['Dr. Emeka Obi', 'Dr. Chiamaka Eze', 'Dr. Ngozi Adeyemi']} value={f.doctor} onChange={(e) => setF({ ...f, doctor: e.target.value })} />
          <Field label="Date & time" type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} />
          <Field label="Type" as="select" options={['IN_PERSON', 'TELEMEDICINE']} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} />
          <Field label="Reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </div>
      </Modal>
    </>
  )
}

export function Adt({ title = 'Admissions, Discharges & Transfers' }) {
  const toast = useToast()
  const { user } = useAuth()
  const [rows, api] = useCollection('admissions')
  const [patients] = useCollection('patients')
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ patient: patients[0]?.name, type: 'ADMISSION', ward: 'Male Medical Ward', bed: '' })
  return (
    <>
      <PageHeader title={title} actions={<Button icon="Plus" onClick={() => setOpen(true)}>New ADT event</Button>} />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'When', render: (r) => fmtDate(r.at, true) }, { label: 'Patient', key: 'patient' }, { label: 'Event', render: (r) => <Badge>{r.type}</Badge> },
          { label: 'Ward / bed', render: (r) => `${r.ward} · ${r.bed}` }, { label: 'By', key: 'by' },
          { label: '', render: (r) => r.by === 'Pending' && <Button size="sm" onClick={() => { api.update(r.id, { by: user.name }); toast('Discharge completed — bed released for cleaning') }}>Complete</Button> },
        ]} />
      </Card>
      <Modal open={open} title="New ADT event" onClose={() => setOpen(false)} footer={<Button onClick={() => { api.add({ ...f, at: new Date().toISOString(), by: user.name }); setOpen(false); toast('Saved') }}>Save</Button>}>
        <div className="form">
          <Field label="Patient" as="select" options={patients.map((p) => p.name)} value={f.patient} onChange={(e) => setF({ ...f, patient: e.target.value })} />
          <Field label="Event" as="select" options={['ADMISSION', 'DISCHARGE', 'TRANSFER']} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} />
          <Field label="Ward" as="select" options={['Male Medical Ward', 'Female Medical Ward', 'Maternity Ward', 'Paediatrics Ward']} value={f.ward} onChange={(e) => setF({ ...f, ward: e.target.value })} />
          <Field label="Bed" value={f.bed} onChange={(e) => setF({ ...f, bed: e.target.value })} placeholder="e.g. MMW-08" />
        </div>
      </Modal>
    </>
  )
}

export function Eligibility() {
  const [enrollees] = useCollection('enrollees')
  const [id, setId] = useState('')
  const [res, setRes] = useState(undefined)
  return (
    <>
      <PageHeader title="Insurance Eligibility Check" subtitle="Real-time check with NHIA and partner HMOs before the visit." />
      <Card>
        <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setRes(enrollees.find((x) => x.id.toLowerCase() === id.trim().toLowerCase() || x.name.toLowerCase() === id.trim().toLowerCase()) ?? null) }}>
          <Field label="Payer" as="select" options={['AXA Mansard Health', 'NHIA (FSSHIP)', 'Hygeia HMO', 'Lagos State Health Scheme (Ilera Eko)']} />
          <Field label="Enrollee ID or name" value={id} onChange={(e) => setId(e.target.value)} placeholder="AXA-GLD-001928" />
          <Button type="submit" icon="ShieldCheck">Check</Button>
        </form>
        {res === null && <Alert tone="danger" title="Not found">Ask the patient for their enrollee card, or register as self-pay.</Alert>}
        {res && (
          <>
            <Alert tone={res.status === 'ACTIVE' ? 'success' : 'warning'} title={`${res.name} — ${res.status === 'ACTIVE' ? 'Eligible' : 'Cover lapsed'}`}>{res.plan} plan · expires {res.expires}</Alert>
            <KeyValue items={[['Enrollee ID', res.id], ['Plan', res.plan], ['Dependants', res.dependants], ['Benefit used', `${res.utilization}%`]]} />
          </>
        )}
        <p className="muted">Try <code>AXA-GLD-001928</code> or <code>AXA-GLD-002288</code>.</p>
      </Card>
    </>
  )
}
