import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { api as request } from '../lib/api.js'
import { downloadCsv } from '../lib/exportCsv.js'
import { fmtDate, fmtTime, naira, useCollection } from '../lib/store.js'
import {
  Alert, Avatar, Badge, Button, Card, EmptyState, Field, Grid, Icon, KeyValue, List, Modal, PageHeader,
  Progress, SearchInput, Sparkline, StatGrid, Table, Tabs, Timeline, Toggle, filterRows, useToast, DeleteButton,
} from '../components/ui/index.jsx'

const BASE = '/patient'
const BackLink = ({ to, label }) => (
  <Link to={to} className="back"><Icon name="ChevronLeft" size={16} /> {label}</Link>
)
/* The patient's health summary — the same record the mobile app edits. */
const useHealthProfile = () => {
  const [hp, setHp] = useState(null)
  useEffect(() => {
    request('/patients/me/health-profile').then(setHp, () => setHp(null))
  }, [])
  return hp ?? {}
}
const activeMeds = (meds) => meds.filter((m) => m.state === 'ACTIVE')

/* Real network / camera / microphone check for the video waiting room. */
const useDeviceCheck = () => {
  const [state, setState] = useState({ online: navigator.onLine, network: 'Checking…', camera: false, mic: false })
  useEffect(() => {
    const c = navigator.connection
    const network = !navigator.onLine ? 'Offline' : c?.downlink ? `${c.downlink >= 1.5 ? 'Good' : 'Weak'} — about ${c.downlink} Mbps` : 'Connected'
    navigator.mediaDevices?.enumerateDevices?.()
      .then((ds) => setState({ online: navigator.onLine, network, camera: ds.some((d) => d.kind === 'videoinput'), mic: ds.some((d) => d.kind === 'audioinput') }))
      .catch(() => setState((s) => ({ ...s, network })))
  }, [])
  return state
}

const useMyAppointments = () => {
  const { user } = useAuth()
  const [rows, api] = useCollection('appointments')
  // The server only returns this patient's own appointments.
  return [rows, api, rows]
}

/* ================= Dashboard ================= */
export function PatientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appts] = useMyAppointments()
  const [bills] = useCollection('billItems')
  const [labResults] = useCollection('labResults')
  const [meds] = useCollection('medications')
  const [vitals] = useCollection('vitals')
  const bp = vitals.filter((v) => v.bp).sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(-7)
  const sys = bp.map((v) => Number(v.bp.split('/')[0]))
  const upcoming = appts.filter((a) => new Date(a.at) >= new Date(new Date().setHours(0, 0, 0, 0)) && a.status !== 'CANCELLED').sort((a, b) => a.at.localeCompare(b.at))
  const outstanding = bills.filter((b) => b.coverageType === 'patient' && !b.paid).reduce((s, b) => s + b.amount, 0)

  return (
    <>
      <PageHeader
        title={`Good day, ${user.name.split(' ')[0]}`}
        subtitle={`Health ID ${user.healthId ?? '—'} · Everything about your care in one place.`}
        actions={<Button icon="CalendarPlus" onClick={() => navigate(`${BASE}/doctors`)}>Book appointment</Button>}
      />
      <StatGrid items={[
        { label: 'Upcoming visits', value: upcoming.length, icon: 'CalendarDays', tone: 'teal' },
        { label: 'New results', value: labResults.filter((l) => l.status !== 'PENDING').length, icon: 'FlaskConical', tone: 'blue' },
        { label: 'Active medications', value: activeMeds(meds).length, icon: 'Pill', tone: 'pink' },
        { label: 'Outstanding bills', value: naira(outstanding), icon: 'Wallet', tone: 'yellow' },
      ]} />
      <Grid>
        <Card title="Next appointment" action={<Link to={`${BASE}/appointments`}>All</Link>}>
          {upcoming[0] ? (
            <div className="next-appt">
              <Avatar name={upcoming[0].doctor} size={48} />
              <div>
                <b>{upcoming[0].doctor}</b>
                <small>{upcoming[0].specialty} · {upcoming[0].facility}</small>
                <p>{fmtDate(upcoming[0].at, true)} · <Badge>{upcoming[0].type}</Badge></p>
              </div>
              <Button size="sm" onClick={() => navigate(`${BASE}/appointments/${upcoming[0].id}${upcoming[0].type === 'TELEMEDICINE' ? '/waiting' : ''}`)}>
                {upcoming[0].type === 'TELEMEDICINE' ? 'Join waiting room' : 'View'}
              </Button>
            </div>
          ) : <EmptyState text="No upcoming appointments." />}
        </Card>
        <Card title="Blood pressure (last 7 readings)">
          {bp.length ? (
            <>
              <Sparkline points={sys} height={80} />
              <p className="muted">
                {bp.length > 1 ? (sys[sys.length - 1] < sys[0] ? 'Trending down' : sys[sys.length - 1] > sys[0] ? 'Trending up' : 'Steady') + ' — ' : ''}
                {bp[bp.length - 1].bp} mmHg on {fmtDate(bp[bp.length - 1].at)}.
              </p>
            </>
          ) : <EmptyState text="No blood pressure readings yet." />}
        </Card>
        <Card title="Recent results" action={<Link to={`${BASE}/labs`}>All results</Link>}>
          <List items={labResults.slice(0, 3).map((l) => ({ id: l.id, icon: 'FlaskConical', title: l.testName, subtitle: l.summary, right: <Badge>{l.status}</Badge>, onClick: () => navigate(`${BASE}/labs/${l.id}`) }))} />
        </Card>
        <Card title="Medications" action={<Link to={`${BASE}/medications`}>Manage</Link>}>
          <List items={activeMeds(meds).map((m) => ({ id: m.id, icon: 'Pill', tone: 'pink', title: `${m.name} ${m.dosage}`, subtitle: m.frequency, right: <small className={m.daysLeft < 7 ? 'text-warn' : ''}>{m.daysLeft} days left</small> }))} />
        </Card>
      </Grid>
      <div className="quick">
        {[
          ['Messages', 'MessageSquare', 'messages'], ['Health record', 'HeartPulse', 'record'], ['Pay bills', 'Wallet', 'billing'],
          ['AI assistant', 'Bot', 'assistant'], ['Family access', 'Baby', 'family'], ['Find a lab', 'Microscope', 'facilities'],
        ].map(([l, i, p]) => (
          <Link key={p} to={`${BASE}/${p}`} className="quick__item"><Icon name={i} size={20} /> {l}</Link>
        ))}
      </div>
    </>
  )
}

/* ================= Find a doctor ================= */
export function FindDoctor() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [spec, setSpec] = useState('All')
  const [mode, setMode] = useState('Any')
  const [doctors] = useCollection('doctors')
  const [specialties] = useCollection('specialties')
  const list = filterRows(doctors, q, ['name', 'specialty', 'hospital'])
    .filter((d) => spec === 'All' || d.specialty === spec)
    .filter((d) => mode === 'Any' || d.visitType.includes(mode))
  return (
    <>
      <PageHeader title="Find a Doctor" subtitle="All doctors are MDCN-verified by Healthchatter." />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, specialty or hospital" />
        <Field label="Specialty" as="select" options={['All', ...specialties]} value={spec} onChange={(e) => setSpec(e.target.value)} />
        <Field label="Visit type" as="select" options={['Any', 'Telemedicine', 'In-Person']} value={mode} onChange={(e) => setMode(e.target.value)} />
      </div>
      <div className="cards">
        {list.map((d) => (
          <article key={d.id} className="doc" onClick={() => navigate(`${BASE}/doctors/${d.id}`)}>
            <Avatar name={d.name} size={52} />
            <div className="doc__body">
              <b>{d.name} <Icon name="BadgeCheck" size={15} className="text-ok" /></b>
              <small>{d.specialty} · {d.hospital}</small>
              <span className="doc__meta">
                <span><Icon name="Star" size={14} /> {d.rating} ({d.reviewCount})</span>
                {d.experienceYears && <span>{d.experienceYears} yrs</span>}
                <span>{d.visitType}</span>
              </span>
            </div>
            <div className="doc__fee">
              <b>{naira(d.fee)}</b>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`${BASE}/doctors/${d.id}/book`) }}>Book</Button>
            </div>
          </article>
        ))}
        {!list.length && <EmptyState text="No doctors match your filters." />}
      </div>
    </>
  )
}

export function DoctorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doctors] = useCollection('doctors')
  const d = doctors.find((x) => x.id === id)
  if (!d) return <EmptyState text="Doctor not found." />
  return (
    <>
      <PageHeader back={<BackLink to={`${BASE}/doctors`} label="Doctors" />} title={d.name} subtitle={`${d.specialty} · ${d.hospital}`}
        actions={<><Button variant="ghost" icon="MessageSquare" onClick={() => navigate(`${BASE}/messages`)}>Message</Button><Button icon="CalendarPlus" onClick={() => navigate(`${BASE}/doctors/${d.id}/book`)}>Book appointment</Button></>} />
      <Grid>
        <Card title="About">
          <p>{d.about}</p>
          <KeyValue items={[['Experience', d.experienceYears ? `${d.experienceYears} years` : '—'], ['Patients seen', d.patientsSeen], ['Languages', d.languages], ['Consultation fee', naira(d.fee)], ['Visit type', d.visitType], ['Verification', 'MDCN licence verified']]} />
        </Card>
        <Card title="Next available">
          <List empty="No open slots yet." items={(d.slots ?? []).map((s) => ({ id: s, icon: 'Clock', title: s, right: <Button size="sm" variant="ghost" onClick={() => navigate(`${BASE}/doctors/${d.id}/book`)}>Select</Button> }))} />
          <h3 className="sub">Patient reviews</h3>
          <p className="muted"><Icon name="Star" size={14} /> {d.rating} average from {d.reviewCount} verified visits.</p>
        </Card>
      </Grid>
    </>
  )
}

export function BookAppointment() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [, api] = useCollection('appointments')
  const [doctors] = useCollection('doctors')
  const [policies] = useCollection('insurancePolicies')
  const [family] = useCollection('dependants')
  const d = doctors.find((x) => x.id === id) ?? doctors[0]
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ date: '', time: '10:00', type: 'TELEMEDICINE', reason: '', pay: 'HMO', reminder: true, consent: false })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const confirm = () => {
    const at = new Date(`${form.date}T${form.time}`).toISOString()
    const appt = api.add({ ...(form.forWhom && form.forWhom !== 'Myself' && { forPerson: form.forWhom }), patientId: user.id, patient: user.name, doctorId: d.id, doctor: d.name, specialty: d.specialty, facility: d.hospital, at, type: form.type, status: 'PENDING', reason: form.reason })
    toast('Appointment requested — you’ll be notified when it’s confirmed')
    navigate(`${BASE}/appointments/${appt.id}`)
  }

  return (
    <>
      <PageHeader back={<BackLink to={`${BASE}/doctors/${d.id}`} label={d.name} />} title="Book appointment" subtitle={`${d.name} · ${d.specialty}`} />
      <Card>
        <ol className="steps">{['Time', 'Details', 'Payment', 'Confirm'].map((s, i) => <li key={s} className={i === step ? 'is-active' : i < step ? 'is-done' : ''}><span>{i + 1}</span>{s}</li>)}</ol>
        {step === 0 && (
          <div className="form form--2">
            <Field label="Date" type="date" required value={form.date} onChange={set('date')} min={new Date().toISOString().slice(0, 10)} />
            <Field label="Time" as="select" options={['09:00', '10:00', '11:30', '14:00', '16:30']} value={form.time} onChange={set('time')} />
            <Field label="Visit type" as="select" options={[{ value: 'TELEMEDICINE', label: 'Video (telemedicine)' }, { value: 'IN_PERSON', label: 'In person' }]} value={form.type} onChange={set('type')} />
            <div className="form__actions"><Button disabled={!form.date} onClick={() => setStep(1)}>Continue</Button></div>
          </div>
        )}
        {step === 1 && (
          <div className="form">
            <Field label="Reason for visit" as="textarea" value={form.reason} onChange={set('reason')} placeholder="e.g. headaches for 2 weeks" />
            <Field label="Who is this for?" as="select" options={['Myself', ...family.map((x) => `${x.name} (${String(x.relation).toLowerCase()})`)]} value={form.forWhom ?? 'Myself'} onChange={set('forWhom')} />
            {form.type === 'TELEMEDICINE' && (
              <label className="check"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} /><span>I understand telemedicine has limits, may need an in-person exam, and is <b>not for emergencies</b>.</span></label>
            )}
            <div className="form__actions"><Button variant="ghost" onClick={() => setStep(0)}>Back</Button><Button disabled={form.type === 'TELEMEDICINE' && !form.consent} onClick={() => setStep(2)}>Continue</Button></div>
          </div>
        )}
        {step === 2 && (
          <div className="form">
            {[['HMO', `Bill my HMO (${policies[0]?.provider ?? 'none on file'})`], ['CARD', 'Card — Paystack'], ['TRANSFER', 'Bank transfer — Flutterwave'], ['USSD', 'USSD — Moniepoint']].map(([v, l]) => (
              <label key={v} className="radio"><input type="radio" name="pay" checked={form.pay === v} onChange={() => setForm({ ...form, pay: v })} /> {l}</label>
            ))}
            <Toggle label="SMS & calendar reminder" checked={form.reminder} onChange={(v) => setForm({ ...form, reminder: v })} />
            <div className="form__actions"><Button variant="ghost" onClick={() => setStep(1)}>Back</Button><Button onClick={() => setStep(3)}>Review</Button></div>
          </div>
        )}
        {step === 3 && (
          <div className="form">
            <KeyValue items={[['Doctor', d.name], ['When', `${form.date} at ${form.time}`], ['Type', form.type === 'TELEMEDICINE' ? 'Video' : 'In person'], ['Fee', naira(d.fee)], ['Payment', form.pay]]} />
            <div className="form__actions"><Button variant="ghost" onClick={() => setStep(2)}>Back</Button><Button onClick={confirm}>Confirm booking</Button></div>
          </div>
        )}
      </Card>
    </>
  )
}

/* ================= Appointments ================= */
export function Appointments() {
  const navigate = useNavigate()
  const [appts] = useMyAppointments()
  const [tab, setTab] = useState('Upcoming')
  const now = new Date(new Date().setHours(0, 0, 0, 0))
  const rows = appts.filter((a) => (tab === 'Upcoming' ? new Date(a.at) >= now && a.status !== 'CANCELLED' : new Date(a.at) < now || a.status === 'CANCELLED'))
  return (
    <>
      <PageHeader title="Appointments" actions={<Button icon="CalendarPlus" onClick={() => navigate(`${BASE}/doctors`)}>Book new</Button>} />
      <Tabs tabs={['Upcoming', 'Past']} value={tab} onChange={setTab} />
      <Card pad={false}>
        <Table rows={rows} onRowClick={(r) => navigate(`${BASE}/appointments/${r.id}`)} columns={[
          { label: 'Doctor', render: (r) => <span className="cell-user"><Avatar name={r.doctor} /> <span><b>{r.doctor}</b><small>{r.specialty}</small></span></span> },
          { label: 'When', render: (r) => fmtDate(r.at, true) },
          { label: 'Where', key: 'facility' },
          { label: 'Type', render: (r) => <Badge>{r.type}</Badge> },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
    </>
  )
}

export function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [appts, api] = useMyAppointments()
  const a = appts.find((x) => x.id === id)
  const [resched, setResched] = useState(false)
  const [date, setDate] = useState('')
  if (!a) return <EmptyState text="Appointment not found." />
  const upcoming = a.status !== 'CANCELLED' && a.status !== 'COMPLETED'
  return (
    <>
      <PageHeader back={<BackLink to={`${BASE}/appointments`} label="Appointments" />} title={a.reason || 'Appointment'} subtitle={`${a.doctor} · ${fmtDate(a.at, true)}`}
        actions={upcoming && (
          <>
            <Button variant="ghost" onClick={() => setResched(true)}>Reschedule</Button>
            <Button variant="danger" onClick={() => { api.update(a.id, { status: 'CANCELLED' }); toast('Appointment cancelled — refund started if paid') }}>Cancel</Button>
            {a.type === 'TELEMEDICINE' && <Button icon="Video" onClick={() => navigate(`${BASE}/appointments/${a.id}/waiting`)}>Join</Button>}
          </>
        )} />
      <Grid>
        <Card title="Details">
          <KeyValue items={[['Doctor', a.doctor], ['Specialty', a.specialty], ['Facility', a.facility], ['Date & time', fmtDate(a.at, true)], ['Type', <Badge key="t">{a.type}</Badge>], ['Status', <Badge key="s">{a.status}</Badge>]]} />
        </Card>
        <Card title="Progress">
          <Timeline items={[
            { title: 'Requested', done: true },
            { title: 'Confirmed by doctor', done: a.status !== 'PENDING' },
            { title: 'Pre-visit questionnaire', done: a.status === 'COMPLETED' },
            { title: 'Visit', done: a.status === 'COMPLETED' },
            { title: 'Visit summary shared', done: a.status === 'COMPLETED' },
          ]} />
        </Card>
      </Grid>
      <Modal open={resched} title="Reschedule" onClose={() => setResched(false)} footer={<Button disabled={!date} onClick={() => { api.update(a.id, { at: new Date(date).toISOString(), status: 'PENDING' }); setResched(false); toast('Reschedule requested') }}>Request new time</Button>}>
        <Field label="New date & time" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
      </Modal>
    </>
  )
}

/* ================= Telemedicine ================= */
export function WaitingRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appts] = useMyAppointments()
  const a = appts.find((x) => x.id === id)
  const [answers, setAnswers] = useState({ symptoms: '', severity: 'Mild', meds: '' })
  const device = useDeviceCheck()
  const [done, setDone] = useState(false)
  if (!a) return <EmptyState text="Appointment not found." />
  return (
    <>
      <PageHeader back={<BackLink to={`${BASE}/appointments/${a.id}`} label="Appointment" />} title="Virtual waiting room" subtitle={`${a.doctor} · ${fmtTime(a.at)}`} />
      <Alert tone="danger" title="Not an emergency service">If you have chest pain, severe bleeding, difficulty breathing or loss of consciousness, call 112 now.</Alert>
      <Grid>
        <Card title="Connection check">
          <List items={[
            { id: 'n', icon: 'Wifi', title: 'Network', subtitle: device.network, right: <Badge>{device.online ? 'OK' : 'OFFLINE'}</Badge> },
            { id: 'c', icon: 'Video', title: 'Camera', subtitle: device.camera ? 'Camera detected' : 'No camera found', right: <Badge>{device.camera ? 'OK' : 'MISSING'}</Badge> },
            { id: 'm', icon: 'Mic', title: 'Microphone', subtitle: device.mic ? 'Microphone detected' : 'No microphone found', right: <Badge>{device.mic ? 'OK' : 'MISSING'}</Badge> },
          ]} />
          <Alert tone="info">Your doctor will let you in shortly. Weak network? We'll switch to audio-only automatically.</Alert>
        </Card>
        <Card title="Pre-visit questionnaire">
          {done ? <Alert tone="success" title="Sent to your doctor">Thanks — Dr. will review before the call.</Alert> : (
            <form className="form" onSubmit={(e) => { e.preventDefault(); api.update(a.id, { questionnaire: { ...answers, at: new Date().toISOString() } }); setDone(true) }}>
              <Field label="Main symptoms" as="textarea" required value={answers.symptoms} onChange={(e) => setAnswers({ ...answers, symptoms: e.target.value })} />
              <Field label="How severe?" as="select" options={['Mild', 'Moderate', 'Severe']} value={answers.severity} onChange={(e) => setAnswers({ ...answers, severity: e.target.value })} />
              <Field label="Medicines taken recently" value={answers.meds} onChange={(e) => setAnswers({ ...answers, meds: e.target.value })} />
              <Button type="submit">Submit answers</Button>
            </form>
          )}
        </Card>
      </Grid>
      <div className="center"><Button size="lg" icon="Video" onClick={() => navigate(`${BASE}/appointments/${a.id}/consult`)}>Enter consultation</Button></div>
    </>
  )
}

export function ConsultationRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appts, api] = useMyAppointments()
  const a = appts.find((x) => x.id === id)
  const [mic, setMic] = useState(true)
  const [cam, setCam] = useState(true)
  if (!a) return <EmptyState text="Appointment not found." />
  return (
    <div className="call">
      <div className="call__video">
        <div className="call__remote"><Avatar name={a.doctor} size={96} /><b>{a.doctor}</b><small>Connected · 08:42</small></div>
        <div className="call__self">{cam ? 'You' : <Icon name="VideoOff" />}</div>
        <div className="call__controls">
          <button className={`icon-btn ${mic ? '' : 'is-off'}`} onClick={() => setMic(!mic)} aria-label="Toggle microphone"><Icon name={mic ? 'Mic' : 'MicOff'} /></button>
          <button className={`icon-btn ${cam ? '' : 'is-off'}`} onClick={() => setCam(!cam)} aria-label="Toggle camera"><Icon name={cam ? 'Video' : 'VideoOff'} /></button>
          <button className="icon-btn is-end" onClick={() => { api.update(a.id, { status: 'COMPLETED' }); navigate(`${BASE}/appointments/${a.id}`) }} aria-label="End call"><Icon name="PhoneOff" /></button>
        </div>
      </div>
      <aside className="call__side">
        <h3>Visit notes from your doctor</h3>
        <p className="muted">Your doctor will share a visit summary, any prescriptions and orders here after the call.</p>
        <Alert tone="warning" title="Doctor may escalate">If your doctor decides you need in-person or emergency care, you'll see directions to the nearest facility here.</Alert>
      </aside>
    </div>
  )
}

/* ================= Health record ================= */
export function HealthRecord() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Summary')
  const hp = useHealthProfile()
  const me = { bloodType: hp.bloodGroup ?? '—', genotype: hp.genotype ?? '—', hmoProvider: hp.coverageType ?? '—', allergies: hp.allergies ?? [] }
  const [conditions] = useCollection('conditions')
  const [meds] = useCollection('medications')
  const [immunizations] = useCollection('immunizations')
  const [visits] = useCollection('visits')
  return (
    <>
      <PageHeader title="My Health Record" subtitle="Shared across facilities you've consented to." actions={<Button variant="ghost" icon="Download" onClick={() => window.print()}>Download (PDF)</Button>} />
      <Tabs tabs={['Summary', 'Conditions', 'Allergies', 'Immunizations', 'Visit history']} value={tab} onChange={setTab} />
      {tab === 'Summary' && (
        <Grid>
          <Card title="Personal">
            <KeyValue items={[['Name', user.name], ['Health ID', user.healthId], ['Blood group', me.bloodType], ['Genotype', me.genotype], ['HMO', me.hmoProvider]]} />
          </Card>
          <Card title="At a glance">
            <List items={[
              { id: 'c', icon: 'Activity', title: `${conditions.filter((c) => c.status === 'Active').length} active conditions`, subtitle: conditions.filter((c) => c.status === 'Active').map((c) => c.name).join(', ') },
              { id: 'a', icon: 'TriangleAlert', tone: 'red', title: 'Allergies', subtitle: me.allergies.join(', ') || 'None recorded' },
              { id: 'm', icon: 'Pill', tone: 'pink', title: `${activeMeds(meds).length} active medications` },
              { id: 'i', icon: 'Syringe', tone: 'blue', title: `${immunizations.length} immunizations on file` },
            ]} />
          </Card>
        </Grid>
      )}
      {tab === 'Conditions' && <Card pad={false}><Table rows={conditions} columns={[{ label: 'Condition', key: 'name' }, { label: 'Status', render: (r) => <Badge>{r.status.toUpperCase()}</Badge> }, { label: 'Diagnosed', key: 'diagnosedDate' }, { label: 'By', key: 'diagnosedBy' }]} /></Card>}
      {tab === 'Allergies' && <Card><List items={me.allergies.map((a) => ({ id: a, icon: 'TriangleAlert', tone: 'red', title: a, subtitle: 'Recorded by Dr. Ngozi Adeyemi' }))} /></Card>}
      {tab === 'Immunizations' && <Card pad={false}><Table rows={immunizations} columns={[{ label: 'Vaccine', key: 'vaccine' }, { label: 'Dose', key: 'doseLabel' }, { label: 'Date', key: 'date' }, { label: 'Facility', key: 'facility' }]} /></Card>}
      {tab === 'Visit history' && <Card><Timeline items={visits.map((e) => ({ title: `${e.date} · ${e.type}`, subtitle: e.note, done: true }))} /></Card>}
    </>
  )
}

/* ================= Labs & imaging ================= */
export function LabResults() {
  const navigate = useNavigate()
  const [labResults] = useCollection('labResults')
  return (
    <>
      <PageHeader title="Lab Results" subtitle="Results appear once verified and released by the lab." />
      <Card pad={false}>
        <Table rows={labResults} onRowClick={(r) => navigate(`${BASE}/labs/${r.id}`)} columns={[
          { label: 'Test', render: (r) => <b>{r.testName}</b> },
          { label: 'Summary', key: 'summary' },
          { label: 'Ordered by', key: 'orderingDoctor' },
          { label: 'Date', key: 'timestamp' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
    </>
  )
}

export function LabDetail() {
  const { id } = useParams()
  const [labResults] = useCollection('labResults')
  const l = labResults.find((x) => x.id === id)
  if (!l) return <EmptyState text="Result not found." />
  return (
    <>
      <PageHeader back={<BackLink to={`${BASE}/labs`} label="Lab results" />} title={l.testName} subtitle={`${l.hospital} · ${l.timestamp}`} actions={<Button variant="ghost" icon="Download" onClick={() => window.print()}>Download</Button>} />
      {l.status === 'FLAGGED' && <Alert tone="warning" title="Some values are outside the normal range">Your doctor has been notified and may message you.</Alert>}
      <Grid>
        <Card title="Result">
          <p className="big">{l.summary}</p>
          <KeyValue items={[['Ordered by', l.orderingDoctor], ['Laboratory', l.hospital], ['Status', <Badge key="s">{l.status}</Badge>]]} />
        </Card>
        <Card title="Verification trail">
          <Timeline items={[
            { title: 'Sample collected', subtitle: l.timestamp, done: true },
            { title: 'Analysed', done: l.status !== 'PENDING' },
            { title: 'Verified by licensed scientist', subtitle: l.verifiedBy ?? l.hospital, done: l.status !== 'PENDING' },
            { title: 'Released to you', done: l.status !== 'PENDING' },
          ]} />
        </Card>
      </Grid>
    </>
  )
}

export function Imaging() {
  const [studies] = useCollection('patientImaging')
  return (
    <>
      <PageHeader title="Imaging" subtitle="Images load on tap to save data." />
      <div className="cards cards--3">
        {studies.map((s) => (
          <Card key={s.id} title={`${s.type} — ${s.bodyPart}`} action={<Badge>{s.status}</Badge>}>
            <div className="img-ph"><Icon name="ScanLine" size={36} /><small>Tap to load image (≈1.2 MB)</small></div>
            <p>{s.summary}</p>
            <small className="muted">{s.facility} · {s.date}</small>
          </Card>
        ))}
      </div>
    </>
  )
}

/* ================= Medications ================= */
export function Medications() {
  const toast = useToast()
  const [refills, api] = useCollection('refillRequests')
  const [meds] = useCollection('medications')
  const { user } = useAuth()
  return (
    <>
      <PageHeader title="Medications" />
      <div className="cards cards--3">
        {activeMeds(meds).map((m) => (
          <Card key={m.id} title={m.name} action={<small>{m.daysLeft} days left</small>}>
            <p>{m.dosage} · {m.frequency}</p>
            <Progress value={m.refillProgress * 100} tone={m.daysLeft < 7 ? 'amber' : 'teal'} />
            <small className="muted">Prescribed by {m.prescribingDoctor}</small>
            <Button size="sm" variant="ghost" icon="Repeat" onClick={() => { api.add({ patient: user.name, drug: `${m.name} ${m.dosage}`, lastFilled: new Date().toISOString(), doctor: m.prescribingDoctor, status: 'AWAITING_DOCTOR' }); toast('Refill requested') }}>Request refill</Button>
          </Card>
        ))}
      </div>
      <Card title="Refill requests" pad={false}>
        <Table rows={refills} empty="No refill requests." columns={[{ label: 'Medication', key: 'drug' }, { label: 'Doctor', key: 'doctor' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }]} />
      </Card>
      <Card title="Completed courses" pad={false}>
        <Table rows={meds.filter((m) => m.state === 'COMPLETED')} columns={[{ label: 'Medication', key: 'name' }, { label: 'Dosage', key: 'dosage' }, { label: 'Completed', key: 'completedDate' }]} />
      </Card>
    </>
  )
}

/* ================= Referrals ================= */
export function PatientReferrals() {
  const [referrals] = useCollection('patientReferrals')
  return (
    <>
      <PageHeader title="Referrals" subtitle="Specialist referrals from your doctors." />
      <Card pad={false}>
        <Table rows={referrals} columns={[
          { label: 'To', render: (r) => <b>{r.toSpecialty}</b> },
          { label: 'From', key: 'fromDoctor' },
          { label: 'Reason', key: 'reason' },
          { label: 'Date', key: 'date' },
          { label: 'Status', render: (r) => <Badge>{r.status.toUpperCase()}</Badge> },
        ]} />
      </Card>
    </>
  )
}

/* ================= Billing ================= */
export function PatientBilling() {
  const toast = useToast()
  const { user } = useAuth()
  const [items, bills] = useCollection('billItems')
  const [, payments] = useCollection('payments')
  const [pay, setPay] = useState(null)
  const [method, setMethod] = useState('Card (Paystack)')
  const paid = items.filter((b) => b.paid).map((b) => b.id)
  const due = items.filter((b) => b.coverageType === 'patient' && !b.paid)
  return (
    <>
      <PageHeader title="Bills & Payments" subtitle="Secure payments via licensed providers. We never store card details." />
      <StatGrid items={[
        { label: 'You owe', value: naira(due.reduce((s, b) => s + b.amount, 0)), icon: 'Wallet', tone: 'yellow' },
        { label: 'Covered by HMO', value: naira(items.filter((b) => b.coverageType === 'covered').reduce((s, b) => s + b.amount, 0)), icon: 'Shield', tone: 'teal' },
      ]} />
      <Card pad={false}>
        <Table rows={items} columns={[
          { label: 'Service', render: (r) => <span><b>{r.service}</b><small className="block muted">{r.provider}</small></span> },
          { label: 'Amount', render: (r) => naira(r.amount) },
          { label: 'Coverage', render: (r) => <Badge tone={r.coverageType === 'covered' ? 'green' : 'amber'}>{r.coverageTag}</Badge> },
          { label: '', render: (r) => r.coverageType === 'patient' && (paid.includes(r.id) ? <Badge>PAID</Badge> : <Button size="sm" onClick={() => setPay(r)}>Pay</Button>) },
        ]} />
      </Card>
      <Modal open={!!pay} title={`Pay ${pay ? naira(pay.amount) : ''}`} onClose={() => setPay(null)} footer={<Button onClick={() => { bills.update(pay.id, { paid: true, paidAt: new Date().toISOString(), method }); payments.add({ id: `PAY-${Date.now().toString().slice(-6)}`, invoice: pay.id, patient: user.name, amount: pay.amount, method, at: new Date().toISOString(), status: 'SUCCESS', platformFee: Math.round(pay.amount * 0.1) }); setPay(null); toast('Payment recorded') }}>Pay now</Button>}>
        <p className="muted">{pay?.service} · {pay?.provider}</p>
        {['Card (Paystack)', 'Bank transfer (Flutterwave)', 'USSD (Moniepoint)', 'Interswitch / Verve'].map((m) => (
          <label key={m} className="radio"><input type="radio" checked={method === m} onChange={() => setMethod(m)} /> {m}</label>
        ))}
        <Alert tone="info">Refunds for cancelled consultations are returned to the same method within 5 working days.</Alert>
      </Modal>
    </>
  )
}

/* ================= Insurance ================= */
export function Insurance() {
  const [hmos] = useCollection('hmos')
  const { user } = useAuth()
  const toast = useToast()
  const [policies, policyApi] = useCollection('insurancePolicies')
  const ins = policies[0] ?? { provider: 'No plan on file', tier: '—', nhiaId: '—', status: 'NONE' }
  const [claims] = useCollection('claims')
  const [deps] = useCollection('dependants')
  return (
    <>
      <PageHeader title="Insurance" subtitle="Your NHIA / HMO coverage and claims." />
      <Grid>
        <Card title="Current plan" action={<Badge>{ins.status}</Badge>}>
          <div className="ins-card">
            <Icon name="Shield" size={28} />
            <div><b>{ins.provider}</b><small>{ins.tier} plan</small></div>
          </div>
          <KeyValue items={[['Enrollee ID', ins.nhiaId], ['Primary facility', ins.primaryFacility ?? '—'], ['Dependants', deps.length], ['Renews', ins.renews ? fmtDate(ins.renews) : '—']]} />
        </Card>
        <Card title="Recent claims">
          <List items={claims.slice(0, 5).map((c) => ({ id: c.id, icon: 'FileCheck', title: c.diagnosis ?? c.id, subtitle: `${c.provider} · ${naira(c.amount)}`, right: <Badge>{c.status}</Badge> }))} empty="No claims yet." />
        </Card>
      </Grid>
      <Card title="Change or add coverage">
        <form className="form form--2" onSubmit={(e) => {
          e.preventDefault()
          const f = Object.fromEntries(new FormData(e.currentTarget))
          const plan = { provider: f.provider, nhiaId: f.policyId, tier: '—', status: 'PENDING_VERIFICATION', submittedAt: new Date().toISOString() }
          if (policies[0]) policyApi.update(policies[0].id, plan)
          else policyApi.add({ patient: user.name, patientId: user.id, ...plan })
          e.currentTarget.reset()
          toast('Coverage submitted — your HMO will confirm it')
        }}>
          <Field label="Provider" name="provider" as="select" options={hmos.map((h) => h.name)} />
          <Field label="Enrollee / policy ID" name="policyId" required />
          <div className="form__actions"><Button type="submit">Verify coverage</Button></div>
        </form>
      </Card>
    </>
  )
}

/* ================= Facilities ================= */
export function Facilities() {
  const [facilities] = useCollection('facilities')
  const [, labs] = useCollection('labOrders')
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const toast = useToast()
  const list = filterRows(facilities.filter((f) => f.status === 'VERIFIED'), q, ['name', 'type', 'state'])
  return (
    <>
      <PageHeader title="Hospitals, Labs & Pharmacies" subtitle="Only licensed, verified facilities are listed." />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search by name, type or state" /></div>
      <div className="cards cards--3">
        {list.map((f) => (
          <Card key={f.id} title={f.name} action={<Badge>{f.status}</Badge>}>
            <p className="muted"><Icon name="MapPin" size={14} /> {f.type} · {f.state}</p>
            <small className="muted">Reg. {f.regNo}</small>
            <div className="row-actions">
              {f.type === 'Laboratory' ? <Button size="sm" onClick={() => { const test = window.prompt(`Which test would you like at ${f.name}?`, 'Full Blood Count'); if (!test?.trim()) return; labs.add({ patientId: user.id, patient: user.name, test: test.trim(), lab: f.name, orderedBy: 'Self-booked', priority: 'ROUTINE', status: 'ORDERED', sample: 'PENDING', orderedAt: new Date().toISOString(), released: false }); toast('Lab test booked — show your Health ID at the lab') }}>Book a test</Button> : <Button size="sm" variant="ghost" onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(f.name)}`, '_blank')}>View</Button>}
              <Button size="sm" variant="ghost" icon="MapPin" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(f.name)}`, '_blank')}>Directions</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

/* ================= AI assistant ================= */
const EMERGENCY = /(chest pain|can.?t breathe|unconscious|bleeding heavily|seizure|suicid|stroke)/i
export function Assistant() {
  const { user } = useAuth()
  const [, aiLog] = useCollection('aiFlags')
  const [msgs, setMsgs] = useState([{ from: 'ai', text: 'Hello! I’m the Healthchatter assistant. I can explain health information and help you find care. I’m not a doctor and can’t diagnose or prescribe.' }])
  const [text, setText] = useState('')
  const send = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const q = text.trim()
    const reply = EMERGENCY.test(q)
      ? { from: 'ai', emergency: true, text: 'This could be a medical emergency. Please call 112 or go to the nearest emergency department now. I’ve alerted the on-call clinician.' }
      : /dose|double|stop taking|how many tablets/i.test(q)
        ? { from: 'ai', text: 'I can’t give medication dosing advice. Would you like to message your doctor about this?', action: true }
        : { from: 'ai', text: 'I can’t answer health questions yet — the AI service isn’t connected. Please message a doctor or book a consultation for advice.', action: true }
    setMsgs([...msgs, { from: 'me', text: q }, reply])
    // Logged for the safety team (Super Admin → AI Safety Review).
    const flag = reply.emergency ? 'EMERGENCY_ESCALATION' : reply.action && /dose|double|stop taking|how many tablets/i.test(q) ? 'MEDICATION_ADVICE' : 'NONE'
    aiLog.add({ user: user.name, patientId: user.id, prompt: q, response: reply.text, flag, model: 'rules (no AI connected)', status: flag === 'NONE' ? 'OK' : 'NEEDS_REVIEW', at: new Date().toISOString() })
    setText('')
  }
  return (
    <>
      <PageHeader title="AI Health Assistant" subtitle="General health information and navigation — not a replacement for a licensed professional." />
      <Alert tone="info">Conversations are logged for safety review and are never used to train AI models without your consent.</Alert>
      <Card className="assistant">
        <div className="chat__msgs">
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.from === 'me' ? 'bubble--me' : ''} ${m.emergency ? 'bubble--danger' : ''}`}>
              {m.emergency && <Icon name="Siren" size={16} />} {m.text}
              {m.action && <Link to={`${BASE}/messages`} className="b b--sm b--ghost">Message my doctor</Link>}
              {m.emergency && <a href="tel:112" className="b b--sm b--danger">Call 112</a>}
            </div>
          ))}
        </div>
        <form className="chat__input" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I have fever, headache and cough. What should I do?" aria-label="Ask the assistant" />
          <Button type="submit" icon="Send">Ask</Button>
        </form>
      </Card>
    </>
  )
}

/* ================= Family / proxy access ================= */
export function FamilyAccess() {
  const navigate = useNavigate()
  const [rows, api] = useCollection('dependants')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', relation: 'Child', age: '', access: 'FULL' })
  const toast = useToast()
  return (
    <>
      <PageHeader title="Family Access" subtitle="Manage records for children and relatives who've given you access." actions={<Button icon="UserPlus" onClick={() => setOpen(true)}>Add family member</Button>} />
      <Alert tone="info">Children under 18 are managed by a parent/guardian. Teens aged 13–17 can request confidential visits that guardians can't see.</Alert>
      <div className="cards cards--3">
        {rows.map((p) => (
          <Card key={p.id}>
            <div className="next-appt"><Avatar name={p.name} size={48} /><div><b>{p.name}</b><small>{p.relation} · {p.age} yrs · {p.healthId}</small></div></div>
            <p>Access: <Badge>{p.access}</Badge></p>
            <div className="row-actions"><Button size="sm" variant="ghost" onClick={() => navigate(`${BASE}/doctors`)}>Book for them</Button><DeleteButton label="Remove" what={`${p.name}'s access`} onConfirm={() => api.remove(p.id)} /></div>
          </Card>
        ))}
      </div>
      <Modal open={open} title="Add family member" onClose={() => setOpen(false)} footer={<Button onClick={() => { api.add({ ...form, healthId: `HC-${Math.floor(200000 + Math.random() * 99999)}` }); setOpen(false); toast('Added') }}>Add</Button>}>
        <div className="form">
          <Field label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Relationship" as="select" options={['Child', 'Parent', 'Spouse', 'Other relative']} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
          <Field label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <Field label="Access level" as="select" options={[{ value: 'FULL', label: 'Full record' }, { value: 'APPOINTMENTS_ONLY', label: 'Appointments & bills only' }]} value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value })} />
          <Alert tone="warning">Adults must approve your access by SMS before you can see their record.</Alert>
        </div>
      </Modal>
    </>
  )
}

/* ================= Privacy & consent ================= */
export function Privacy() {
  const { user } = useAuth()
  const toast = useToast()
  const [consents, api] = useCollection('consents')
  const [log] = useCollection('auditLog')
  const [requests, rq] = useCollection('dataRequests')
  const consentTypes = ['Telemedicine', 'Record sharing across facilities', 'Lab result sharing', 'Insurance information sharing', 'AI interaction', 'Marketing']
  const mine = (t) => consents.find((c) => c.type === t)
  const toggle = (t, on) => {
    const c = mine(t)
    const status = on ? 'GRANTED' : 'WITHDRAWN'
    if (c) api.update(c.id, { status, at: new Date().toISOString() })
    else api.add({ patient: user.name, type: t, status, at: new Date().toISOString() })
    toast(on ? `${t}: consent given` : `${t}: consent withdrawn`)
  }
  return (
    <>
      <PageHeader title="Privacy & Consent" subtitle="Your rights under the Nigeria Data Protection Act 2023." />
      <Grid>
        <Card title="What you've agreed to">
          {consentTypes.map((t) => (
            <Toggle key={t} label={t} checked={(mine(t)?.status ?? 'GRANTED').startsWith('GRANTED')} onChange={(v) => toggle(t, v)} />
          ))}
        </Card>
        <Card title="Your data rights">
          <List items={[
            { id: 'a', icon: 'Download', title: 'Get a copy of my data', onClick: () => { rq.add({ subject: user.name, type: 'ACCESS', detail: 'Export of my health record', status: 'NEW', at: new Date().toISOString(), due: new Date(Date.now() + 30 * 864e5).toISOString() }); toast('Request sent to our Data Protection Officer') } },
            { id: 'c', icon: 'FileWarning', title: 'Correct something in my record', onClick: () => { rq.add({ subject: user.name, type: 'CORRECTION', detail: 'Correction requested', status: 'NEW', at: new Date().toISOString(), due: new Date(Date.now() + 30 * 864e5).toISOString() }); toast('Correction request sent') } },
            { id: 'd', icon: 'Trash2', tone: 'red', title: 'Delete my account', subtitle: 'Clinical records are kept as required by law.', onClick: () => { rq.add({ subject: user.name, type: 'DELETION', detail: 'Delete account', status: 'NEW', at: new Date().toISOString(), due: new Date(Date.now() + 30 * 864e5).toISOString() }); toast('Deletion request sent') } },
          ]} />
          <h3 className="sub">My requests</h3>
          <Table rows={requests} empty="No requests yet." columns={[{ label: 'Type', render: (r) => <Badge>{r.type}</Badge> }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }, { label: 'Due', render: (r) => fmtDate(r.due) }]} />
        </Card>
      </Grid>
      <Card title="Who has accessed my record" pad={false}>
        <Table rows={log} empty="No one has accessed your record yet." columns={[
          { label: 'When', render: (r) => fmtDate(r.at, true) },
          { label: 'Who', render: (r) => <span><b>{r.actor}</b><small className="block muted">{r.facility}</small></span> },
          { label: 'Action', render: (r) => <Badge>{r.action}</Badge> },
          { label: 'What', key: 'resource' },
        ]} />
      </Card>
    </>
  )
}
