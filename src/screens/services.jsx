/* Pharmacist, Lab & Imaging Scientist and Billing Officer screens. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { fmtDate, naira, useCollection } from '../lib/store.js'
import {
  Alert, Badge, BarChart, Button, Card, Field, Grid, KeyValue, List, Modal, PageHeader,
  SearchInput, StatGrid, Table, Tabs, Timeline, filterRows, useToast,
} from '../components/ui/index.jsx'

/* ===================================================================== */
/*                               PHARMACIST                              */
/* ===================================================================== */
export function PharmacyDashboard() {
  const { user } = useAuth()
  const [rx] = useCollection('prescriptions')
  const [inv] = useCollection('inventory')
  const [dl] = useCollection('deliveries')
  const low = inv.filter((i) => i.stock < i.reorder)
  return (
    <>
      <PageHeader title="Pharmacy" subtitle={user.facility} />
      <StatGrid items={[
        { label: 'New prescriptions', value: rx.filter((r) => r.status === 'NEW').length, icon: 'Pill', tone: 'teal' },
        { label: 'Interaction alerts', value: rx.filter((r) => r.interaction && r.status === 'NEW').length, icon: 'TriangleAlert', tone: 'pink' },
        { label: 'Low / out of stock', value: low.length, icon: 'Package', tone: 'yellow' },
        { label: 'Out for delivery', value: dl.filter((d) => d.status === 'OUT_FOR_DELIVERY').length, icon: 'Truck', tone: 'blue' },
      ]} />
      <Grid>
        <Card title="Prescription queue" action={<Link to="/pharmacy/queue">Open</Link>}>
          <List items={rx.filter((r) => r.status === 'NEW' || r.status === 'READY').map((r) => ({ id: r.id, icon: 'Pill', tone: r.interaction ? 'red' : 'teal', title: `${r.drug} ${r.dosage}`, subtitle: `${r.patient} · ${r.doctor}`, right: <Badge>{r.status}</Badge> }))} />
        </Card>
        <Card title="Stock alerts" action={<Link to="/pharmacy/inventory">Inventory</Link>}>
          <List items={low.map((i) => ({ id: i.id, icon: 'Package', tone: i.stock === 0 ? 'red' : 'amber', title: i.drug, subtitle: `${i.stock} left · reorder at ${i.reorder}` }))} />
        </Card>
      </Grid>
    </>
  )
}

export function RxQueue() {
  const toast = useToast()
  const { user } = useAuth()
  const [rows, api] = useCollection('prescriptions')
  const [sel, setSel] = useState(null)
  const [tab, setTab] = useState('NEW')
  return (
    <>
      <PageHeader title="e-Prescription Queue" subtitle="Only prescriptions from verified doctors appear here." />
      <Tabs tabs={[{ value: 'NEW', label: 'New' }, { value: 'READY', label: 'Ready for pickup' }, { value: 'DISPENSED', label: 'Dispensed' }]} value={tab} onChange={setTab} />
      <Card pad={false}>
        <Table rows={rows.filter((r) => r.status === tab)} empty="Queue is empty." onRowClick={setSel} columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Medication', render: (r) => <b>{r.drug} {r.dosage}</b> }, { label: 'Qty', key: 'qty' },
          { label: 'Prescriber', key: 'doctor' }, { label: 'Alerts', render: (r) => r.interaction ? <Badge tone="red">Interaction</Badge> : <Badge tone="green">None</Badge> },
          { label: 'Received', render: (r) => fmtDate(r.at, true) },
        ]} />
      </Card>
      <Modal open={!!sel} title={`${sel?.drug} ${sel?.dosage}`} onClose={() => setSel(null)} footer={sel && (
        <div className="row-actions">
          {sel.status === 'NEW' && <Button variant="ghost" onClick={() => { api.update(sel.id, { status: 'QUERIED' }); setSel(null); toast('Query sent to prescriber') }}>Query prescriber</Button>}
          {sel.status === 'NEW' && <Button onClick={() => { api.update(sel.id, { status: 'READY' }); setSel(null); toast('Prepared — patient notified by SMS') }}>Prepare</Button>}
          {sel.status === 'READY' && <Button onClick={() => { api.update(sel.id, { status: 'DISPENSED', dispensedBy: user.name }); setSel(null); toast('Dispensed & logged') }}>Dispense</Button>}
        </div>
      )}>
        {sel?.interaction && <Alert tone="danger" title="Drug interaction">{sel.interaction}</Alert>}
        <KeyValue items={[['Patient', sel?.patient], ['Directions', `${sel?.dosage} — ${sel?.frequency}`], ['Quantity', sel?.qty], ['Prescriber', `${sel?.doctor} (MDCN verified)`], ['Status', <Badge key="s">{sel?.status}</Badge>]]} />
        {sel?.status === 'READY' && <Alert tone="info">Confirm patient identity (Health ID or code sent by SMS) before handing over.</Alert>}
      </Modal>
    </>
  )
}

export function DispensingLog() {
  const [rows] = useCollection('prescriptions')
  const [q, setQ] = useState('')
  return (
    <>
      <PageHeader title="Dispensing Log" subtitle="Immutable record for PCN inspection." actions={<Button variant="ghost" icon="Download">Export CSV</Button>} />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} /></div>
      <Card pad={false}>
        <Table rows={filterRows(rows.filter((r) => r.status === 'DISPENSED'), q, ['patient', 'drug', 'doctor'])} columns={[
          { label: 'Date', render: (r) => fmtDate(r.at, true) }, { label: 'Patient', key: 'patient' }, { label: 'Medication', render: (r) => `${r.drug} ${r.dosage} × ${r.qty}` },
          { label: 'Prescriber', key: 'doctor' }, { label: 'Dispensed by', key: 'dispensedBy' },
        ]} />
      </Card>
    </>
  )
}

export function Inventory() {
  const toast = useToast()
  const [rows, api] = useCollection('inventory')
  const [sel, setSel] = useState(null)
  const [qty, setQty] = useState(100)
  return (
    <>
      <PageHeader title="Inventory" actions={<Button icon="Plus" onClick={() => api.add({ drug: 'New item', stock: 0, reorder: 50, expiry: '2027-12', batch: '—' })}>Add item</Button>} />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Medication', render: (r) => <b>{r.drug}</b> }, { label: 'Batch', key: 'batch' }, { label: 'Expiry', key: 'expiry' },
          { label: 'Stock', render: (r) => <span className={r.stock < r.reorder ? 'text-danger' : ''}>{r.stock}</span> }, { label: 'Reorder at', key: 'reorder' },
          { label: 'Status', render: (r) => <Badge>{r.stock === 0 ? 'OUT_OF_STOCK' : r.stock < r.reorder ? 'PENDING' : 'OK'}</Badge> },
          { label: '', render: (r) => <Button size="sm" variant="ghost" onClick={() => setSel(r)}>Receive stock</Button> },
        ]} />
      </Card>
      <Modal open={!!sel} title={`Receive — ${sel?.drug}`} onClose={() => setSel(null)} footer={<Button onClick={() => { api.update(sel.id, { stock: sel.stock + Number(qty) }); setSel(null); toast('Stock updated') }}>Save</Button>}>
        <div className="form"><Field label="Quantity received" type="number" value={qty} onChange={(e) => setQty(e.target.value)} /><Field label="Batch number" /><Field label="Expiry" type="month" /><Field label="Supplier (NAFDAC-registered)" /></div>
      </Modal>
    </>
  )
}

export function Refills() {
  const toast = useToast()
  const [rows, api] = useCollection('refillRequests')
  return (
    <>
      <PageHeader title="Refill Requests" subtitle="Refills need the prescriber's approval before dispensing." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Medication', key: 'drug' }, { label: 'Prescriber', key: 'doctor' }, { label: 'Last filled', render: (r) => fmtDate(r.lastFilled) },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'APPROVED' && <Button size="sm" onClick={() => { api.update(r.id, { status: 'DISPENSED' }); toast('Refill dispensed') }}>Dispense</Button> },
        ]} />
      </Card>
    </>
  )
}

export function Deliveries() {
  const toast = useToast()
  const [rows, api] = useCollection('deliveries')
  return (
    <>
      <PageHeader title="Deliveries" subtitle="Licensed courier partners only. Patient confirms receipt with a one-time code." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Address', key: 'address' }, { label: 'Courier', key: 'courier' }, { label: 'ETA', render: (r) => fmtDate(r.eta, true) },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'OUT_FOR_DELIVERY' && <Button size="sm" onClick={() => { api.update(r.id, { status: 'DELIVERED' }); toast('Marked delivered') }}>Confirm delivery</Button> },
        ]} />
      </Card>
    </>
  )
}

/* ===================================================================== */
/*                          LAB & IMAGING SCIENTIST                      */
/* ===================================================================== */
export function LabDashboard() {
  const { user } = useAuth()
  const [orders] = useCollection('labOrders')
  const [img] = useCollection('imagingStudies')
  const [am] = useCollection('labAmendments')
  return (
    <>
      <PageHeader title="Laboratory" subtitle={user.facility} />
      <StatGrid items={[
        { label: 'Awaiting sample', value: orders.filter((o) => o.sample === 'PENDING').length, icon: 'Syringe', tone: 'yellow' },
        { label: 'In progress', value: orders.filter((o) => o.status === 'IN_PROGRESS').length, icon: 'Microscope', tone: 'teal' },
        { label: 'Awaiting release', value: orders.filter((o) => o.status === 'COMPLETED' && !o.released).length, icon: 'FileCheck', tone: 'blue' },
        { label: 'Imaging to report', value: img.filter((i) => i.status === 'AWAITING_REPORT').length, icon: 'ScanLine', tone: 'pink' },
      ]} />
      {am.some((a) => a.status === 'PENDING_APPROVAL') && <Alert tone="warning" title="Amendment awaiting second signature"><Link to="/lab/amendments">Review</Link></Alert>}
      <Card title="Urgent orders">
        <List items={orders.filter((o) => o.priority === 'URGENT' && o.status !== 'COMPLETED').map((o) => ({ id: o.id, icon: 'FlaskConical', tone: 'red', title: `${o.test} — ${o.patient}`, subtitle: `Ordered by ${o.orderedBy}`, right: <Badge>{o.status}</Badge> }))} empty="No urgent orders." />
      </Card>
    </>
  )
}

export function Worklist() {
  const [rows] = useCollection('labOrders')
  const [q, setQ] = useState('')
  return (
    <>
      <PageHeader title="Worklist" />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Patient, test or order ID" /></div>
      <Card pad={false}>
        <Table rows={filterRows(rows, q, ['patient', 'test', 'id'])} columns={[
          { label: 'Order', key: 'id' }, { label: 'Patient', key: 'patient' }, { label: 'Test', render: (r) => <b>{r.test}</b> }, { label: 'Priority', render: (r) => <Badge>{r.priority}</Badge> },
          { label: 'Sample', render: (r) => <Badge>{r.sample}</Badge> }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }, { label: 'Ordered', render: (r) => fmtDate(r.orderedAt, true) },
        ]} />
      </Card>
    </>
  )
}

export function Samples() {
  const toast = useToast()
  const [rows, api] = useCollection('labOrders')
  return (
    <>
      <PageHeader title="Sample Collection" subtitle="Confirm identity with two identifiers, then print the barcode label." />
      <Card pad={false}>
        <Table rows={rows.filter((r) => r.sample === 'PENDING')} empty="No samples to collect." columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Test', key: 'test' }, { label: 'Priority', render: (r) => <Badge>{r.priority}</Badge> },
          { label: '', render: (r) => <Button size="sm" icon="Syringe" onClick={() => { api.update(r.id, { sample: 'COLLECTED', status: 'IN_PROGRESS' }); toast(`Sample collected — label ${r.id.toUpperCase()}-S1 printed`) }}>Collected</Button> },
        ]} />
      </Card>
    </>
  )
}

export function ResultEntry() {
  const toast = useToast()
  const { user } = useAuth()
  const [rows, api] = useCollection('labOrders')
  const [sel, setSel] = useState(null)
  const [f, setF] = useState({ summary: '', flag: 'NORMAL', comment: '' })
  return (
    <>
      <PageHeader title="Result Entry & Verification" subtitle="Results are signed by a licensed scientist. After release, changes need an amendment." />
      <Card pad={false}>
        <Table rows={rows.filter((r) => r.status === 'IN_PROGRESS' || (r.status === 'COMPLETED' && !r.released))} empty="Nothing to enter." columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Test', key: 'test' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'IN_PROGRESS'
            ? <Button size="sm" onClick={() => { setSel(r); setF({ summary: '', flag: 'NORMAL', comment: '' }) }}>Enter result</Button>
            : <Button size="sm" onClick={() => { api.update(r.id, { released: true }); toast('Verified & released to doctor and patient') }}>Verify & release</Button> },
        ]} />
      </Card>
      <Modal open={!!sel} title={`${sel?.test} — ${sel?.patient}`} onClose={() => setSel(null)} footer={<Button disabled={!f.summary} onClick={() => { api.update(sel.id, { status: 'COMPLETED', result: { summary: f.summary, flag: f.flag }, verifiedBy: user.name }); setSel(null); toast('Result saved — awaiting release') }}>Save & sign</Button>}>
        <div className="form">
          <Field label="Result" as="textarea" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} placeholder="e.g. Hb 11.2 g/dL, WBC 6.4" />
          <Field label="Flag" as="select" options={['NORMAL', 'HIGH', 'LOW', 'CRITICAL']} value={f.flag} onChange={(e) => setF({ ...f, flag: e.target.value })} />
          <Field label="Scientist comment" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} />
          {f.flag === 'CRITICAL' && <Alert tone="danger">Critical values are phoned to the ordering doctor and logged.</Alert>}
          <small className="muted">Signed as {user.name} · {user.license}</small>
        </div>
      </Modal>
    </>
  )
}

export function LabImaging() {
  const toast = useToast()
  const [rows, api] = useCollection('imagingStudies')
  const [sel, setSel] = useState(null)
  const [report, setReport] = useState('')
  return (
    <>
      <PageHeader title="Imaging Studies" />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Study', key: 'study' }, { label: 'Modality', key: 'modality' }, { label: 'Date', render: (r) => fmtDate(r.at, true) },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status !== 'REPORTED' && <Button size="sm" onClick={() => { setSel(r); setReport('') }}>{r.status === 'SCHEDULED' ? 'Acquire' : 'Report'}</Button> },
        ]} />
      </Card>
      <Modal open={!!sel} title={sel?.study} onClose={() => setSel(null)} footer={
        sel?.status === 'SCHEDULED'
          ? <Button onClick={() => { api.update(sel.id, { status: 'AWAITING_REPORT' }); setSel(null); toast('Images uploaded to PACS') }}>Images acquired</Button>
          : <Button disabled={!report} onClick={() => { api.update(sel.id, { status: 'REPORTED', report }); setSel(null); toast('Report signed & released') }}>Sign report</Button>
      }>
        {sel?.status !== 'SCHEDULED' && <Field label="Radiology report" as="textarea" rows={6} value={report} onChange={(e) => setReport(e.target.value)} />}
      </Modal>
    </>
  )
}

export function Released() {
  const [rows] = useCollection('labOrders')
  return (
    <>
      <PageHeader title="Released Results" subtitle="Each result carries: laboratory → result → authorised professional → timestamp." />
      <Card pad={false}>
        <Table rows={rows.filter((r) => r.released)} columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Test', key: 'test' }, { label: 'Result', render: (r) => <span className={r.result?.flag === 'HIGH' ? 'text-danger' : ''}>{r.result?.summary}</span> },
          { label: 'Verified by', key: 'verifiedBy' }, { label: 'Ordered', render: (r) => fmtDate(r.orderedAt, true) },
        ]} />
      </Card>
    </>
  )
}

export function Amendments() {
  const toast = useToast()
  const { user } = useAuth()
  const [rows, api] = useCollection('labAmendments')
  const [orders] = useCollection('labOrders')
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ orderId: '', reason: '' })
  return (
    <>
      <PageHeader title="Result Amendments" subtitle="Released results are never edited in place. Corrections need a reason and a second scientist's approval." actions={<Button icon="Plus" onClick={() => setOpen(true)}>Request amendment</Button>} />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Patient', key: 'patient' }, { label: 'Test', key: 'test' }, { label: 'Reason', key: 'reason' }, { label: 'Requested by', key: 'requestedBy' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'PENDING_APPROVAL' && r.requestedBy !== user.name && <Button size="sm" onClick={() => { api.update(r.id, { status: 'APPROVED' }); toast('Amendment approved — doctor & patient notified') }}>Approve</Button> },
        ]} />
      </Card>
      <Modal open={open} title="Request amendment" onClose={() => setOpen(false)} footer={<Button onClick={() => { const o = orders.find((x) => x.id === f.orderId); api.add({ ...f, patient: o?.patient, test: o?.test, requestedBy: user.name, status: 'PENDING_APPROVAL', at: new Date().toISOString() }); setOpen(false); toast('Sent for second signature') }}>Submit</Button>}>
        <div className="form">
          <Field label="Released result" as="select" options={[{ value: '', label: 'Select…' }, ...orders.filter((o) => o.released).map((o) => ({ value: o.id, label: `${o.test} — ${o.patient}` }))]} value={f.orderId} onChange={(e) => setF({ ...f, orderId: e.target.value })} />
          <Field label="Reason for correction" as="textarea" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </div>
      </Modal>
    </>
  )
}

/* ===================================================================== */
/*                             BILLING OFFICER                           */
/* ===================================================================== */
export function BillingDashboard() {
  const [inv] = useCollection('invoices')
  const [claims] = useCollection('claims')
  const [pay] = useCollection('payments')
  return (
    <>
      <PageHeader title="Billing & Revenue" />
      <StatGrid items={[
        { label: 'Collected (7 days)', value: naira(pay.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0)), icon: 'Banknote', tone: 'teal' },
        { label: 'Unpaid invoices', value: naira(inv.filter((i) => i.status === 'UNPAID').reduce((s, i) => s + i.amount, 0)), icon: 'Receipt', tone: 'yellow' },
        { label: 'Claims pending', value: claims.filter((c) => ['SUBMITTED', 'UNDER_REVIEW', 'QUERIED'].includes(c.status)).length, icon: 'FileCheck', tone: 'blue' },
        { label: 'Claims queried', value: claims.filter((c) => c.status === 'QUERIED').length, icon: 'CircleAlert', tone: 'pink' },
      ]} />
      <Grid>
        <Card title="Revenue by payer (₦ thousands)"><BarChart data={[{ label: 'Self-pay', value: 83 }, { label: 'AXA', value: 92 }, { label: 'NHIA', value: 15 }, { label: 'Hygeia', value: 40 }, { label: 'Ilera Eko', value: 22 }]} /></Card>
        <Card title="Needs attention">
          <List items={claims.filter((c) => c.status === 'QUERIED' || c.status === 'REJECTED').map((c) => ({ id: c.id, icon: 'FileWarning', tone: 'red', title: `${c.id} — ${c.enrollee}`, subtitle: c.query, right: <Badge>{c.status}</Badge> }))} empty="Nothing needs attention." />
        </Card>
      </Grid>
    </>
  )
}

export function Invoices() {
  const toast = useToast()
  const [rows, api] = useCollection('invoices')
  const [, claims] = useCollection('claims')
  const [open, setOpen] = useState(false)
  const [patients] = useCollection('patients')
  const [prices] = useCollection('priceList')
  const [f, setF] = useState({ patient: patients[0]?.name, service: prices[0]?.service, payer: 'Self-pay' })
  return (
    <>
      <PageHeader title="Invoices & Charge Capture" actions={<Button icon="Plus" onClick={() => setOpen(true)}>New invoice</Button>} />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Invoice', key: 'id' }, { label: 'Patient', key: 'patient' }, { label: 'Items', key: 'items' }, { label: 'Amount', render: (r) => naira(r.amount) },
          { label: 'Payer', key: 'payer' }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'UNPAID' && r.payer !== 'Self-pay' && <Button size="sm" onClick={() => {
            claims.add({ invoice: r.id, enrollee: r.patient, enrolleeId: '—', provider: 'LUTH, Idi-Araba', payer: r.payer, amount: r.amount, diagnosis: '—', status: 'SUBMITTED', submittedAt: new Date().toISOString() })
            api.update(r.id, { status: 'CLAIM_SUBMITTED' }); toast('Claim submitted to payer')
          }}>Submit claim</Button> },
        ]} />
      </Card>
      <Modal open={open} title="New invoice" onClose={() => setOpen(false)} footer={<Button onClick={() => {
        const price = prices.find((p) => p.service === f.service)
        api.add({ id: `INV-${10236 + rows.length}`, patient: f.patient, items: f.service, amount: f.payer.startsWith('NHIA') ? price.nhia : price.price, payer: f.payer, status: 'UNPAID', at: new Date().toISOString() })
        setOpen(false); toast('Invoice created & sent to patient')
      }}>Create</Button>}>
        <div className="form">
          <Field label="Patient" as="select" options={patients.map((p) => p.name)} value={f.patient} onChange={(e) => setF({ ...f, patient: e.target.value })} />
          <Field label="Service" as="select" options={prices.map((p) => p.service)} value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })} />
          <Field label="Payer" as="select" options={['Self-pay', 'AXA Mansard Health', 'NHIA (FSSHIP)', 'Hygeia HMO']} value={f.payer} onChange={(e) => setF({ ...f, payer: e.target.value })} />
        </div>
      </Modal>
    </>
  )
}

export function Payments() {
  const [rows] = useCollection('payments')
  return (
    <>
      <PageHeader title="Payments" subtitle="Processed by licensed PSPs. Healthchatter keeps 10%, settled automatically." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Ref', key: 'id' }, { label: 'Invoice', key: 'invoice' }, { label: 'Patient', key: 'patient' }, { label: 'Amount', render: (r) => naira(r.amount) },
          { label: 'Method', key: 'method' }, { label: 'Platform fee', render: (r) => naira(r.platformFee) }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }, { label: 'Date', render: (r) => fmtDate(r.at, true) },
        ]} />
      </Card>
    </>
  )
}

export function BillingClaims() {
  const toast = useToast()
  const [rows, api] = useCollection('claims')
  const [sel, setSel] = useState(null)
  return (
    <>
      <PageHeader title="Insurance Claims" subtitle="Submitted to NHIA and HMOs via API or file upload. Healthchatter is not an insurer." />
      <Card pad={false}>
        <Table rows={rows} onRowClick={setSel} columns={[
          { label: 'Claim', key: 'id' }, { label: 'Enrollee', key: 'enrollee' }, { label: 'Payer', key: 'payer' }, { label: 'Amount', render: (r) => naira(r.amount) },
          { label: 'Submitted', render: (r) => fmtDate(r.submittedAt) }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
      <Modal open={!!sel} title={sel?.id} onClose={() => setSel(null)} footer={sel?.status === 'QUERIED' && <Button onClick={() => { api.update(sel.id, { status: 'SUBMITTED', query: undefined }); setSel(null); toast('Response & documents sent to payer') }}>Respond & resubmit</Button>}>
        <KeyValue items={[['Enrollee', `${sel?.enrollee} (${sel?.enrolleeId})`], ['Payer', sel?.payer], ['Diagnosis', sel?.diagnosis], ['Amount', naira(sel?.amount)], ['Status', <Badge key="s">{sel?.status}</Badge>]]} />
        {sel?.query && <Alert tone="warning" title="Payer query">{sel.query}</Alert>}
        {sel?.status === 'QUERIED' && <Field label="Attach documents"><input type="file" multiple /></Field>}
      </Modal>
    </>
  )
}

export function BillingRefunds() {
  const toast = useToast()
  const [rows, api] = useCollection('refunds')
  return (
    <>
      <PageHeader title="Refunds" subtitle="Refunds go back through the original payment provider." />
      <Card pad={false}>
        <Table rows={rows} columns={[
          { label: 'Ref', key: 'id' }, { label: 'Patient', key: 'patient' }, { label: 'Amount', render: (r) => naira(r.amount) }, { label: 'Reason', key: 'reason' },
          { label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { label: '', render: (r) => r.status === 'PENDING' && <div className="row-actions"><Button size="sm" onClick={() => { api.update(r.id, { status: 'COMPLETED' }); toast('Refund issued via Paystack') }}>Approve</Button><Button size="sm" variant="ghost" onClick={() => api.update(r.id, { status: 'REJECTED' })}>Reject</Button></div> },
        ]} />
      </Card>
    </>
  )
}

export function PriceList() {
  const [rows, api] = useCollection('priceList')
  const [tab, setTab] = useState('Services')
  return (
    <>
      <PageHeader title="Price List" subtitle="Self-pay and NHIA tariff per service." actions={<Button icon="Plus" onClick={() => api.add({ service: 'New service', code: 'NEW', price: 0, nhia: 0 })}>Add service</Button>} />
      <Tabs tabs={['Services']} value={tab} onChange={setTab} />
      <Card pad={false}>
        <Table rows={rows} columns={[{ label: 'Code', key: 'code' }, { label: 'Service', key: 'service' }, { label: 'Self-pay', render: (r) => naira(r.price) }, { label: 'NHIA tariff', render: (r) => naira(r.nhia) }]} />
      </Card>
      <Timeline items={[]} />
    </>
  )
}
