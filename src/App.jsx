import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import RequireRole from './auth/RequireRole.jsx'
import { ROLES, homeFor } from './config/roles.js'
import { ToastProvider } from './components/ui/index.jsx'
import AppShell from './layouts/AppShell.jsx'
import Landing from './pages/Landing.jsx'
import * as Auth from './screens/auth.jsx'
import * as Shared from './screens/shared.jsx'
import * as P from './screens/patient.jsx'
import * as D from './screens/doctor.jsx'
import * as S from './screens/staff.jsx'
import * as Sv from './screens/services.jsx'
import * as O from './screens/org.jsx'
import * as Pl from './screens/platform.jsx'

/*
 * Every role's screens, keyed by role. Paths are relative to the role's
 * `base` in config/roles.js (e.g. PATIENT → /patient/appointments).
 * Shared screens (messages, notifications, settings, help) are added to
 * every role automatically below.
 */
const SCREENS = {
  PATIENT: [
    ['', <P.PatientDashboard />], ['doctors', <P.FindDoctor />], ['doctors/:id', <P.DoctorProfile />], ['doctors/:id/book', <P.BookAppointment />],
    ['appointments', <P.Appointments />], ['appointments/:id', <P.AppointmentDetail />], ['appointments/:id/waiting', <P.WaitingRoom />], ['appointments/:id/consult', <P.ConsultationRoom />],
    ['record', <P.HealthRecord />], ['labs', <P.LabResults />], ['labs/:id', <P.LabDetail />], ['imaging', <P.Imaging />], ['medications', <P.Medications />],
    ['referrals', <P.PatientReferrals />], ['billing', <P.PatientBilling />], ['insurance', <P.Insurance />], ['facilities', <P.Facilities />],
    ['assistant', <P.Assistant />], ['family', <P.FamilyAccess />], ['privacy', <P.Privacy />],
  ],
  DOCTOR: [
    ['', <D.DoctorDashboard />], ['inbasket', <D.InBasket />], ['schedule', <D.Schedule />], ['patients', <D.DoctorPatients />], ['patients/:id', <D.PatientChart />],
    ['patients/:id/note', <D.NewNote />], ['patients/:id/order', <D.NewOrder />], ['patients/:id/prescribe', <D.Prescribe />],
    ['telemedicine', <D.TelemedicineQueue />], ['telemedicine/:id', <D.DoctorConsult />], ['prescriptions', <D.DoctorPrescriptions />], ['orders', <D.DoctorOrders />],
    ['referrals', <D.Referrals />], ['earnings', <D.Earnings />], ['credentials', <D.Credentials />],
  ],
  NURSE: [
    ['', <S.NurseDashboard />], ['triage', <S.Triage />], ['vitals', <S.RecordVitals />], ['ward', <S.Ward />], ['tasks', <S.Tasks />],
    ['patients', <D.DoctorPatients base="/nurse" />], ['patients/:id', <D.PatientChart base="/nurse" />], ['sync', <S.OfflineSync />],
  ],
  CHW: [
    ['', <S.ChwDashboard />], ['visits', <S.HomeVisits />], ['register', <S.ChwRegister />], ['screening', <S.Screening />],
    ['referrals', <D.Referrals base="/chw" />], ['sync', <S.OfflineSync />],
  ],
  RECEPTIONIST: [
    ['', <S.ReceptionDashboard />], ['register', <S.ChwRegister />], ['search', <S.PatientSearch />], ['checkin', <S.CheckIn />],
    ['appointments', <S.ReceptionAppointments />], ['adt', <S.Adt />], ['eligibility', <S.Eligibility />],
  ],
  PHARMACIST: [
    ['', <Sv.PharmacyDashboard />], ['queue', <Sv.RxQueue />], ['log', <Sv.DispensingLog />], ['inventory', <Sv.Inventory />],
    ['refills', <Sv.Refills />], ['deliveries', <Sv.Deliveries />],
  ],
  LAB_SCIENTIST: [
    ['', <Sv.LabDashboard />], ['worklist', <Sv.Worklist />], ['samples', <Sv.Samples />], ['results', <Sv.ResultEntry />],
    ['imaging', <Sv.LabImaging />], ['released', <Sv.Released />], ['amendments', <Sv.Amendments />],
  ],
  BILLING_OFFICER: [
    ['', <Sv.BillingDashboard />], ['invoices', <Sv.Invoices />], ['payments', <Sv.Payments />], ['claims', <Sv.BillingClaims />],
    ['refunds', <Sv.BillingRefunds />], ['prices', <Sv.PriceList />],
  ],
  FACILITY_ADMIN: [
    ['', <O.FacilityDashboard />], ['staff', <O.StaffRoles />], ['departments', <O.Departments />], ['beds', <O.BedsWards />],
    ['reports', <O.Reports />], ['ncdc', <O.NcdcReporting />], ['audit', <O.FacilityAudit />], ['profile', <O.FacilityProfile />],
  ],
  CLAIMS_OFFICER: [
    ['', <O.ClaimsDashboard />], ['inbox', <O.ClaimsInbox />], ['enrollees', <O.Enrollees />], ['preauth', <O.PreAuth />],
    ['network', <O.ProviderNetwork />], ['reports', <O.ClaimsReports />],
  ],
  MODERATOR: [
    ['', <Pl.ModeratorDashboard />], ['verification', <Pl.ProviderVerification />], ['facilities', <Pl.FacilityVerification />],
    ['complaints', <Pl.Complaints />], ['content', <Pl.ContentModeration />], ['ai-review', <Pl.AiReview />], ['suspended', <Pl.Suspended />],
  ],
  COMPLIANCE_OFFICER: [
    ['', <Pl.ComplianceDashboard />], ['audit', <Pl.AuditTrail />], ['break-glass', <Pl.BreakGlassReviews />], ['consents', <Pl.ConsentRegistry />],
    ['requests', <Pl.DataRequests />], ['incidents', <Pl.Incidents />], ['processors', <Pl.Processors />],
  ],
  SUPER_ADMIN: [
    ['', <Pl.AdminDashboard />], ['users', <Pl.AdminUsers />], ['roles', <Pl.RolesMatrix />], ['facilities', <Pl.AdminFacilities />],
    ['hmos', <Pl.AdminHmos />], ['integrations', <Pl.Integrations />], ['ai', <Pl.AiModels />], ['security', <Pl.SecuritySettings />],
    ['system', <Pl.SystemHealth />], ['audit', <Pl.PlatformAudit />],
  ],
}

const SHARED = [
  ['messages', <Shared.Messages />], ['notifications', <Shared.Notifications />], ['settings', <Shared.Settings />], ['help', <Shared.Help />],
]

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth.Login />} />
            <Route path="/verify" element={<Auth.VerifyMfa />} />
            <Route path="/signup" element={<Auth.Signup />} />
            <Route path="/forgot-password" element={<Auth.ForgotPassword />} />
            <Route path="/accept-invite" element={<Auth.AcceptInvite />} />
            <Route path="/pending-verification" element={<Auth.PendingVerification />} />
            <Route path="/unauthorized" element={<Auth.Unauthorized />} />
            <Route path="/app" element={<HomeRedirect />} />

            {Object.entries(SCREENS).map(([role, screens]) => (
              <Route key={role} path={ROLES[role].base} element={<RequireRole role={role}><AppShell /></RequireRole>}>
                {[...screens, ...SHARED].map(([path, el]) =>
                  path === '' ? <Route key="index" index element={el} /> : <Route key={path} path={path} element={el} />,
                )}
              </Route>
            ))}

            <Route path="*" element={<Auth.NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
