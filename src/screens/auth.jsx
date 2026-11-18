import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ROLES, homeFor } from '../config/roles.js'
import { accounts as demoAccounts, DEMO_OTP, DEMO_PASSWORD } from '../data/seed.js'
import { useCollection } from '../lib/store.js'
import { Alert, Button, Field, Icon } from '../components/ui/index.jsx'
import logoMark from '../assets/logo-mark.png'

function AuthLayout({ title, subtitle, children, wide }) {
  return (
    <div className="auth">
      <aside className="auth__brand">
        <Link to="/" className="auth__logo">
          <img src={logoMark} alt="" width="40" height="40" />
          <span>Healthchatter</span>
        </Link>
        <h2>Connected care, everywhere.</h2>
        <p>One secure, shared health record for every Nigerian patient and provider.</p>
        <ul>
          <li><Icon name="ShieldCheck" size={16} /> NDPA-compliant, encrypted records</li>
          <li><Icon name="KeyRound" size={16} /> Role-based access & MFA for staff</li>
          <li><Icon name="WifiOff" size={16} /> Works offline, syncs when online</li>
        </ul>
      </aside>
      <main className={`auth__panel ${wide ? 'auth__panel--wide' : ''}`}>
        <div className="auth__box">
          <h1>{title}</h1>
          {subtitle && <p className="auth__sub">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  )
}

/* ================= Login ================= */
export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setError('')
    try {
      const { next, user } = signIn(email, password)
      if (next === 'mfa') navigate('/verify')
      else if (next === 'pending') navigate('/pending-verification')
      else navigate(location.state?.from ?? homeFor(user.role))
    } catch (err) {
      setError(err.message)
    }
  }

  const fill = (acc) => {
    setEmail(acc.email)
    setPassword(DEMO_PASSWORD)
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in — we'll take you to the right workspace for your role.">
      <form onSubmit={submit} className="form">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Field label="Password">
          <div className="pw">
            <input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              <Icon name={show ? 'EyeOff' : 'Eye'} size={16} />
            </button>
          </div>
        </Field>
        <div className="form__row">
          <span />
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" className="b--block">Sign in</Button>
        <p className="auth__alt">
          New to Healthchatter? <Link to="/signup">Create an account</Link>
        </p>
      </form>

      <details className="demo">
        <summary>
          <Icon name="Users" size={16} /> Demo accounts (password <code>{DEMO_PASSWORD}</code>, MFA code <code>{DEMO_OTP}</code>)
        </summary>
        <div className="demo__grid">
          {demoAccounts.map((a) => (
            <button key={a.id} type="button" onClick={() => fill(a)}>
              <b>{a.status === 'PENDING_VERIFICATION' ? `${ROLES[a.role].label} (unverified)` : ROLES[a.role].label}</b>
              <small>{a.email}</small>
            </button>
          ))}
        </div>
      </details>
    </AuthLayout>
  )
}

/* ================= MFA ================= */
export function VerifyMfa() {
  const { pending, verifyMfa, signOut } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  if (!pending) {
    return (
      <AuthLayout title="Session expired">
        <Button onClick={() => navigate('/login')}>Back to sign in</Button>
      </AuthLayout>
    )
  }

  const submit = (e) => {
    e.preventDefault()
    try {
      const user = verifyMfa(code)
      navigate(homeFor(user.role))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthLayout title="Two-step verification" subtitle={`${ROLES[pending.role].label} accounts need a second step. Enter the 6-digit code sent to ${pending.phone.replace(/\d(?=\d{4})/g, '•')} or your authenticator app.`}>
      <form onSubmit={submit} className="form">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Verification code" inputMode="numeric" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="otp" placeholder="••••••" />
        <Button type="submit" className="b--block" disabled={code.length !== 6}>Verify & continue</Button>
        <div className="form__row">
          <button type="button" className="link" onClick={() => setError('A new code has been sent.')}>Resend code</button>
          <button type="button" className="link" onClick={() => { signOut(); navigate('/login') }}>Use a different account</button>
        </div>
      </form>
    </AuthLayout>
  )
}

/* ================= Forgot password ================= */
export function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  return (
    <AuthLayout title="Reset your password" subtitle="We'll send a reset link to your email, or an SMS code if you registered with a phone number.">
      {sent ? (
        <div className="form">
          <Alert tone="success" title="Check your inbox">If an account exists for {email}, a reset link is on its way. It expires in 30 minutes.</Alert>
          <Link to="/login" className="b b--ghost b--block">Back to sign in</Link>
        </div>
      ) : (
        <form className="form" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
          <Field label="Email or phone number" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="b--block">Send reset link</Button>
          <Link to="/login" className="auth__alt">Back to sign in</Link>
        </form>
      )}
    </AuthLayout>
  )
}

/* ================= Sign up ================= */
const ACCOUNT_TYPES = [
  { role: 'PATIENT', icon: 'User', title: 'Patient', text: 'Book doctors, see results, pay bills, manage family.' },
  { role: 'DOCTOR', icon: 'Stethoscope', title: 'Doctor', text: 'MDCN-registered medical practitioner.' },
  { role: 'NURSE', icon: 'HeartPulse', title: 'Nurse / Midwife', text: 'NMCN-registered nurse or midwife.' },
  { role: 'PHARMACIST', icon: 'Pill', title: 'Pharmacist', text: 'PCN-registered pharmacist or pharmacy.' },
  { role: 'LAB_SCIENTIST', icon: 'Microscope', title: 'Lab / Imaging Scientist', text: 'MLSCN or RRBN registered professional.' },
  { role: 'CHW', icon: 'Footprints', title: 'Community Health Worker', text: 'CHPRBN-registered CHEW / JCHEW.' },
  { role: 'FACILITY_ADMIN', icon: 'Hospital', title: 'Hospital / Clinic / Lab', text: 'Register a facility and invite your staff.' },
]

const PATIENT_CONSENTS = [
  { key: 'account', label: 'Terms of Service & account creation', required: true },
  { key: 'privacy', label: 'Privacy notice (how my data is used, NDPA 2023)', required: true },
  { key: 'telemedicine', label: 'Telemedicine — I understand remote care has limits and is not for emergencies', required: false },
  { key: 'sharing', label: 'Share my record with facilities treating me', required: false },
  { key: 'labs', label: 'Receive lab results electronically', required: false },
  { key: 'insurance', label: 'Share information with my HMO / NHIA for claims', required: false },
  { key: 'ai', label: 'Use the AI health assistant (information only, not diagnosis)', required: false },
  { key: 'marketing', label: 'Health tips and marketing messages', required: false },
]

export function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [hmos] = useCollection('hmos')
  const [step, setStep] = useState(0)
  const [type, setType] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', dob: '', gender: 'Female', state: 'Lagos', genotype: 'AA', bloodGroup: 'O+', coverage: 'Self-pay', policyId: '', license: '', specialty: '', facility: '', facilityType: 'Private hospital', regNo: '', nin: '' })
  const [consents, setConsents] = useState({ account: false, privacy: false, telemedicine: true, sharing: true, labs: true, insurance: true, ai: false, marketing: false, provider: false, dataProtection: false })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const isPatient = type === 'PATIENT'
  const isFacility = type === 'FACILITY_ADMIN'
  const steps = isPatient ? ['Account type', 'Your details', 'Consent', 'Health profile'] : ['Account type', 'Your details', 'Credentials', 'Agreements']
  const age = form.dob ? Math.floor((Date.now() - new Date(form.dob)) / 3.15576e10) : null

  const next = (e) => {
    e?.preventDefault()
    setError('')
    if (step === 2 && isPatient && (!consents.account || !consents.privacy)) return setError('Please accept the required items to continue.')
    if (step === 3 && !isPatient && (!consents.provider || !consents.dataProtection)) return setError('Please accept both agreements to submit.')
    if (step < steps.length - 1) return setStep((s) => s + 1)
    try {
      const account = signUp({
        role: type,
        name: isFacility ? `${form.name}` : form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        status: isPatient ? 'ACTIVE' : 'PENDING_VERIFICATION',
        license: isFacility ? form.regNo : form.license,
        specialty: form.specialty,
        facility: form.facility || undefined,
        healthId: isPatient ? `HC-${Math.floor(200000 + Math.random() * 99999)}` : undefined,
      })
      navigate(isPatient ? homeFor(account.role) : '/pending-verification')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Staff such as receptionists and billing officers are invited by their facility administrator — check your email for an invite." wide>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s} className={i === step ? 'is-active' : i < step ? 'is-done' : ''}>
            <span>{i < step ? <Icon name="Check" size={14} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      {error && <Alert tone="danger">{error}</Alert>}

      {step === 0 && (
        <div className="choice-grid">
          {ACCOUNT_TYPES.map((t) => (
            <button key={t.role} className={`choice ${type === t.role ? 'is-active' : ''}`} onClick={() => setType(t.role)}>
              <Icon name={t.icon} size={22} />
              <b>{t.title}</b>
              <small>{t.text}</small>
            </button>
          ))}
          <div className="form__actions">
            <Link to="/login" className="b b--ghost">I have an account</Link>
            <Button disabled={!type} onClick={() => setStep(1)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <form className="form form--2" onSubmit={next}>
          <Field label={isFacility ? 'Your full name (administrator)' : 'Full name'} required value={form.name} onChange={set('name')} />
          <Field label="Email" type="email" required value={form.email} onChange={set('email')} />
          <Field label="Phone number" type="tel" required placeholder="+234…" value={form.phone} onChange={set('phone')} />
          <Field label="Password" type="password" minLength={8} required value={form.password} onChange={set('password')} hint="At least 8 characters." />
          {isPatient && (
            <>
              <Field label="Date of birth" type="date" required value={form.dob} onChange={set('dob')} />
              <Field label="NIN (optional)" inputMode="numeric" maxLength={11} value={form.nin} onChange={set('nin')} hint="Links your record across facilities via NIMC." />
              {age !== null && age < 18 && (
                <Alert tone="warning" title="Under 18">A parent or guardian must create this account and manage it from their own Family Access page.</Alert>
              )}
            </>
          )}
          <div className="form__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button type="submit" disabled={isPatient && age !== null && age < 18}>Continue</Button>
          </div>
        </form>
      )}

      {step === 2 && isPatient && (
        <form className="form" onSubmit={next}>
          <p className="muted">Choose what you agree to. You can change optional items any time in Privacy & Consent.</p>
          {PATIENT_CONSENTS.map((c) => (
            <label key={c.key} className="check">
              <input type="checkbox" checked={consents[c.key]} onChange={(e) => setConsents((x) => ({ ...x, [c.key]: e.target.checked }))} />
              <span>{c.label} {c.required && <em>(required)</em>}</span>
            </label>
          ))}
          <div className="form__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      )}

      {step === 3 && isPatient && (
        <form className="form form--2" onSubmit={next}>
          <Field label="Gender" as="select" options={['Female', 'Male', 'Prefer not to say']} value={form.gender} onChange={set('gender')} />
          <Field label="State" as="select" options={['Lagos', 'FCT', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 'Enugu', 'Anambra', 'Other']} value={form.state} onChange={set('state')} />
          <Field label="Genotype" as="select" options={['AA', 'AS', 'SS', 'AC', 'SC', "Don't know"]} value={form.genotype} onChange={set('genotype')} />
          <Field label="Blood group" as="select" options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', "Don't know"]} value={form.bloodGroup} onChange={set('bloodGroup')} />
          <Field label="Health coverage" as="select" options={['Self-pay', ...hmos.map((h) => h.name)]} value={form.coverage} onChange={set('coverage')} />
          {form.coverage !== 'Self-pay' && <Field label="Policy / enrollee ID" value={form.policyId} onChange={set('policyId')} />}
          <div className="form__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button type="submit">Create account</Button>
          </div>
        </form>
      )}

      {step === 2 && !isPatient && (
        <form className="form form--2" onSubmit={next}>
          {isFacility ? (
            <>
              <Field label="Facility name" required value={form.facility} onChange={set('facility')} />
              <Field label="Facility type" as="select" options={['Tertiary hospital', 'Private hospital', 'Private clinic', 'Primary health centre', 'Laboratory', 'Imaging centre', 'Pharmacy']} value={form.facilityType} onChange={set('facilityType')} />
              <Field label="State registration number" required value={form.regNo} onChange={set('regNo')} hint="e.g. HEFAMAA, LSMOH or state MOH registration." />
              <Field label="Medical director's MDCN number" value={form.license} onChange={set('license')} />
            </>
          ) : (
            <>
              <Field label={`${ROLES[type].regulator} registration / licence number`} required value={form.license} onChange={set('license')} />
              <Field label="Specialty / area" value={form.specialty} onChange={set('specialty')} />
              <Field label="Current facility (optional)" value={form.facility} onChange={set('facility')} />
            </>
          )}
          <Field label="Upload licence & government ID">
            <div className="upload">
              <Icon name="Upload" size={18} />
              <span>Drop PDF/JPG files or <u>browse</u></span>
              <input type="file" multiple accept=".pdf,image/*" />
            </div>
          </Field>
          <Alert tone="info">A Healthchatter moderator checks your details against the {isFacility ? 'state facility register' : `${ROLES[type].regulator} register`} — usually within 2 working days.</Alert>
          <div className="form__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      )}

      {step === 3 && !isPatient && (
        <form className="form" onSubmit={next}>
          <label className="check">
            <input type="checkbox" checked={consents.provider} onChange={(e) => setConsents((x) => ({ ...x, provider: e.target.checked }))} />
            <span>I accept the <a href="#provider-agreement">{isFacility ? 'Facility' : 'Provider'} Agreement</a> — licence, conduct, telemedicine standards, fees & 10% platform commission, complaints and suspension.</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={consents.dataProtection} onChange={(e) => setConsents((x) => ({ ...x, dataProtection: e.target.checked }))} />
            <span>I accept the <a href="#dpa">Data Processing & Confidentiality terms</a> and understand every record access is logged.</span>
          </label>
          <div className="form__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button type="submit">Submit for verification</Button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}

/* ================= Accept staff invite ================= */
export function AcceptInvite() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const params = new URLSearchParams(useLocation().search)
  const role = ROLES[params.get('role')] ? params.get('role') : 'RECEPTIONIST'
  return (
    <AuthLayout title="Join your team" subtitle={`Lagos University Teaching Hospital invited you as ${ROLES[role].label}.`}>
      {done ? (
        <div className="form">
          <Alert tone="success" title="You're all set">Your account is active. Sign in with your email, password and authenticator code.</Alert>
          <Button className="b--block" onClick={() => navigate('/login')}>Go to sign in</Button>
        </div>
      ) : (
        <form className="form" onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
          <Field label="Full name" required />
          <Field label="Create password" type="password" minLength={8} required />
          <Field label="Set up two-step verification" hint="Scan with Google Authenticator or Microsoft Authenticator, then enter the code.">
            <div className="qr" aria-label="QR code placeholder"><Icon name="ScanLine" size={40} /></div>
          </Field>
          <Field label="Authenticator code" inputMode="numeric" maxLength={6} required />
          <Button type="submit" className="b--block">Activate account</Button>
        </form>
      )}
    </AuthLayout>
  )
}

/* ================= Pending verification ================= */
export function PendingVerification() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [verifications] = useCollection('verifications')
  const v = verifications.find((x) => x.name === user?.name)
  const status = v?.status ?? 'PENDING'
  return (
    <AuthLayout title={status === 'REJECTED' ? 'Verification unsuccessful' : status === 'APPROVED' ? 'You are verified' : 'Verification in progress'}>
      <div className="form">
        {status === 'REJECTED' ? (
          <Alert tone="danger" title="We couldn't verify your licence">{v?.note ?? 'Please upload a current practising licence and resubmit.'}</Alert>
        ) : status === 'APPROVED' ? (
          <Alert tone="success" title="Approved">Sign in again to open your workspace.</Alert>
        ) : (
          <Alert tone="info" title={`Thanks, ${user?.name ?? 'there'}`}>Our moderators are checking your {ROLES[user?.role]?.regulator ?? 'registration'} details. You'll get an email and SMS once approved.</Alert>
        )}
        <ol className="timeline">
          <li className="is-done"><b>Account created</b><small>Email confirmed</small></li>
          <li className="is-done"><b>Documents submitted</b><small>Licence & ID uploaded</small></li>
          <li className={status !== 'PENDING' ? 'is-done' : ''}><b>Registry check</b><small>Moderator review</small></li>
          <li className={status === 'APPROVED' ? 'is-done' : ''}><b>Workspace unlocked</b></li>
        </ol>
        <Button variant="ghost" className="b--block" onClick={() => { signOut(); navigate('/login') }}>Sign out</Button>
      </div>
    </AuthLayout>
  )
}

/* ================= Errors ================= */
export function Unauthorized() {
  const { user } = useAuth()
  return (
    <AuthLayout title="You don't have access to that page" subtitle="Healthchatter uses role-based access. This area belongs to a different role.">
      <Link to={user ? homeFor(user.role) : '/login'} className="b b--primary b--block">Go to my workspace</Link>
    </AuthLayout>
  )
}

export function NotFound() {
  return (
    <AuthLayout title="Page not found" subtitle="The page you're looking for doesn't exist or has moved.">
      <Link to="/" className="b b--primary b--block">Back to home</Link>
    </AuthLayout>
  )
}
