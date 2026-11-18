/*
 * Mock data for every role. This is the single place to swap for real API
 * calls later. Patient/doctor data is reused from the mobile app's
 * mockData so both products show the same people.
 */
import * as app from './appData.js'

const today = new Date()
const d = (offsetDays = 0, h = 9, m = 0) => {
  const x = new Date(today)
  x.setDate(x.getDate() + offsetDays)
  x.setHours(h, m, 0, 0)
  return x.toISOString()
}

/* ---------- Demo accounts (one per role). Password for all: demo1234 ---------- */
export const accounts = [
  { id: 'u-pat-1', role: 'PATIENT', name: 'Ada Okafor', email: 'patient@healthchatter.ng', phone: '+234 803 123 4567', status: 'ACTIVE', healthId: 'HC-204981' },
  { id: 'u-doc-1', role: 'DOCTOR', name: 'Dr. Emeka Obi', email: 'doctor@healthchatter.ng', phone: '+234 802 555 0101', status: 'ACTIVE', facility: 'Lagos University Teaching Hospital', specialty: 'Internal Medicine', license: 'MDCN/R/45821' },
  { id: 'u-doc-2', role: 'DOCTOR', name: 'Dr. Kemi Lawal', email: 'pending.doctor@healthchatter.ng', phone: '+234 809 111 2222', status: 'PENDING_VERIFICATION', specialty: 'Pediatrics', license: 'MDCN/R/60233' },
  { id: 'u-nur-1', role: 'NURSE', name: 'Nurse Halima Yusuf', email: 'nurse@healthchatter.ng', phone: '+234 805 222 3344', status: 'ACTIVE', facility: 'Lagos University Teaching Hospital', license: 'NMCN/RN/88213' },
  { id: 'u-chw-1', role: 'CHW', name: 'Musa Ibrahim', email: 'chw@healthchatter.ng', phone: '+234 806 777 1212', status: 'ACTIVE', facility: 'PHC Ikeja', license: 'CHPRBN/2231' },
  { id: 'u-rec-1', role: 'RECEPTIONIST', name: 'Grace Effiong', email: 'reception@healthchatter.ng', phone: '+234 807 333 4545', status: 'ACTIVE', facility: 'Lagos University Teaching Hospital' },
  { id: 'u-pha-1', role: 'PHARMACIST', name: 'Pharm. Tobi Adebayo', email: 'pharmacist@healthchatter.ng', phone: '+234 808 444 5656', status: 'ACTIVE', facility: 'HealthPlus Pharmacy, Yaba', license: 'PCN/PH/10982' },
  { id: 'u-lab-1', role: 'LAB_SCIENTIST', name: 'Chioma Nnaji', email: 'lab@healthchatter.ng', phone: '+234 809 555 6767', status: 'ACTIVE', facility: 'Synlab Diagnostics, Ikeja', license: 'MLSCN/77120' },
  { id: 'u-bil-1', role: 'BILLING_OFFICER', name: 'Samuel Okon', email: 'billing@healthchatter.ng', phone: '+234 810 666 7878', status: 'ACTIVE', facility: 'Lagos University Teaching Hospital' },
  { id: 'u-fac-1', role: 'FACILITY_ADMIN', name: 'Mrs. Funmi Alade', email: 'facility@healthchatter.ng', phone: '+234 811 777 8989', status: 'ACTIVE', facility: 'Lagos University Teaching Hospital' },
  { id: 'u-clm-1', role: 'CLAIMS_OFFICER', name: 'Ibrahim Danjuma', email: 'claims@healthchatter.ng', phone: '+234 812 888 9090', status: 'ACTIVE', payer: 'AXA Mansard Health' },
  { id: 'u-mod-1', role: 'MODERATOR', name: 'Zainab Bello', email: 'moderator@healthchatter.ng', phone: '+234 813 999 0101', status: 'ACTIVE' },
  { id: 'u-dpo-1', role: 'COMPLIANCE_OFFICER', name: 'Barr. Uche Nwankwo', email: 'compliance@healthchatter.ng', phone: '+234 814 000 1212', status: 'ACTIVE' },
  { id: 'u-adm-1', role: 'SUPER_ADMIN', name: 'Victor Emre', email: 'admin@healthchatter.ng', phone: '+234 815 111 2323', status: 'ACTIVE' },
]
export const DEMO_PASSWORD = 'demo1234'
export const DEMO_OTP = '123456'

/* ---------- Clinical ---------- */
export const doctors = app.doctors
export const specialties = app.specialties
export const drugFormulary = app.drugFormulary

export const patients = [
  ...app.providerPatients.map((p, i) => ({
    ...p,
    healthId: p.mrn,
    nin: i % 2 === 0 ? `1234567${8900 + i}` : '',
    phone: `+234 80${3 + i} 123 45${60 + i}`,
    insurance: ['AXA Mansard Health', 'NHIA (FSSHIP)', 'Hygeia HMO', 'Self-pay'][i % 4],
    lga: ['Ikeja', 'Surulere', 'Yaba', 'Lekki'][i % 4],
    allergies: i === 0 ? ['Penicillin', 'Peanuts'] : i === 2 ? ['Aspirin'] : [],
  })),
  { id: 'pt-5', name: 'Fatima Abubakar', age: 29, gender: 'Female', healthId: 'HC-205129', nin: '', phone: '+234 807 223 4411', insurance: 'NHIA (FSSHIP)', lga: 'Mushin', allergies: [], problems: [{ id: 'p9', name: 'Pregnancy — 28 weeks', status: 'Active', since: 'Apr 2026' }], medications: [{ id: 'm9', name: 'Ferrous Sulphate', dosage: '200mg', frequency: 'Once daily' }] },
  { id: 'pt-6', name: 'Oluwaseun Ogunleye', age: 8, gender: 'Male', healthId: 'HC-205166', nin: '', phone: '+234 803 123 4567', insurance: 'AXA Mansard Health', lga: 'Ikeja', allergies: [], guardian: 'Ada Okafor', problems: [{ id: 'p10', name: 'Malaria (treated)', status: 'Resolved', since: 'Sep 2026' }], medications: [] },
]

export const appointments = [
  { id: 'ap-1', patientId: 'pt-1', patient: 'Ada Okafor', doctor: 'Dr. Emeka Obi', specialty: 'Internal Medicine', facility: 'LUTH, Idi-Araba', at: d(0, 10, 30), type: 'TELEMEDICINE', status: 'CONFIRMED', reason: 'Blood pressure review' },
  { id: 'ap-2', patientId: 'pt-2', patient: 'Chinedu Okoro', doctor: 'Dr. Emeka Obi', specialty: 'Internal Medicine', facility: 'LUTH, Idi-Araba', at: d(0, 11, 15), type: 'IN_PERSON', status: 'CONFIRMED', reason: 'Kidney function follow-up' },
  { id: 'ap-3', patientId: 'pt-3', patient: 'Blessing Nwachukwu', doctor: 'Dr. Emeka Obi', specialty: 'Internal Medicine', facility: 'LUTH, Idi-Araba', at: d(0, 13, 0), type: 'IN_PERSON', status: 'PENDING', reason: 'Asthma review' },
  { id: 'ap-4', patientId: 'pt-1', patient: 'Ada Okafor', doctor: 'Dr. Ngozi Adeyemi', specialty: 'General Practice', facility: 'Reddington Hospital, VI', at: d(4, 9, 0), type: 'IN_PERSON', status: 'CONFIRMED', reason: 'Annual check-up' },
  { id: 'ap-5', patientId: 'pt-4', patient: 'Emeka Nnadi', doctor: 'Dr. Emeka Obi', specialty: 'Internal Medicine', facility: 'LUTH, Idi-Araba', at: d(1, 9, 30), type: 'TELEMEDICINE', status: 'CONFIRMED', reason: 'INR result discussion' },
  { id: 'ap-6', patientId: 'pt-1', patient: 'Ada Okafor', doctor: 'Dr. Amina Bello', specialty: 'Cardiology', facility: 'LUTH, Idi-Araba', at: d(-12, 14, 0), type: 'IN_PERSON', status: 'COMPLETED', reason: 'ECG review' },
  { id: 'ap-7', patientId: 'pt-5', patient: 'Fatima Abubakar', doctor: 'Dr. Chiamaka Eze', specialty: 'Gynecology', facility: 'LUTH, Idi-Araba', at: d(0, 15, 0), type: 'IN_PERSON', status: 'CONFIRMED', reason: 'Antenatal visit' },
]

export const inBasket = app.inBasketItems
export const telemedicineQueue = app.telemedicineQueue

export const labOrders = [
  { id: 'lab-1', patientId: 'pt-2', patient: 'Chinedu Okoro', test: 'Basic Metabolic Panel', orderedBy: 'Dr. Emeka Obi', priority: 'URGENT', status: 'COMPLETED', sample: 'COLLECTED', orderedAt: d(-1, 8), result: { summary: 'Potassium 5.8 mmol/L (H)', flag: 'HIGH' }, verifiedBy: 'Chioma Nnaji', released: true },
  { id: 'lab-2', patientId: 'pt-1', patient: 'Ada Okafor', test: 'HbA1c', orderedBy: 'Dr. Emeka Obi', priority: 'ROUTINE', status: 'IN_PROGRESS', sample: 'COLLECTED', orderedAt: d(-1, 10), released: false },
  { id: 'lab-3', patientId: 'pt-4', patient: 'Emeka Nnadi', test: 'INR / PT', orderedBy: 'Dr. Emeka Obi', priority: 'URGENT', status: 'ORDERED', sample: 'PENDING', orderedAt: d(0, 8), released: false },
  { id: 'lab-4', patientId: 'pt-5', patient: 'Fatima Abubakar', test: 'Full Blood Count', orderedBy: 'Dr. Chiamaka Eze', priority: 'ROUTINE', status: 'ORDERED', sample: 'PENDING', orderedAt: d(0, 9), released: false },
  { id: 'lab-5', patientId: 'pt-6', patient: 'Oluwaseun Ogunleye', test: 'Malaria RDT', orderedBy: 'Dr. Ngozi Adeyemi', priority: 'URGENT', status: 'COMPLETED', sample: 'COLLECTED', orderedAt: d(-6, 11), result: { summary: 'Negative', flag: 'NORMAL' }, verifiedBy: 'Chioma Nnaji', released: true },
  { id: 'lab-6', patientId: 'pt-3', patient: 'Blessing Nwachukwu', test: 'Lipid Profile', orderedBy: 'Dr. Emeka Obi', priority: 'ROUTINE', status: 'COMPLETED', sample: 'COLLECTED', orderedAt: d(-3, 9), result: { summary: 'LDL 3.1 mmol/L', flag: 'NORMAL' }, verifiedBy: 'Chioma Nnaji', released: false },
]
export const imagingStudies = [
  { id: 'img-1', patientId: 'pt-1', patient: 'Ada Okafor', study: 'Chest X-Ray (PA)', modality: 'X-Ray', status: 'REPORTED', at: d(-12, 11), report: 'No active lung lesion. Normal cardiac silhouette.' },
  { id: 'img-2', patientId: 'pt-5', patient: 'Fatima Abubakar', study: 'Obstetric Ultrasound', modality: 'Ultrasound', status: 'SCHEDULED', at: d(1, 10), report: '' },
  { id: 'img-3', patientId: 'pt-2', patient: 'Chinedu Okoro', study: 'Renal Ultrasound', modality: 'Ultrasound', status: 'AWAITING_REPORT', at: d(-1, 14), report: '' },
]
export const labAmendments = [
  { id: 'am-1', orderId: 'lab-5', patient: 'Oluwaseun Ogunleye', test: 'Malaria RDT', reason: 'Wrong sample ID transcribed', requestedBy: 'Chioma Nnaji', status: 'PENDING_APPROVAL', at: d(-1, 15) },
]

export const prescriptions = [
  { id: 'rx-1', patientId: 'pt-1', patient: 'Ada Okafor', drug: 'Amlodipine', dosage: '5mg', frequency: 'Once daily, morning', qty: 30, doctor: 'Dr. Emeka Obi', status: 'NEW', at: d(0, 9), pharmacy: 'HealthPlus Pharmacy, Yaba', interaction: null },
  { id: 'rx-2', patientId: 'pt-4', patient: 'Emeka Nnadi', drug: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', qty: 20, doctor: 'Dr. Tunde Fashola', status: 'NEW', at: d(0, 8, 40), pharmacy: 'HealthPlus Pharmacy, Yaba', interaction: 'Interacts with Warfarin — bleeding risk' },
  { id: 'rx-3', patientId: 'pt-3', patient: 'Blessing Nwachukwu', drug: 'Salbutamol Inhaler', dosage: '100mcg', frequency: 'As needed', qty: 1, doctor: 'Dr. Emeka Obi', status: 'READY', at: d(-1, 16), pharmacy: 'HealthPlus Pharmacy, Yaba', interaction: null },
  { id: 'rx-4', patientId: 'pt-2', patient: 'Chinedu Okoro', drug: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', qty: 30, doctor: 'Dr. Emeka Obi', status: 'DISPENSED', at: d(-2, 11), pharmacy: 'HealthPlus Pharmacy, Yaba', interaction: null, dispensedBy: 'Pharm. Tobi Adebayo' },
  { id: 'rx-5', patientId: 'pt-5', patient: 'Fatima Abubakar', drug: 'Ferrous Sulphate', dosage: '200mg', frequency: 'Once daily', qty: 60, doctor: 'Dr. Chiamaka Eze', status: 'DISPENSED', at: d(-5, 10), pharmacy: 'HealthPlus Pharmacy, Yaba', interaction: null, dispensedBy: 'Pharm. Tobi Adebayo' },
]
export const refillRequests = [
  { id: 'rf-1', patient: 'Blessing Nwachukwu', drug: 'Salbutamol Inhaler', lastFilled: d(-28), doctor: 'Dr. Emeka Obi', status: 'AWAITING_DOCTOR' },
  { id: 'rf-2', patient: 'Ada Okafor', drug: 'Metformin 500mg', lastFilled: d(-30), doctor: 'Dr. Emeka Obi', status: 'APPROVED' },
]
export const inventory = [
  { id: 'inv-1', drug: 'Amlodipine 5mg', stock: 420, reorder: 200, expiry: '2027-08', batch: 'AMD-2291' },
  { id: 'inv-2', drug: 'Metformin 500mg', stock: 150, reorder: 300, expiry: '2027-03', batch: 'MTF-1180' },
  { id: 'inv-3', drug: 'Artemether/Lumefantrine 80/480', stock: 64, reorder: 100, expiry: '2026-12', batch: 'ACT-5521' },
  { id: 'inv-4', drug: 'Salbutamol Inhaler 100mcg', stock: 38, reorder: 20, expiry: '2027-11', batch: 'SAL-0912' },
  { id: 'inv-5', drug: 'Amoxicillin 500mg', stock: 0, reorder: 150, expiry: '2027-05', batch: 'AMX-3310' },
  { id: 'inv-6', drug: 'Lisinopril 10mg', stock: 260, reorder: 120, expiry: '2028-01', batch: 'LSN-7742' },
]
export const deliveries = [
  { id: 'dl-1', rx: 'rx-4', patient: 'Chinedu Okoro', address: '14 Adeniran Ogunsanya St, Surulere', courier: 'Kwik Delivery', status: 'DELIVERED', eta: d(-2, 15) },
  { id: 'dl-2', rx: 'rx-3', patient: 'Blessing Nwachukwu', address: '3 Herbert Macaulay Way, Yaba', courier: 'GIG Logistics', status: 'OUT_FOR_DELIVERY', eta: d(0, 14) },
]

export const referrals = [
  { id: 'ref-1', patient: 'Chinedu Okoro', from: 'Dr. Emeka Obi', toSpecialty: 'Nephrology', toFacility: 'LUTH Renal Unit', reason: 'CKD stage 3 progression', status: 'SCHEDULED', at: d(-3) },
  { id: 'ref-2', patient: 'Emeka Nnadi', from: 'Dr. Emeka Obi', toSpecialty: 'Cardiology', toFacility: 'Lagos Heart Centre', reason: 'AF rate control', status: 'PENDING', at: d(-1) },
  { id: 'ref-3', patient: 'Fatima Abubakar', from: 'Musa Ibrahim (CHW)', toSpecialty: 'Obstetrics', toFacility: 'LUTH', reason: 'High BP at 28 weeks', status: 'PENDING', at: d(0) },
]

/* ---------- Nursing / ward ---------- */
export const triageQueue = [
  { id: 'tr-1', patient: 'Kelechi Umeh', age: 34, complaint: 'Chest pain, sweating', arrived: d(0, 9, 5), level: 'RED', status: 'WAITING' },
  { id: 'tr-2', patient: 'Fatima Abubakar', age: 29, complaint: 'Headache, swollen feet (28 wks)', arrived: d(0, 9, 20), level: 'ORANGE', status: 'WAITING' },
  { id: 'tr-3', patient: 'Yusuf Garba', age: 61, complaint: 'Fever for 3 days', arrived: d(0, 9, 40), level: 'YELLOW', status: 'IN_ASSESSMENT' },
  { id: 'tr-4', patient: 'Amaka Obi', age: 22, complaint: 'Sprained ankle', arrived: d(0, 10, 0), level: 'GREEN', status: 'WAITING' },
]
export const wards = [
  { id: 'w-1', name: 'Male Medical Ward', beds: 24, occupied: 21 },
  { id: 'w-2', name: 'Female Medical Ward', beds: 24, occupied: 17 },
  { id: 'w-3', name: 'Maternity Ward', beds: 18, occupied: 15 },
  { id: 'w-4', name: 'Paediatrics Ward', beds: 20, occupied: 9 },
]
export const beds = Array.from({ length: 12 }, (_, i) => ({
  id: `bed-${i + 1}`,
  ward: 'Male Medical Ward',
  label: `MMW-${String(i + 1).padStart(2, '0')}`,
  patient: [null, 'Chinedu Okoro', 'Yusuf Garba', null, 'Emeka Nnadi', 'Ibrahim Sule', 'Tunde Bakare', null, 'Gbenga Ade', 'Ola Bamidele', null, 'Kunle Ojo'][i],
  status: [null, 'OCCUPIED', 'OCCUPIED', 'CLEANING', 'OCCUPIED', 'OCCUPIED', 'DISCHARGE_DUE', 'AVAILABLE', 'OCCUPIED', 'OCCUPIED', 'AVAILABLE', 'OCCUPIED'][i] ?? 'AVAILABLE',
}))
export const nursingTasks = [
  { id: 'nt-1', patient: 'Chinedu Okoro', bed: 'MMW-02', task: 'Lisinopril 10mg PO', type: 'MAR', due: d(0, 10), status: 'DUE' },
  { id: 'nt-2', patient: 'Yusuf Garba', bed: 'MMW-03', task: 'Vitals every 4 hours', type: 'OBS', due: d(0, 10, 30), status: 'DUE' },
  { id: 'nt-3', patient: 'Emeka Nnadi', bed: 'MMW-05', task: 'Warfarin 5mg PO', type: 'MAR', due: d(0, 18), status: 'SCHEDULED' },
  { id: 'nt-4', patient: 'Ibrahim Sule', bed: 'MMW-06', task: 'Wound dressing', type: 'CARE', due: d(0, 9), status: 'DONE' },
  { id: 'nt-5', patient: 'Tunde Bakare', bed: 'MMW-07', task: 'Discharge education', type: 'CARE', due: d(0, 12), status: 'DUE' },
]
export const syncQueue = [
  { id: 'sq-1', item: 'Vitals — Yusuf Garba', createdAt: d(0, 7, 40), status: 'QUEUED' },
  { id: 'sq-2', item: 'Home visit note — Mama Chika', createdAt: d(0, 8, 10), status: 'QUEUED' },
  { id: 'sq-3', item: 'New registration — Bisi Ade', createdAt: d(-1, 16), status: 'SYNCED' },
]

/* ---------- Community ---------- */
export const homeVisits = [
  { id: 'hv-1', household: 'Okonkwo Family', address: 'Agege Motor Rd, Mushin', purpose: 'Antenatal follow-up', at: d(0, 10), status: 'PLANNED' },
  { id: 'hv-2', household: 'Mama Chika', address: 'Oshodi Market Lane', purpose: 'Hypertension check', at: d(0, 12), status: 'DONE' },
  { id: 'hv-3', household: 'Bello Household', address: '22 Ladipo St, Mushin', purpose: 'Child immunization (Penta 3)', at: d(1, 9), status: 'PLANNED' },
  { id: 'hv-4', household: 'Adewale Family', address: 'Idi-Oro, Mushin', purpose: 'TB DOTS observation', at: d(1, 11), status: 'PLANNED' },
]
export const screenings = [
  { id: 'sc-1', name: 'Mama Chika', type: 'Blood pressure', result: '162/98', flag: 'HIGH', at: d(0, 12) },
  { id: 'sc-2', name: 'Bisi Ade', type: 'MUAC (child)', result: '13.2 cm', flag: 'NORMAL', at: d(-1, 15) },
  { id: 'sc-3', name: 'Kola Ade', type: 'Malaria RDT', result: 'Positive', flag: 'HIGH', at: d(-1, 15, 30) },
]

/* ---------- Reception ---------- */
export const checkins = [
  { id: 'ci-1', patient: 'Ada Okafor', healthId: 'HC-204981', appt: '10:30 Dr. Emeka Obi', status: 'CHECKED_IN', at: d(0, 10, 5) },
  { id: 'ci-2', patient: 'Chinedu Okoro', healthId: 'HC-205018', appt: '11:15 Dr. Emeka Obi', status: 'WAITING', at: d(0, 10, 50) },
  { id: 'ci-3', patient: 'Fatima Abubakar', healthId: 'HC-205129', appt: '15:00 Dr. Chiamaka Eze', status: 'EXPECTED', at: d(0, 15) },
]
export const admissions = [
  { id: 'adt-1', patient: 'Yusuf Garba', type: 'ADMISSION', ward: 'Male Medical Ward', bed: 'MMW-03', at: d(-1, 22), by: 'Grace Effiong' },
  { id: 'adt-2', patient: 'Tunde Bakare', type: 'DISCHARGE', ward: 'Male Medical Ward', bed: 'MMW-07', at: d(0, 12), by: 'Pending' },
  { id: 'adt-3', patient: 'Ngozi Eke', type: 'TRANSFER', ward: 'ICU → Female Medical', bed: 'FMW-11', at: d(-1, 9), by: 'Nurse Halima Yusuf' },
]

/* ---------- Billing & claims ---------- */
export const invoices = [
  { id: 'INV-10231', patient: 'Ada Okafor', items: 'Consultation, HbA1c', amount: 28500, payer: 'AXA Mansard Health', status: 'CLAIM_SUBMITTED', at: d(-1) },
  { id: 'INV-10232', patient: 'Chinedu Okoro', items: 'BMP, Renal ultrasound', amount: 41000, payer: 'Self-pay', status: 'UNPAID', at: d(-1) },
  { id: 'INV-10233', patient: 'Blessing Nwachukwu', items: 'Consultation, Lipid profile', amount: 22000, payer: 'Self-pay', status: 'PAID', at: d(-3) },
  { id: 'INV-10234', patient: 'Fatima Abubakar', items: 'Antenatal visit, FBC', amount: 15000, payer: 'NHIA (FSSHIP)', status: 'CLAIM_SUBMITTED', at: d(0) },
  { id: 'INV-10235', patient: 'Emeka Nnadi', items: 'Telemedicine consult', amount: 20000, payer: 'Self-pay', status: 'PAID', at: d(-2) },
]
export const payments = [
  { id: 'PAY-7781', invoice: 'INV-10233', patient: 'Blessing Nwachukwu', amount: 22000, method: 'Card (Paystack)', at: d(-3, 14), status: 'SUCCESS', platformFee: 2200 },
  { id: 'PAY-7782', invoice: 'INV-10235', patient: 'Emeka Nnadi', amount: 20000, method: 'Bank transfer (Flutterwave)', at: d(-2, 10), status: 'SUCCESS', platformFee: 2000 },
  { id: 'PAY-7783', invoice: 'INV-10232', patient: 'Chinedu Okoro', amount: 41000, method: 'USSD (Moniepoint)', at: d(0, 9), status: 'FAILED', platformFee: 0 },
]
export const claims = [
  { id: 'CLM-55012', invoice: 'INV-10231', enrollee: 'Ada Okafor', enrolleeId: 'AXA-GLD-001928', provider: 'LUTH, Idi-Araba', payer: 'AXA Mansard Health', amount: 28500, diagnosis: 'I10 Essential hypertension', status: 'UNDER_REVIEW', submittedAt: d(-1, 15) },
  { id: 'CLM-55013', invoice: 'INV-10234', enrollee: 'Fatima Abubakar', enrolleeId: 'NHIA-FS-77120', provider: 'LUTH, Idi-Araba', payer: 'NHIA (FSSHIP)', amount: 15000, diagnosis: 'Z34 Supervision of normal pregnancy', status: 'SUBMITTED', submittedAt: d(0, 11) },
  { id: 'CLM-54990', invoice: 'INV-10198', enrollee: 'Kunle Ojo', enrolleeId: 'AXA-SLV-004411', provider: 'Reddington Hospital, VI', payer: 'AXA Mansard Health', amount: 180000, diagnosis: 'K35 Acute appendicitis', status: 'QUERIED', submittedAt: d(-4, 10), query: 'Attach operation note and histology.' },
  { id: 'CLM-54971', invoice: 'INV-10177', enrollee: 'Ngozi Eke', enrolleeId: 'AXA-GLD-002288', provider: 'LUTH, Idi-Araba', payer: 'AXA Mansard Health', amount: 64000, diagnosis: 'J18 Pneumonia', status: 'APPROVED', submittedAt: d(-8, 9) },
  { id: 'CLM-54960', invoice: 'INV-10170', enrollee: 'Segun Arinze', enrolleeId: 'AXA-BRZ-009812', provider: 'Evercare Hospital, Lekki', payer: 'AXA Mansard Health', amount: 95000, diagnosis: 'M54 Low back pain (MRI)', status: 'REJECTED', submittedAt: d(-9, 14), query: 'MRI not covered on Bronze plan without pre-authorization.' },
]
export const refunds = [
  { id: 'RF-301', payment: 'PAY-7760', patient: 'Kemi Ade', amount: 15000, reason: 'Doctor cancelled telemedicine', status: 'PENDING', at: d(-1) },
  { id: 'RF-300', payment: 'PAY-7731', patient: 'Bola Ige', amount: 8000, reason: 'Duplicate charge', status: 'COMPLETED', at: d(-6) },
]
export const priceList = [
  { id: 'pr-1', service: 'General consultation', code: 'CONS-GP', price: 10000, nhia: 6500 },
  { id: 'pr-2', service: 'Specialist consultation', code: 'CONS-SP', price: 20000, nhia: 12000 },
  { id: 'pr-3', service: 'Telemedicine consultation', code: 'TELE-01', price: 15000, nhia: 9000 },
  { id: 'pr-4', service: 'Full blood count', code: 'LAB-FBC', price: 5000, nhia: 3500 },
  { id: 'pr-5', service: 'HbA1c', code: 'LAB-A1C', price: 12000, nhia: 8000 },
  { id: 'pr-6', service: 'Chest X-ray', code: 'IMG-CXR', price: 18000, nhia: 12000 },
]
export const preauths = [
  { id: 'PA-901', enrollee: 'Segun Arinze', provider: 'Evercare Hospital, Lekki', procedure: 'Lumbar spine MRI', amount: 95000, status: 'PENDING', at: d(0, 9) },
  { id: 'PA-900', enrollee: 'Kunle Ojo', provider: 'Reddington Hospital, VI', procedure: 'Appendicectomy', amount: 180000, status: 'APPROVED', at: d(-5, 8) },
]
export const enrollees = [
  { id: 'AXA-GLD-001928', name: 'Ada Okafor', plan: 'Gold', status: 'ACTIVE', dependants: 1, expires: '2027-03-31', utilization: 34 },
  { id: 'AXA-SLV-004411', name: 'Kunle Ojo', plan: 'Silver', status: 'ACTIVE', dependants: 3, expires: '2027-01-31', utilization: 71 },
  { id: 'AXA-BRZ-009812', name: 'Segun Arinze', plan: 'Bronze', status: 'ACTIVE', dependants: 0, expires: '2026-12-31', utilization: 88 },
  { id: 'AXA-GLD-002288', name: 'Ngozi Eke', plan: 'Gold', status: 'LAPSED', dependants: 2, expires: '2026-10-31', utilization: 12 },
]

/* ---------- Platform / facilities ---------- */
export const facilities = [
  { id: 'fac-1', name: 'Lagos University Teaching Hospital', type: 'Tertiary hospital', state: 'Lagos', status: 'VERIFIED', staff: 412, regNo: 'LSMOH/HF/0012' },
  { id: 'fac-2', name: 'Reddington Hospital, VI', type: 'Private hospital', state: 'Lagos', status: 'VERIFIED', staff: 188, regNo: 'HEFAMAA/0841' },
  { id: 'fac-3', name: 'PHC Ikeja', type: 'Primary health centre', state: 'Lagos', status: 'VERIFIED', staff: 26, regNo: 'LSPHCB/IK/03' },
  { id: 'fac-4', name: 'Synlab Diagnostics, Ikeja', type: 'Laboratory', state: 'Lagos', status: 'VERIFIED', staff: 54, regNo: 'MLSCN/LAB/2231' },
  { id: 'fac-5', name: 'HealthPlus Pharmacy, Yaba', type: 'Pharmacy', state: 'Lagos', status: 'VERIFIED', staff: 12, regNo: 'PCN/PR/77812' },
  { id: 'fac-6', name: 'Garki Family Clinic', type: 'Private clinic', state: 'FCT', status: 'PENDING', staff: 9, regNo: 'FCT/HHSS/1192' },
  { id: 'fac-7', name: 'Kano Specialist Diagnostics', type: 'Laboratory', state: 'Kano', status: 'PENDING', staff: 15, regNo: 'MLSCN/LAB/3307' },
]
export const hmos = [
  { id: 'hmo-1', name: 'NHIA (FSSHIP)', type: 'Government', accredited: true, enrollees: '1.2M', integration: 'File-based' },
  { id: 'hmo-2', name: 'AXA Mansard Health', type: 'Private HMO', accredited: true, enrollees: '320k', integration: 'API' },
  { id: 'hmo-3', name: 'Hygeia HMO', type: 'Private HMO', accredited: true, enrollees: '410k', integration: 'API' },
  { id: 'hmo-4', name: 'Reliance Health', type: 'Private HMO', accredited: true, enrollees: '150k', integration: 'Pending' },
  { id: 'hmo-5', name: 'Lagos State Health Scheme (Ilera Eko)', type: 'State scheme', accredited: true, enrollees: '880k', integration: 'File-based' },
]
export const verifications = [
  { id: 'vf-1', name: 'Dr. Kemi Lawal', role: 'DOCTOR', regulator: 'MDCN', license: 'MDCN/R/60233', specialty: 'Pediatrics', submitted: d(-1, 10), docs: ['Practising licence 2026', 'MBBS certificate', 'Government ID'], registryMatch: true, status: 'PENDING' },
  { id: 'vf-2', name: 'Nurse Aisha Musa', role: 'NURSE', regulator: 'NMCN', license: 'NMCN/RN/90122', specialty: 'Midwifery', submitted: d(-2, 14), docs: ['NMCN licence', 'Government ID'], registryMatch: true, status: 'PENDING' },
  { id: 'vf-3', name: 'Pharm. Dayo Ojo', role: 'PHARMACIST', regulator: 'PCN', license: 'PCN/PH/22018', specialty: 'Community pharmacy', submitted: d(-2, 9), docs: ['PCN licence (expired 2025)', 'Government ID'], registryMatch: false, status: 'PENDING' },
  { id: 'vf-4', name: 'Dr. Bayo Akin', role: 'DOCTOR', regulator: 'MDCN', license: 'MDCN/R/51190', specialty: 'Cardiology', submitted: d(-6, 11), docs: ['Practising licence 2026', 'Government ID', 'Indemnity cover'], registryMatch: true, status: 'APPROVED' },
]
export const complaints = [
  { id: 'cp-1', from: 'Ada Okafor', against: 'Dr. Tunde Fashola', category: 'Professional conduct', summary: 'Doctor ended telemedicine call after 3 minutes and still charged.', severity: 'MEDIUM', status: 'OPEN', at: d(-1) },
  { id: 'cp-2', from: 'Chinedu Okoro', against: 'HealthPlus Pharmacy, Yaba', category: 'Wrong medication', summary: 'Received 5mg instead of 10mg Lisinopril.', severity: 'HIGH', status: 'INVESTIGATING', at: d(-2) },
  { id: 'cp-3', from: 'Anonymous', against: 'Platform', category: 'Billing', summary: 'Charged twice for one consultation.', severity: 'LOW', status: 'RESOLVED', at: d(-7) },
]
export const reviews = [
  { id: 'rv-1', author: 'Blessing N.', target: 'Dr. Emeka Obi', rating: 5, text: 'Very patient and explained everything clearly.', status: 'PUBLISHED' },
  { id: 'rv-2', author: 'Kola A.', target: 'Dr. Tunde Fashola', rating: 1, text: 'This doctor is a fraud!!! call me on 0803xxxxxxx for real drugs', status: 'FLAGGED', flag: 'Contains phone number / solicitation' },
  { id: 'rv-3', author: 'Health Education Team', target: 'Article: Managing malaria at home', rating: null, text: 'Draft article awaiting clinical review.', status: 'PENDING_REVIEW' },
]
export const aiFlags = [
  { id: 'ai-1', user: 'Ada Okafor', prompt: 'I have chest pain spreading to my left arm, what tablet can I take?', response: 'This could be a medical emergency. Call 112 or go to the nearest emergency department now.', flag: 'EMERGENCY_ESCALATION', model: 'hc-assist-v1.3', status: 'AUTO_ESCALATED', at: d(0, 8) },
  { id: 'ai-2', user: 'Kemi Ade', prompt: 'Can I double my metformin dose since sugar is high?', response: 'I can’t change medication doses. Please contact your doctor — would you like to message Dr. Obi?', flag: 'MEDICATION_ADVICE', model: 'hc-assist-v1.3', status: 'NEEDS_REVIEW', at: d(-1, 19) },
  { id: 'ai-3', user: 'Tunde B.', prompt: 'What are symptoms of typhoid?', response: 'Common symptoms include prolonged fever, weakness, stomach pain…', flag: 'NONE', model: 'hc-assist-v1.3', status: 'OK', at: d(-1, 12) },
]
export const suspended = [
  { id: 'su-1', name: 'Dr. Femi Ola', role: 'DOCTOR', reason: 'MDCN licence lapsed', since: d(-14), until: 'Licence renewal' },
  { id: 'su-2', name: 'quickmeds_ng', role: 'PHARMACIST', reason: 'Selling prescription-only drugs without Rx', since: d(-30), until: 'Permanent' },
]

/* ---------- Compliance ---------- */
export const auditLog = [
  { id: 'al-1', at: d(0, 10, 12), actor: 'Dr. Emeka Obi', role: 'DOCTOR', action: 'VIEW', resource: 'Chart — Ada Okafor (HC-204981)', ip: '102.89.14.22', facility: 'LUTH' },
  { id: 'al-2', at: d(0, 10, 3), actor: 'Grace Effiong', role: 'RECEPTIONIST', action: 'UPDATE', resource: 'Demographics — Chinedu Okoro', ip: '102.89.14.31', facility: 'LUTH' },
  { id: 'al-3', at: d(0, 9, 55), actor: 'Chioma Nnaji', role: 'LAB_SCIENTIST', action: 'RELEASE', resource: 'Result BMP — Chinedu Okoro', ip: '41.58.200.4', facility: 'Synlab' },
  { id: 'al-4', at: d(0, 2, 14), actor: 'Nurse Halima Yusuf', role: 'NURSE', action: 'BREAK_GLASS', resource: 'Chart — Kelechi Umeh (unconscious, ED)', ip: '102.89.14.40', facility: 'LUTH' },
  { id: 'al-5', at: d(-1, 22, 41), actor: 'Grace Effiong', role: 'RECEPTIONIST', action: 'DENIED', resource: 'Psychiatry notes — Blessing Nwachukwu', ip: '102.89.14.31', facility: 'LUTH' },
  { id: 'al-6', at: d(-1, 18, 2), actor: 'Pharm. Tobi Adebayo', role: 'PHARMACIST', action: 'DISPENSE', resource: 'Rx-4 Lisinopril — Chinedu Okoro', ip: '197.210.8.12', facility: 'HealthPlus' },
  { id: 'al-7', at: d(-1, 9, 0), actor: 'Victor Emre', role: 'SUPER_ADMIN', action: 'ROLE_CHANGE', resource: 'User Zainab Bello → MODERATOR', ip: '102.89.1.5', facility: 'Platform' },
]
export const breakGlass = [
  { id: 'bg-1', actor: 'Nurse Halima Yusuf', patient: 'Kelechi Umeh', reason: 'Unconscious patient in ED — needed allergies & meds', at: d(0, 2, 14), status: 'PENDING_REVIEW' },
  { id: 'bg-2', actor: 'Dr. Emeka Obi', patient: 'Ngozi Eke', reason: 'Transferred from ICU at night, chart not yet shared', at: d(-3, 23, 5), status: 'JUSTIFIED' },
]
export const consentTypes = [
  'Account', 'Privacy notice', 'Telemedicine', 'Record sharing across facilities', 'Lab result sharing', 'Insurance information sharing', 'AI interaction', 'Marketing',
]
export const consents = [
  { id: 'cs-1', patient: 'Ada Okafor', type: 'Telemedicine', status: 'GRANTED', at: d(-60) },
  { id: 'cs-2', patient: 'Ada Okafor', type: 'AI interaction', status: 'GRANTED', at: d(-60) },
  { id: 'cs-3', patient: 'Ada Okafor', type: 'Marketing', status: 'WITHDRAWN', at: d(-10) },
  { id: 'cs-4', patient: 'Chinedu Okoro', type: 'Record sharing across facilities', status: 'GRANTED', at: d(-120) },
  { id: 'cs-5', patient: 'Oluwaseun Ogunleye (minor)', type: 'Telemedicine', status: 'GRANTED_BY_GUARDIAN', at: d(-40) },
]
export const dataRequests = [
  { id: 'dsr-1', subject: 'Ada Okafor', type: 'ACCESS', detail: 'Export of my full health record', status: 'IN_PROGRESS', due: d(20), at: d(-10) },
  { id: 'dsr-2', subject: 'Bola Ige', type: 'CORRECTION', detail: 'Date of birth is wrong (1988 not 1998)', status: 'NEW', due: d(28), at: d(-2) },
  { id: 'dsr-3', subject: 'Femi Ade', type: 'DELETION', detail: 'Delete account and marketing data', status: 'COMPLETED', due: d(-5), at: d(-35) },
]
export const incidents = [
  { id: 'inc-1', title: 'Lost laptop — PHC Ikeja', severity: 'MEDIUM', status: 'CONTAINED', detected: d(-4), records: 0, ndpcNotified: false, note: 'Disk encrypted; remote wipe executed.' },
  { id: 'inc-2', title: 'Suspicious login attempts on admin accounts', severity: 'HIGH', status: 'INVESTIGATING', detected: d(-1), records: 0, ndpcNotified: false, note: 'Rate-limit triggered; MFA blocked access.' },
]
export const processors = [
  { id: 'pr-1', vendor: 'Supabase (Auth & DB)', purpose: 'Identity & clinical DB', location: 'EU (Frankfurt)', dpa: 'SIGNED', transfer: 'SCCs' },
  { id: 'pr-2', vendor: 'Paystack', purpose: 'Card payments', location: 'Nigeria', dpa: 'SIGNED', transfer: 'N/A' },
  { id: 'pr-3', vendor: 'Termii', purpose: 'SMS & USSD', location: 'Nigeria', dpa: 'SIGNED', transfer: 'N/A' },
  { id: 'pr-4', vendor: 'Anthropic (Claude API)', purpose: 'AI health assistant', location: 'USA', dpa: 'IN_REVIEW', transfer: 'Pending assessment' },
  { id: 'pr-5', vendor: 'Kwik Delivery', purpose: 'Medication delivery', location: 'Nigeria', dpa: 'MISSING', transfer: 'N/A' },
]

/* ---------- System ---------- */
export const integrations = [
  { id: 'ig-1', name: 'NIMC (NIN verification)', status: 'CONNECTED', latency: '420ms' },
  { id: 'ig-2', name: 'NHIA claims gateway', status: 'DEGRADED', latency: '2.8s' },
  { id: 'ig-3', name: 'Paystack', status: 'CONNECTED', latency: '180ms' },
  { id: 'ig-4', name: 'Flutterwave', status: 'CONNECTED', latency: '210ms' },
  { id: 'ig-5', name: 'Termii SMS / USSD', status: 'CONNECTED', latency: '300ms' },
  { id: 'ig-6', name: 'FHIR R4 server', status: 'CONNECTED', latency: '95ms' },
  { id: 'ig-7', name: 'NCDC surveillance feed', status: 'NOT_CONFIGURED', latency: '—' },
]
export const aiModels = [
  { id: 'm-1', name: 'hc-assist', version: 'v1.3', provider: 'Claude Sonnet 5.5', status: 'PRODUCTION', guardrails: 'Emergency escalation, no dosing advice', deployed: d(-20) },
  { id: 'm-2', name: 'hc-assist', version: 'v1.4-rc', provider: 'Claude Sonnet 5.5', status: 'STAGING', guardrails: '+ Pidgin & Hausa support', deployed: d(-2) },
  { id: 'm-3', name: 'hc-triage-score', version: 'v0.9', provider: 'In-house', status: 'SHADOW', guardrails: 'Clinician must confirm', deployed: d(-40) },
]

export const notifications = [
  { id: 'n-1', title: 'New message', body: 'You have a new secure message.', at: d(0, 9, 50), read: false },
  { id: 'n-2', title: 'Reminder', body: 'You have items due today.', at: d(0, 8), read: false },
  { id: 'n-3', title: 'System update', body: 'Healthchatter will be updated tonight at 01:00 WAT.', at: d(-1, 17), read: true },
]

export const threads = [
  { id: 'th-1', with: 'Dr. Emeka Obi', role: 'Doctor', last: 'Please take your BP readings for 3 days before our call.', at: d(0, 9), unread: 1, messages: [
    { from: 'them', text: 'Good morning Ada, how are you feeling today?', at: d(0, 8, 50) },
    { from: 'me', text: 'Much better, thank you doctor.', at: d(0, 8, 55) },
    { from: 'them', text: 'Please take your BP readings for 3 days before our call.', at: d(0, 9) },
  ] },
  { id: 'th-2', with: 'LUTH Front Desk', role: 'Reception', last: 'Your appointment has been confirmed.', at: d(-1, 14), unread: 0, messages: [
    { from: 'them', text: 'Your appointment has been confirmed.', at: d(-1, 14) },
  ] },
  { id: 'th-3', with: 'Healthchatter Support', role: 'Support', last: 'Thanks for reaching out — we’re on it.', at: d(-3, 11), unread: 0, messages: [
    { from: 'me', text: 'I can’t find my lab result.', at: d(-3, 10) },
    { from: 'them', text: 'Thanks for reaching out — we’re on it.', at: d(-3, 11) },
  ] },
]

export const dependants = [
  { id: 'dp-1', name: 'Oluwaseun Ogunleye', relation: 'Son', age: 8, healthId: 'HC-205166', access: 'FULL' },
  { id: 'dp-2', name: 'Mrs. Ifeoma Okafor', relation: 'Mother', age: 71, healthId: 'HC-198220', access: 'APPOINTMENTS_ONLY' },
]

export const earnings = [
  { id: 'e-1', date: d(-1), patient: 'Emeka Nnadi', service: 'Telemedicine', gross: 20000, fee: 2000 },
  { id: 'e-2', date: d(-2), patient: 'Blessing Nwachukwu', service: 'In-person', gross: 22000, fee: 2200 },
  { id: 'e-3', date: d(-4), patient: 'Ada Okafor', service: 'Telemedicine', gross: 15000, fee: 1500 },
]

export const staff = [
  { id: 'st-1', name: 'Dr. Emeka Obi', role: 'DOCTOR', dept: 'Internal Medicine', status: 'ACTIVE', lastActive: d(0, 10) },
  { id: 'st-2', name: 'Nurse Halima Yusuf', role: 'NURSE', dept: 'Male Medical Ward', status: 'ACTIVE', lastActive: d(0, 9) },
  { id: 'st-3', name: 'Grace Effiong', role: 'RECEPTIONIST', dept: 'Front Desk', status: 'ACTIVE', lastActive: d(0, 10) },
  { id: 'st-4', name: 'Samuel Okon', role: 'BILLING_OFFICER', dept: 'Finance', status: 'ACTIVE', lastActive: d(0, 8) },
  { id: 'st-5', name: 'Dr. Chiamaka Eze', role: 'DOCTOR', dept: 'Obstetrics & Gynae', status: 'ACTIVE', lastActive: d(-1, 17) },
  { id: 'st-6', name: 'Ifeanyi Uba', role: 'NURSE', dept: 'Paediatrics', status: 'INVITED', lastActive: null },
]
export const departments = [
  { id: 'dep-1', name: 'Internal Medicine', head: 'Dr. Emeka Obi', staff: 34, services: 'Consults, telemedicine, chronic care' },
  { id: 'dep-2', name: 'Obstetrics & Gynaecology', head: 'Dr. Chiamaka Eze', staff: 28, services: 'Antenatal, delivery, family planning' },
  { id: 'dep-3', name: 'Paediatrics', head: 'Dr. Kemi Lawal', staff: 22, services: 'Child health, immunization' },
  { id: 'dep-4', name: 'Emergency', head: 'Dr. Yemi Shodipo', staff: 40, services: 'Triage, resuscitation' },
  { id: 'dep-5', name: 'Laboratory', head: 'Chioma Nnaji', staff: 18, services: 'Chemistry, haematology, microbiology' },
]
export const notifiable = [
  { id: 'nd-1', disease: 'Lassa fever (suspected)', cases: 1, week: 'Wk 46', status: 'SUBMITTED' },
  { id: 'nd-2', disease: 'Cholera', cases: 0, week: 'Wk 46', status: 'SUBMITTED' },
  { id: 'nd-3', disease: 'Measles', cases: 3, week: 'Wk 47', status: 'DRAFT' },
  { id: 'nd-4', disease: 'Malaria (confirmed)', cases: 142, week: 'Wk 47', status: 'DRAFT' },
]

export const clinicalNotes = []
export const vitals = []
