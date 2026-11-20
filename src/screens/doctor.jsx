import { useEffect, useState } from 'react'
import { api as request } from '../lib/api.js'
import { docId, docName, openFile, uploadFile } from '../lib/files.js'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ROLES, can } from '../config/roles.js'
import { db, fmtDate, fmtTime, isToday, naira, useCollection } from '../lib/store.js'
import {
  Alert, Avatar, Badge, Button, Card, EmptyState, Field, Grid, Icon, KeyValue, List, Modal, PageHeader,
  SearchInput, StatGrid, Table, Tabs, Timeline, filterRows, useToast,
} from '../components/ui/index.jsx'

const BASE = '/doctor'
const Back = ({ to, label }) => <Link to={to} className="back"><Icon name="ChevronLeft" size={16} /> {label}</Link>
const logAccess = (user, action, resource) =>
  db.add('auditLog', { at: new Date().toISOString(), actor: user.name, role: user.role, action, resource, facility: user.facility ?? '—' })

/* ================= Dashboard ================= */
export function DoctorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appts] = useCollection('appointments')
  const [inbasket] = useCollection('inBasket')
  const [labs] = useCollection('labOrders')
  const mine = appts.filter((a) => a._doctorId === user.id)
  const today = mine.filter((a) => isToday(a.at)).sort((a, b) => a.at.localeCompare(b.at))
  return (
    <>
      <PageHeader title={`Good day, ${user.name}`} subtitle={`${user.specialty ?? ''} · ${user.facility ?? ''}`} actions={<Button icon="Video" onClick={() => navigate(`${BASE}/telemedicine`)}>Telemedicine queue</Button>} />
      <StatGrid items={[
        { label: "Today's patients", value: today.length, icon: 'Users', tone: 'teal' },
        { label: 'In-basket', value: inbasket.length, hint: `${inbasket.filter((i) => i.urgency === 'urgent').length} urgent`, icon: 'Inbox', tone: 'pink' },
        { label: 'Results to review', value: labs.filter((l) => l._doctorId === user.id && l.status === 'COMPLETED').length, icon: 'FlaskConical', tone: 'blue' },
        { label: 'Pending confirmations', value: mine.filter((a) => a.status === 'PENDING').length, icon: 'CalendarClock', tone: 'yellow' },
      ]} />
      <Grid>
        <Card title="Today's schedule" action={<Link to={`${BASE}/schedule`}>Full schedule</Link>}>
          <List items={today.map((a) => ({
            id: a.id, avatar: a.patient, title: `${fmtTime(a.at)} · ${a.patient}`, subtitle: a.reason,
            right: <><Badge>{a.type}</Badge> <Badge>{a.status}</Badge></>,
            onClick: () => navigate(`${BASE}/patients/${a.patientId}`),
          }))} empty="No appointments today." />
        </Card>
        <Card title="In-basket" action={<Link to={`${BASE}/inbasket`}>Open</Link>}>
          <List items={inbasket.slice(0, 5).map((i) => ({
            id: i.id, icon: { result: 'FlaskConical', message: 'MessageSquare', refill: 'Repeat' }[i.type] ?? 'Inbox', tone: i.urgency === 'urgent' ? 'red' : 'teal',
            title: i.title, subtitle: i.subtitle, right: <small>{i.timestamp}</small>, onClick: () => navigate(`${BASE}/inbasket`),
          }))} />
        </Card>
      </Grid>
    </>
  )
}

/* ================= In-basket ================= */
export function InBasket() {
  const navigate = useNavigate()
  const toast = useToast()
  const [items, api] = useCollection('inBasket')
  const [tab, setTab] = useState('all')
  const rows = items.filter((i) => tab === 'all' || i.type === tab).sort((a, b) => (a.urgency === 'urgent' ? -1 : 1) - (b.urgency === 'urgent' ? -1 : 1))
  return (
    <>
      <PageHeader title="In-Basket" subtitle="Results, messages and refill requests in one queue, urgent first." />
      <Tabs tabs={[{ value: 'all', label: `All (${items.length})` }, { value: 'result', label: 'Results' }, { value: 'message', label: 'Messages' }, { value: 'refill', label: 'Refills' }]} value={tab} onChange={setTab} />
      <Card pad={false}>
        <Table rows={rows} empty="In-basket clear 🎉" columns={[
          { label: 'Priority', render: (r) => <Badge>{r.urgency.toUpperCase()}</Badge>, width: 100 },
          { label: 'Item', render: (r) => <span><b>{r.title}</b><small className="block muted">{r.subtitle}</small></span> },
          { label: 'Received', key: 'timestamp' },
          { label: '', render: (r) => (
            <div className="row-actions">
              <Button size="sm" variant="ghost" onClick={() => navigate(`${BASE}/patients/${r.patientId}`)}>Chart</Button>
              {r.type === 'refill' && <Button size="sm" onClick={() => { api.remove(r.id); toast('Refill approved and sent to pharmacy') }}>Approve</Button>}
              {r.type === 'message' && <Button size="sm" onClick={() => navigate(`${BASE}/messages`)}>Reply</Button>}
              {r.type === 'result' && <Button size="sm" onClick={() => { api.remove(r.id); toast('Result acknowledged & released to patient') }}>Acknowledge</Button>}
            </div>
          ) },
        ]} />
      </Card>
    </>
  )
}

/* ================= Schedule & availability ================= */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export function Schedule() {
  const { user } = useAuth()
  const toast = useToast()
  const [appts, api] = useCollection('appointments')
  // Weekly availability lives in the shared Availability table, so patients
  // see the same open slots on the website and in the mobile app.
  const emptyWeek = () => Object.fromEntries(DAYS.map((d) => [d, []]))
  const [avail, setAvail] = useState(emptyWeek)
  const [savingAvail, setSavingAvail] = useState(false)
  const loadAvail = () =>
    request('/doctors/me/availability').then((slots) => {
      const week = emptyWeek()
      slots.forEach((s) => (week[s.day] ??= []).push(s.timeRange))
      setAvail(week)
    }, () => {})
  useEffect(() => {
    if (user.role === 'DOCTOR') loadAvail()
  }, [])
  const saveAvail = async () => {
    setSavingAvail(true)
    try {
      for (const d of DAYS) {
        await request(`/doctors/me/availability/day/${encodeURIComponent(d)}`, { method: 'DELETE' })
        for (const timeRange of avail[d]) await request('/doctors/me/availability', { method: 'POST', body: { day: d, timeRange } })
      }
      await loadAvail()
      toast('Availability saved')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSavingAvail(false)
    }
  }
  const [tab, setTab] = useState('Appointments')
  const mine = appts.filter((a) => a._doctorId === user.id).sort((a, b) => a.at.localeCompare(b.at))
  return (
    <>
      <PageHeader title="Schedule" />
      <Tabs tabs={['Appointments', 'Availability']} value={tab} onChange={setTab} />
      {tab === 'Appointments' ? (
        <Card pad={false}>
          <Table rows={mine} columns={[
            { label: 'When', render: (r) => fmtDate(r.at, true) },
            { label: 'Patient', render: (r) => <Link to={`${BASE}/patients/${r.patientId}`}><b>{r.patient}</b></Link> },
            { label: 'Reason', key: 'reason' },
            { label: 'Type', render: (r) => <Badge>{r.type}</Badge> },
            { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
            { label: '', render: (r) => r.status === 'PENDING' && (
              <div className="row-actions">
                <Button size="sm" onClick={() => { api.update(r.id, { status: 'CONFIRMED' }); toast('Confirmed — patient notified') }}>Confirm</Button>
                <Button size="sm" variant="ghost" onClick={() => api.update(r.id, { status: 'CANCELLED' })}>Decline</Button>
              </div>
            ) },
          ]} />
        </Card>
      ) : (
        <Card title="Weekly availability" action={<Button size="sm" disabled={savingAvail} onClick={saveAvail}>Save</Button>}>
          <div className="avail">
            {DAYS.map((d) => (
              <div key={d} className="avail__row">
                <b>{d}</b>
                <div>
                  {avail[d].length ? avail[d].map((s) => (
                    <span key={s} className="chip">{s} <button aria-label={`Remove ${s}`} onClick={() => setAvail({ ...avail, [d]: avail[d].filter((x) => x !== s) })}><Icon name="X" size={12} /></button></span>
                  )) : <small className="muted">Unavailable</small>}
                </div>
                <Button size="sm" variant="ghost" icon="Plus" onClick={() => { const range = window.prompt(`Add a time slot for ${d}`, '09:00–12:00'); if (range?.trim()) setAvail({ ...avail, [d]: [...avail[d], range.trim()] }) }}>Add</Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

/* ================= Patients & chart ================= */
export function DoctorPatients({ base = BASE }) {
  const navigate = useNavigate()
  const [patients] = useCollection('patients')
  const [q, setQ] = useState('')
  return (
    <>
      <PageHeader title="Patients" subtitle="Patients under your care. Search by name, Health ID or NIN." />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search patients" /></div>
      <Card pad={false}>
        <Table rows={filterRows(patients, q, ['name', 'healthId', 'nin', 'phone'])} onRowClick={(r) => navigate(`${base}/patients/${r.id}`)} columns={[
          { label: 'Patient', render: (r) => <span className="cell-user"><Avatar name={r.name} /><span><b>{r.name}</b><small>{r.healthId}</small></span></span> },
          { label: 'Age / Sex', render: (r) => `${r.age} · ${r.gender}` },
          { label: 'Problems', render: (r) => (r.problems ?? []).filter((p) => p.status === 'Active').map((p) => p.name).join(', ') || '—' },
          { label: 'Allergies', render: (r) => r.allergies?.length ? <Badge tone="red">{r.allergies.join(', ')}</Badge> : '—' },
          { label: 'Cover', key: 'insurance' },
        ]} />
      </Card>
    </>
  )
}

/* Shared chart — used by doctors and nurses. Permissions decide what shows. */
export function PatientChart({ base = BASE }) {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [patients] = useCollection('patients')
  const [labs] = useCollection('labOrders')
  const [rx] = useCollection('prescriptions')
  const [notes, notesApi] = useCollection('clinicalNotes')
  const [vitals] = useCollection('vitals')
  const [tab, setTab] = useState('Summary')
  const [glass, setGlass] = useState(false)
  const [reason, setReason] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const p = patients.find((x) => x.id === id)
  if (!p) return <EmptyState text="Patient not found." />

  const inCare = user.role !== 'DOCTOR' || ['pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-5'].includes(p.id) || unlocked
  const canNotes = can(user.role, 'clinical.notes.view')

  if (!inCare) {
    return (
      <>
        <PageHeader back={<Back to={`${base}/patients`} label="Patients" />} title={p.name} subtitle={p.healthId} />
        <Alert tone="warning" title="This patient is not under your care">You can only open charts for patients you're treating. In an emergency, use break-glass access — it's logged and reviewed by the Data Protection Officer.</Alert>
        <Button variant="danger" icon="Siren" onClick={() => setGlass(true)}>Break-glass access</Button>
        <Modal open={glass} title="Emergency break-glass access" onClose={() => setGlass(false)} footer={<Button variant="danger" disabled={reason.length < 10} onClick={() => {
          db.add('breakGlass', { actor: user.name, patient: p.name, reason, at: new Date().toISOString(), status: 'PENDING_REVIEW' })
          logAccess(user, 'BREAK_GLASS', `Chart — ${p.name} (${p.healthId})`)
          setUnlocked(true); setGlass(false); toast('Access granted for 4 hours — logged', 'error')
        }}>Unlock chart</Button>}>
          <Field label="Clinical reason (required)" as="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Unconscious patient in ED, need allergy and medication history" />
        </Modal>
      </>
    )
  }

  const myNotes = notes.filter((n) => n.patientId === p.id)
  return (
    <>
      <PageHeader back={<Back to={`${base}/patients`} label="Patients" />} title={p.name} subtitle={`${p.healthId} · ${p.age} yrs · ${p.gender} · ${p.insurance}`}
        actions={user.role === 'DOCTOR' && (
          <>
            <Button variant="ghost" icon="FilePen" onClick={() => navigate(`${BASE}/patients/${p.id}/note`)}>Note</Button>
            <Button variant="ghost" icon="FlaskConical" onClick={() => navigate(`${BASE}/patients/${p.id}/order`)}>Order</Button>
            <Button variant="ghost" icon="Send" onClick={() => navigate(`${BASE}/referrals?patient=${p.id}`)}>Refer</Button>
            <Button icon="Pill" onClick={() => navigate(`${BASE}/patients/${p.id}/prescribe`)}>Prescribe</Button>
          </>
        )} />
      {p.allergies?.length > 0 && <Alert tone="danger" title={`Allergies: ${p.allergies.join(', ')}`} />}
      {p.guardian && <Alert tone="info">Minor — guardian: {p.guardian}. Consent for treatment given by guardian.</Alert>}
      <Tabs tabs={['Summary', 'Notes', 'Orders & Results', 'Medications']} value={tab} onChange={setTab} />
      {tab === 'Summary' && (
        <Grid>
          <Card title="Problem list">
            <List items={(p.problems ?? []).map((x) => ({ id: x.id, icon: 'Activity', title: x.name, subtitle: `Since ${x.since}`, right: <Badge>{x.status.toUpperCase()}</Badge> }))} empty="No problems recorded." />
          </Card>
          <Card title="Demographics">
            <KeyValue items={[['Health ID', p.healthId], ['NIN', p.nin || 'Not captured'], ['Phone', p.phone], ['LGA', p.lga], ['Coverage', p.insurance]]} />
          </Card>
          <Card title="Recent encounters">
            {canNotes ? <Timeline items={(p.encounters ?? []).map((e) => ({ title: `${e.date} · ${e.type}`, subtitle: e.note, done: true }))} /> : <Alert tone="warning">Clinical notes are restricted for your role.</Alert>}
          </Card>
          <Card title="Latest vitals">
            {(() => {
              const v = vitals.filter((x) => x.patientId === p.id || x.patient === p.name).sort((a, b) => String(b.at).localeCompare(String(a.at)))[0]
              return v
                ? <KeyValue items={[['BP', v.bp ? `${v.bp} mmHg` : '—'], ['Pulse', v.pulse ? `${v.pulse} bpm` : '—'], ['Temp', v.temp ? `${v.temp} °C` : '—'], ['SpO₂', v.spo2 ? `${v.spo2}%` : '—'], ['Recorded', `${fmtDate(v.at, true)} by ${v.by ?? '—'}`]]} />
                : <p className="muted">No vitals recorded yet.</p>
            })()}
          </Card>
        </Grid>
      )}
      {tab === 'Notes' && (
        <Card>
          {canNotes ? (
            <Timeline items={[...myNotes.map((n) => ({ title: `${fmtDate(n.at, true)} · ${n.author}`, subtitle: `${n.subjective ?? ''} ${n.assessment ? `— ${n.assessment}` : ''} ${n.plan ? `Plan: ${n.plan}` : ''}`, done: true })), ...(p.encounters ?? []).map((e) => ({ title: `${e.date} · ${e.type}`, subtitle: e.note, done: true }))]} />
          ) : <Alert tone="warning">Restricted.</Alert>}
          {user.role === 'NURSE' && (
            <form className="form" onSubmit={(e) => { e.preventDefault(); notesApi.add({ patientId: p.id, author: user.name, at: new Date().toISOString(), subjective: e.target.note.value }); e.target.reset(); toast('Nursing note saved') }}>
              <Field label="Add nursing note" as="textarea" name="note" required />
              <Button type="submit">Save note</Button>
            </form>
          )}
        </Card>
      )}
      {tab === 'Orders & Results' && (
        <Card pad={false}>
          <Table rows={labs.filter((l) => l.patientId === p.id)} empty="No orders." columns={[
            { label: 'Test', key: 'test' }, { label: 'Ordered', render: (r) => fmtDate(r.orderedAt, true) }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
            { label: 'Result', render: (r) => r.result ? <span className={r.result.flag === 'HIGH' ? 'text-danger' : ''}>{r.result.summary}</span> : '—' },
          ]} />
        </Card>
      )}
      {tab === 'Medications' && (
        <Card pad={false}>
          <Table rows={[...(p.medications ?? []).map((m) => ({ ...m, status: 'ACTIVE' })), ...rx.filter((r) => r.patientId === p.id).map((r) => ({ id: r.id, name: r.drug, dosage: r.dosage, frequency: r.frequency, status: r.status }))]} columns={[
            { label: 'Medication', key: 'name' }, { label: 'Dose', key: 'dosage' }, { label: 'Frequency', key: 'frequency' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          ]} />
        </Card>
      )}
    </>
  )
}

export function NewNote() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [patients] = useCollection('patients')
  const [, api] = useCollection('clinicalNotes')
  const p = patients.find((x) => x.id === id)
  const [f, setF] = useState({ template: 'SOAP — General', subjective: '', objective: '', assessment: '', icd: '', plan: '', followUp: '2 weeks' })
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <>
      <PageHeader back={<Back to={`${BASE}/patients/${id}`} label={p?.name} />} title="Clinical note" subtitle={p?.name} />
      <Card>
        <form className="form form--2" onSubmit={(e) => { e.preventDefault(); api.add({ patientId: id, author: user.name, at: new Date().toISOString(), ...f }); toast('Note signed and saved to chart'); navigate(`${BASE}/patients/${id}`) }}>
          <Field label="Template" as="select" options={['SOAP — General', 'Antenatal visit', 'Hypertension review', 'Diabetes review', 'Telemedicine consult']} value={f.template} onChange={s('template')} />
          <Field label="Diagnosis (ICD-10)" placeholder="e.g. I10 Essential hypertension" value={f.icd} onChange={s('icd')} />
          <Field label="Subjective (history)" as="textarea" required value={f.subjective} onChange={s('subjective')} className="span-2" />
          <Field label="Objective (exam, vitals)" as="textarea" value={f.objective} onChange={s('objective')} className="span-2" />
          <Field label="Assessment" as="textarea" value={f.assessment} onChange={s('assessment')} />
          <Field label="Plan" as="textarea" value={f.plan} onChange={s('plan')} />
          <Field label="Follow-up" as="select" options={['None', '1 week', '2 weeks', '1 month', '3 months']} value={f.followUp} onChange={s('followUp')} />
          <div className="form__actions"><Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button><Button type="submit">Sign & save</Button></div>
        </form>
      </Card>
    </>
  )
}

export function NewOrder() {
  const [facilityRows] = useCollection('facilities')
  const labFacilities = facilityRows.filter((x) => x.status === 'VERIFIED' && ['Laboratory', 'Imaging centre'].includes(x.type)).map((x) => x.name)
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [patients] = useCollection('patients')
  const [, api] = useCollection('labOrders')
  const [, img] = useCollection('imagingStudies')
  const p = patients.find((x) => x.id === id)
  const [f, setF] = useState({ kind: 'Lab', test: 'Full Blood Count', priority: 'ROUTINE', lab: 'Synlab Diagnostics, Ikeja', notes: '' })
  const tests = f.kind === 'Lab' ? ['Full Blood Count', 'Malaria RDT', 'HbA1c', 'Basic Metabolic Panel', 'Lipid Profile', 'Urinalysis', 'INR / PT', 'Widal'] : ['Chest X-Ray (PA)', 'Abdominal Ultrasound', 'Obstetric Ultrasound', 'CT Head', 'MRI Lumbar Spine', 'ECG']
  return (
    <>
      <PageHeader back={<Back to={`${BASE}/patients/${id}`} label={p?.name} />} title="New order" subtitle={p?.name} />
      <Card>
        <form className="form form--2" onSubmit={(e) => {
          e.preventDefault()
          if (f.kind === 'Lab') api.add({ patientId: id, patient: p.name, test: f.test, orderedBy: user.name, priority: f.priority, status: 'ORDERED', sample: 'PENDING', orderedAt: new Date().toISOString(), released: false })
          else img.add({ patientId: id, patient: p.name, study: f.test, modality: f.test.split(' ')[0], status: 'SCHEDULED', at: new Date().toISOString(), report: '' })
          toast(`${f.test} ordered — sent to ${f.lab}`)
          navigate(`${BASE}/patients/${id}`)
        }}>
          <Field label="Order type" as="select" options={['Lab', 'Imaging']} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value, test: e.target.value === 'Lab' ? 'Full Blood Count' : 'Chest X-Ray (PA)' })} />
          <Field label="Test" as="select" options={tests} value={f.test} onChange={(e) => setF({ ...f, test: e.target.value })} />
          <Field label="Priority" as="select" options={['ROUTINE', 'URGENT', 'STAT']} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} />
          <Field label="Perform at" as="select" options={labFacilities.length ? labFacilities : [f.lab].filter(Boolean)} value={f.lab} onChange={(e) => setF({ ...f, lab: e.target.value })} />
          <Field label="Clinical notes for lab" as="textarea" className="span-2" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <div className="form__actions"><Button type="submit">Place order</Button></div>
        </form>
      </Card>
    </>
  )
}

export function Prescribe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [patients] = useCollection('patients')
  const [formulary] = useCollection('drugFormulary')
  const [, api] = useCollection('prescriptions')
  const p = patients.find((x) => x.id === id)
  const [drugId, setDrugId] = useState(formulary[0]?.id)
  const drug = formulary.find((d) => d.id === drugId)
  const [f, setF] = useState({ dosage: drug?.dosageOptions[0], frequency: drug?.frequencyOptions[0], qty: 30, pharmacy: 'HealthPlus Pharmacy, Yaba', override: false })
  if (!p || !drug) return <EmptyState text="Not found." />
  const current = (p.medications ?? []).map((m) => m.name)
  const interactions = drug.interactsWith.filter((x) => current.includes(x))
  const allergy = drug.allergyFlags.filter((x) => (p.allergies ?? []).includes(x))
  const blocked = (interactions.length || allergy.length) && !f.override
  return (
    <>
      <PageHeader back={<Back to={`${BASE}/patients/${id}`} label={p.name} />} title="e-Prescription" subtitle={`${p.name} · current meds: ${current.join(', ') || 'none'}`} />
      <Card>
        <div className="form form--2">
          <Field label="Medication" as="select" options={formulary.map((d) => ({ value: d.id, label: d.name }))} value={drugId} onChange={(e) => { const d = formulary.find((x) => x.id === e.target.value); setDrugId(d.id); setF({ ...f, dosage: d.dosageOptions[0], frequency: d.frequencyOptions[0], override: false }) }} />
          <Field label="Dose" as="select" options={drug.dosageOptions} value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} />
          <Field label="Frequency" as="select" options={drug.frequencyOptions} value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} />
          <Field label="Quantity" type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
          <Field label="Send to pharmacy" as="select" options={['HealthPlus Pharmacy, Yaba', 'MedPlus, Ikeja', 'Patient chooses']} value={f.pharmacy} onChange={(e) => setF({ ...f, pharmacy: e.target.value })} />
        </div>
        {allergy.length > 0 && <Alert tone="danger" title={`Allergy alert: patient is allergic to ${allergy.join(', ')}`} />}
        {interactions.length > 0 && <Alert tone="warning" title={`Interaction: ${drug.name} interacts with ${interactions.join(', ')}`}>Consider an alternative or document why you're overriding.</Alert>}
        {(allergy.length > 0 || interactions.length > 0) && (
          <label className="check"><input type="checkbox" checked={f.override} onChange={(e) => setF({ ...f, override: e.target.checked })} /><span>I've reviewed the alert and want to prescribe anyway (logged).</span></label>
        )}
        <div className="form__actions">
          <Button disabled={blocked} onClick={() => {
            api.add({ patientId: p.id, patient: p.name, drug: drug.name, dosage: f.dosage, frequency: f.frequency, qty: Number(f.qty), doctor: user.name, status: 'NEW', at: new Date().toISOString(), pharmacy: f.pharmacy, interaction: interactions.length ? `Interacts with ${interactions.join(', ')}` : null })
            toast('Prescription signed and sent')
            navigate(`${BASE}/patients/${p.id}`)
          }}>Sign & send</Button>
        </div>
      </Card>
    </>
  )
}

/* ================= Telemedicine ================= */
export function TelemedicineQueue() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appts] = useCollection('appointments')
  const rows = appts.filter((a) => a._doctorId === user.id && a.type === 'TELEMEDICINE' && a.status === 'CONFIRMED')
  return (
    <>
      <PageHeader title="Telemedicine" subtitle="Patients in your virtual waiting room." />
      <Card pad={false}>
        <Table rows={rows} empty="No one is waiting." columns={[
          { label: 'Patient', render: (r) => <span className="cell-user"><Avatar name={r.patient} /><b>{r.patient}</b></span> },
          { label: 'Time', render: (r) => fmtDate(r.at, true) },
          { label: 'Reason', key: 'reason' },
          { label: 'Pre-checks', render: () => <span className="row-actions"><Badge tone="green">Network</Badge><Badge tone="green">Camera</Badge><Badge tone="amber">Questionnaire</Badge></span> },
          { label: '', render: (r) => <Button size="sm" icon="Video" onClick={() => navigate(`${BASE}/telemedicine/${r.id}`)}>Start</Button> },
        ]} />
      </Card>
    </>
  )
}

export function DoctorConsult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [appts, api] = useCollection('appointments')
  const a = appts.find((x) => x.id === id)
  const [note, setNote] = useState('')
  const [escalate, setEscalate] = useState(false)
  const [escReason, setEscReason] = useState('')
  if (!a) return <EmptyState text="Not found." />
  return (
    <div className="call">
      <div className="call__video">
        <div className="call__remote"><Avatar name={a.patient} size={96} /><b>{a.patient}</b><small>Identity confirmed · Telemedicine consent ✓</small></div>
        <div className="call__self">You</div>
        <div className="call__controls">
          <button className="icon-btn" aria-label="Microphone"><Icon name="Mic" /></button>
          <button className="icon-btn" aria-label="Camera"><Icon name="Video" /></button>
          <button className="icon-btn is-end" aria-label="End call" onClick={() => { api.update(a.id, { status: 'COMPLETED' }); db.add('clinicalNotes', { patientId: a.patientId, author: a.doctor, at: new Date().toISOString(), subjective: note, assessment: 'Telemedicine consult' }); toast('Visit completed — note saved'); navigate(`${BASE}/telemedicine`) }}><Icon name="PhoneOff" /></button>
        </div>
      </div>
      <aside className="call__side">
        <h3>{a.patient}</h3>
        <p className="muted">{a.reason}</p>
        <Field label="Consultation note" as="textarea" rows={8} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="row-actions">
          <Button size="sm" variant="ghost" icon="Pill" onClick={() => navigate(`${BASE}/patients/${a.patientId}/prescribe`)}>Prescribe</Button>
          <Button size="sm" variant="ghost" icon="FlaskConical" onClick={() => navigate(`${BASE}/patients/${a.patientId}/order`)}>Order</Button>
        </div>
        <Button variant="danger" icon="Siren" onClick={() => setEscalate(true)}>Needs in-person / emergency care</Button>
        <Modal open={escalate} title="Escalate to physical care" onClose={() => setEscalate(false)} footer={<Button variant="danger" onClick={() => { api.update(a.id, { status: 'ESCALATED', escalation: { reason: escReason, at: new Date().toISOString(), by: user.name } }); logAccess(user, 'ESCALATE', `Telemedicine ${a.id} — ${a.patient}: ${escReason || 'no reason given'}`); setEscalate(false); toast('Escalation saved — patient told to go to the nearest emergency department', 'error') }}>Send escalation</Button>}>
          <p>The patient will see: <b>“This patient requires immediate physical/emergency care.”</b> with directions to the nearest emergency department and the 112 line.</p>
          <Field label="Reason" as="textarea" value={escReason} onChange={(e) => setEscReason(e.target.value)} />
        </Modal>
      </aside>
    </div>
  )
}

/* ================= Prescriptions, orders, referrals ================= */
export function DoctorPrescriptions() {
  const { user } = useAuth()
  const [rx] = useCollection('prescriptions')
  return (
    <>
      <PageHeader title="e-Prescriptions" subtitle="Everything you've prescribed and its dispensing status." />
      <Card pad={false}>
        <Table rows={rx.filter((r) => r._doctorId === user.id)} columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Medication', render: (r) => `${r.drug} ${r.dosage}` }, { label: 'Frequency', key: 'frequency' },
          { label: 'Pharmacy', key: 'pharmacy' }, { label: 'Issued', render: (r) => fmtDate(r.at, true) }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
    </>
  )
}

export function DoctorOrders() {
  const { user } = useAuth()
  const [labs] = useCollection('labOrders')
  const [img] = useCollection('imagingStudies')
  const [tab, setTab] = useState('Lab')
  return (
    <>
      <PageHeader title="Orders & Results" />
      <Tabs tabs={['Lab', 'Imaging']} value={tab} onChange={setTab} />
      <Card pad={false}>
        {tab === 'Lab' ? (
          <Table rows={labs.filter((l) => l._doctorId === user.id)} columns={[
            { label: 'Patient', key: 'patient' }, { label: 'Test', key: 'test' }, { label: 'Priority', render: (r) => <Badge>{r.priority}</Badge> },
            { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }, { label: 'Result', render: (r) => r.result?.summary ?? '—' },
          ]} />
        ) : (
          <Table rows={img} columns={[{ label: 'Patient', key: 'patient' }, { label: 'Study', key: 'study' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }, { label: 'Report', render: (r) => r.report || '—' }]} />
        )}
      </Card>
    </>
  )
}

export function Referrals({ base = BASE }) {
  const { user } = useAuth()
  const toast = useToast()
  const [rows, api] = useCollection('referrals')
  const [patients] = useCollection('patients')
  const preselect = new URLSearchParams(window.location.search).get('patient')
  const [open, setOpen] = useState(Boolean(preselect))
  const [f, setF] = useState({ patient: patients.find((p) => p.id === preselect)?.name ?? patients[0]?.name, toSpecialty: 'Cardiology', toFacility: '', reason: '' })
  const [tab, setTab] = useState('Outgoing')
  const list = rows.filter((r) => (tab === 'Outgoing' ? r._owner === user.id : r._owner !== user.id))
  return (
    <>
      <PageHeader title="Referrals" subtitle="Structured referrals with a summary attached — tracked to outcome." actions={<Button icon="Plus" onClick={() => setOpen(true)}>New referral</Button>} />
      <Tabs tabs={['Outgoing', 'Incoming']} value={tab} onChange={setTab} />
      <Card pad={false}>
        <Table rows={list} empty="No referrals." columns={[
          { label: 'Patient', key: 'patient' }, { label: tab === 'Outgoing' ? 'To' : 'From', render: (r) => tab === 'Outgoing' ? `${r.toSpecialty} · ${r.toFacility}` : r.from },
          { label: 'Reason', key: 'reason' }, { label: 'Date', render: (r) => fmtDate(r.at) }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          ...(tab === 'Incoming' ? [{ label: '', render: (r) => r.status === 'PENDING' && <Button size="sm" onClick={() => { api.update(r.id, { status: 'SCHEDULED' }); toast('Referral accepted — patient will be contacted') }}>Accept</Button> }] : []),
        ]} />
      </Card>
      <Modal open={open} title="New referral" onClose={() => setOpen(false)} footer={<Button onClick={() => { api.add({ ...f, from: `${user.name}${user.role === 'CHW' ? ' (CHW)' : ''}`, status: 'PENDING', at: new Date().toISOString() }); setOpen(false); toast('Referral sent with chart summary') }}>Send referral</Button>}>
        <div className="form">
          <Field label="Patient" as="select" options={patients.map((p) => p.name)} value={f.patient} onChange={(e) => setF({ ...f, patient: e.target.value })} />
          <Field label="Specialty" as="select" options={['Cardiology', 'Nephrology', 'Obstetrics', 'Paediatrics', 'Dermatology', 'Neurology', 'General Surgery', 'Primary care']} value={f.toSpecialty} onChange={(e) => setF({ ...f, toSpecialty: e.target.value })} />
          <Field label="Facility" value={f.toFacility} onChange={(e) => setF({ ...f, toFacility: e.target.value })} />
          <Field label="Reason & summary" as="textarea" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </div>
      </Modal>
      {base !== BASE && null}
    </>
  )
}

/* ================= Earnings & credentials ================= */
export function Earnings() {
  const [rows] = useCollection('earnings')
  const [payout] = useCollection('payoutAccounts')
  const acct = payout[0]
  const gross = rows.reduce((s, r) => s + r.gross, 0)
  const fee = rows.reduce((s, r) => s + r.fee, 0)
  return (
    <>
      <PageHeader title="Earnings" subtitle="Patient payments are collected by a licensed PSP and settled to your bank weekly." />
      <StatGrid items={[
        { label: 'Gross this month', value: naira(gross), icon: 'Banknote', tone: 'teal' },
        { label: 'Platform fee (10%)', value: naira(fee), icon: 'Percent', tone: 'pink' },
        { label: 'Your payout', value: naira(gross - fee), icon: 'Wallet', tone: 'yellow' },
        { label: 'Next settlement', value: 'Friday', icon: 'CalendarDays', tone: 'blue' },
      ]} />
      <Card pad={false}>
        <Table rows={rows} columns={[{ label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Patient', key: 'patient' }, { label: 'Service', key: 'service' }, { label: 'Gross', render: (r) => naira(r.gross) }, { label: 'Fee', render: (r) => naira(r.fee) }, { label: 'Net', render: (r) => naira(r.gross - r.fee) }]} />
      </Card>
      <Card title="Payout account">
        {acct ? <KeyValue items={[['Bank', acct.bank], ['Account', `•••• ${acct.accountLast4}`], ['Settlement partner', acct.partner]]} /> : <p className="muted">No payout account set up yet.</p>}
      </Card>
    </>
  )
}

export function Credentials() {
  const { user } = useAuth()
  const toast = useToast()
  const [verifications, vApi] = useCollection('verifications')
  const v = verifications.find((x) => x.userId === user.id)
  const status = v?.status === 'APPROVED' ? 'VERIFIED' : v?.status ?? 'NOT_SUBMITTED'
  return (
    <>
      <PageHeader title="Credentials & Verification" />
      {status === 'VERIFIED'
        ? <Alert tone="success" title="Verified practitioner">Your {ROLES[user.role].regulator} licence was checked against the official register.</Alert>
        : <Alert tone="warning" title="Not yet verified">Your {ROLES[user.role].regulator} licence hasn't been approved yet.</Alert>}
      <Grid>
        <Card title="Licence">
          <KeyValue items={[['Regulator', ROLES[user.role].regulator], ['Number', user.license], ['Specialty', user.specialty], ['Valid until', v?.validUntil ? fmtDate(v.validUntil) : '—'], ['Status', <Badge key="s">{status}</Badge>]]} />
          <label className="b b--ghost">
            <Icon name="Upload" size={16} /> Upload renewed licence
            <input type="file" accept=".pdf,image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file || !v) return toast(v ? 'No file chosen' : 'No licence review on file — contact your moderator', 'error'); uploadFile(file).then((f) => { vApi.update(v.id, { docs: [...(v.docs ?? []), { id: f.id, name: f.name, uploadedAt: new Date().toISOString() }] }); toast('Uploaded — your moderator will review it') }, (err) => toast(err.message, 'error')) }} />
          </label>
        </Card>
        <Card title="Documents on file">
          <List items={(v?.docs ?? []).map((d) => ({ id: docId(d) ?? docName(d), icon: 'FileCheck', title: docName(d), onClick: docId(d) ? () => openFile(docId(d)).catch((err) => toast(err.message, 'error')) : undefined, right: <Badge>{status === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}</Badge> }))} empty="No documents on file." />
        </Card>
      </Grid>
    </>
  )
}
