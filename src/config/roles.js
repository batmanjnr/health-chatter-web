/*
 * Role-based access control for the Healthchatter web app.
 *
 * Every signed-in account has exactly one role. The role decides:
 *  - which area of the app the user lands in (`base`)
 *  - which screens appear in their sidebar (`nav`)
 *  - which permissions they hold (`PERMISSIONS` below)
 *  - whether MFA is required at login (`mfa`) — required for all staff
 *    per the design doc (§12.2) and the requirements doc (§7).
 *
 * Role keys are UPPER_CASE to match the backend's Prisma `Role` enum
 * (which today only has PATIENT and DOCTOR — the rest need adding there).
 */

export const ROLES = {
  PATIENT: {
    label: 'Patient',
    base: '/patient',
    group: 'Patients & Families',
    mfa: false,
    description: 'Book care, view records and results, pay bills, manage family members.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Find a Doctor', path: 'doctors', icon: 'Stethoscope' },
      { label: 'Appointments', path: 'appointments', icon: 'CalendarDays' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
      { label: 'Health Record', path: 'record', icon: 'HeartPulse' },
      { label: 'Lab Results', path: 'labs', icon: 'FlaskConical' },
      { label: 'Imaging', path: 'imaging', icon: 'ScanLine' },
      { label: 'Medications', path: 'medications', icon: 'Pill' },
      { label: 'Referrals', path: 'referrals', icon: 'Send' },
      { label: 'Bills & Payments', path: 'billing', icon: 'Wallet' },
      { label: 'Insurance', path: 'insurance', icon: 'Shield' },
      { label: 'Hospitals & Labs', path: 'facilities', icon: 'Hospital' },
      { label: 'AI Health Assistant', path: 'assistant', icon: 'Bot' },
      { label: 'Family Access', path: 'family', icon: 'Baby' },
      { label: 'Privacy & Consent', path: 'privacy', icon: 'Lock' },
    ],
  },
  DOCTOR: {
    label: 'Doctor',
    base: '/doctor',
    group: 'Clinical Staff',
    mfa: true,
    regulator: 'MDCN',
    description: 'Consult, document, order, prescribe and refer.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'In-Basket', path: 'inbasket', icon: 'Inbox' },
      { label: 'Schedule', path: 'schedule', icon: 'CalendarDays' },
      { label: 'Patients', path: 'patients', icon: 'Users' },
      { label: 'Telemedicine', path: 'telemedicine', icon: 'Video' },
      { label: 'e-Prescriptions', path: 'prescriptions', icon: 'Pill' },
      { label: 'Orders & Results', path: 'orders', icon: 'FlaskConical' },
      { label: 'Referrals', path: 'referrals', icon: 'Send' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
      { label: 'Earnings', path: 'earnings', icon: 'Banknote' },
      { label: 'Credentials', path: 'credentials', icon: 'BadgeCheck' },
    ],
  },
  NURSE: {
    label: 'Nurse',
    base: '/nurse',
    group: 'Clinical Staff',
    mfa: true,
    regulator: 'NMCN',
    description: 'Triage, vitals, ward care and medication administration.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Triage Queue', path: 'triage', icon: 'Siren' },
      { label: 'Record Vitals', path: 'vitals', icon: 'Thermometer' },
      { label: 'Ward & Beds', path: 'ward', icon: 'Bed' },
      { label: 'Tasks & MAR', path: 'tasks', icon: 'ClipboardCheck' },
      { label: 'Patients', path: 'patients', icon: 'Users' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
      { label: 'Offline Sync', path: 'sync', icon: 'RefreshCw' },
    ],
  },
  CHW: {
    label: 'Community Health Worker',
    base: '/chw',
    group: 'Clinical Staff',
    mfa: true,
    regulator: 'CHPRBN',
    description: 'Home visits, community screening and referrals — offline-first.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Home Visits', path: 'visits', icon: 'Footprints' },
      { label: 'Register Patient', path: 'register', icon: 'UserPlus' },
      { label: 'Screening', path: 'screening', icon: 'ClipboardList' },
      { label: 'Referrals', path: 'referrals', icon: 'Send' },
      { label: 'Offline Sync', path: 'sync', icon: 'RefreshCw' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  RECEPTIONIST: {
    label: 'Receptionist',
    base: '/reception',
    group: 'Facility Staff',
    mfa: true,
    description: 'Registration, check-in, scheduling and admissions (no clinical notes).',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Register Patient', path: 'register', icon: 'UserPlus' },
      { label: 'Patient Search', path: 'search', icon: 'Search' },
      { label: 'Check-in Queue', path: 'checkin', icon: 'ListChecks' },
      { label: 'Appointments', path: 'appointments', icon: 'CalendarDays' },
      { label: 'Admissions (ADT)', path: 'adt', icon: 'Bed' },
      { label: 'Eligibility Check', path: 'eligibility', icon: 'ShieldCheck' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  PHARMACIST: {
    label: 'Pharmacist',
    base: '/pharmacy',
    group: 'Clinical Staff',
    mfa: true,
    regulator: 'PCN',
    description: 'e-Prescription queue, dispensing, inventory and delivery.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Prescription Queue', path: 'queue', icon: 'Pill' },
      { label: 'Dispensing Log', path: 'log', icon: 'ScrollText' },
      { label: 'Inventory', path: 'inventory', icon: 'Package' },
      { label: 'Refill Requests', path: 'refills', icon: 'Repeat' },
      { label: 'Deliveries', path: 'deliveries', icon: 'Truck' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  LAB_SCIENTIST: {
    label: 'Lab & Imaging Scientist',
    base: '/lab',
    group: 'Clinical Staff',
    mfa: true,
    regulator: 'MLSCN / RRBN',
    description: 'Work orders, sample collection, result entry and verification.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Worklist', path: 'worklist', icon: 'ListChecks' },
      { label: 'Sample Collection', path: 'samples', icon: 'Syringe' },
      { label: 'Result Entry', path: 'results', icon: 'Microscope' },
      { label: 'Imaging Studies', path: 'imaging', icon: 'ScanLine' },
      { label: 'Released Results', path: 'released', icon: 'FileCheck' },
      { label: 'Amendments', path: 'amendments', icon: 'FileWarning' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  BILLING_OFFICER: {
    label: 'Billing Officer',
    base: '/billing',
    group: 'Facility Staff',
    mfa: true,
    description: 'Charge capture, invoices, payments, NHIA/HMO claims and refunds.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Invoices', path: 'invoices', icon: 'Receipt' },
      { label: 'Payments', path: 'payments', icon: 'CreditCard' },
      { label: 'Claims', path: 'claims', icon: 'FileCheck' },
      { label: 'Refunds', path: 'refunds', icon: 'Repeat' },
      { label: 'Price List', path: 'prices', icon: 'ScrollText' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  FACILITY_ADMIN: {
    label: 'Facility Administrator',
    base: '/facility',
    group: 'Facility Staff',
    mfa: true,
    description: 'Runs a hospital/clinic: staff, departments, beds, reports.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Staff & Roles', path: 'staff', icon: 'Users' },
      { label: 'Departments & Services', path: 'departments', icon: 'Building2' },
      { label: 'Beds & Wards', path: 'beds', icon: 'Bed' },
      { label: 'Reports & Analytics', path: 'reports', icon: 'ChartColumn' },
      { label: 'Public Health (NCDC)', path: 'ncdc', icon: 'Megaphone' },
      { label: 'Facility Audit Log', path: 'audit', icon: 'ScrollText' },
      { label: 'Facility Profile', path: 'profile', icon: 'Hospital' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  CLAIMS_OFFICER: {
    label: 'NHIA / HMO Claims Officer',
    base: '/claims',
    group: 'Insurance',
    mfa: true,
    description: 'Reviews, queries and adjudicates claims from providers.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Claims Inbox', path: 'inbox', icon: 'Inbox' },
      { label: 'Enrollee Lookup', path: 'enrollees', icon: 'Search' },
      { label: 'Pre-Authorizations', path: 'preauth', icon: 'ShieldCheck' },
      { label: 'Provider Network', path: 'network', icon: 'Hospital' },
      { label: 'Reports', path: 'reports', icon: 'ChartColumn' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  MODERATOR: {
    label: 'Moderator',
    base: '/moderator',
    group: 'Platform Team',
    mfa: true,
    description: 'Verifies providers & facilities, handles complaints, reviews content and AI.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Provider Verification', path: 'verification', icon: 'BadgeCheck' },
      { label: 'Facility Verification', path: 'facilities', icon: 'Hospital' },
      { label: 'Complaints & Reports', path: 'complaints', icon: 'Flag' },
      { label: 'Reviews & Content', path: 'content', icon: 'Star' },
      { label: 'AI Safety Review', path: 'ai-review', icon: 'Brain' },
      { label: 'Suspended Accounts', path: 'suspended', icon: 'UserX' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  COMPLIANCE_OFFICER: {
    label: 'Compliance Officer (DPO)',
    base: '/compliance',
    group: 'Platform Team',
    mfa: true,
    description: 'NDPA compliance: audit trail, consent, data requests, breaches.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Audit Trail', path: 'audit', icon: 'ScrollText' },
      { label: 'Break-Glass Reviews', path: 'break-glass', icon: 'Siren' },
      { label: 'Consent Registry', path: 'consents', icon: 'FileCheck' },
      { label: 'Data Subject Requests', path: 'requests', icon: 'Inbox' },
      { label: 'Breach Incidents', path: 'incidents', icon: 'TriangleAlert' },
      { label: 'Processors & DPAs', path: 'processors', icon: 'Scale' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
  SUPER_ADMIN: {
    label: 'Super Admin',
    base: '/admin',
    group: 'Platform Team',
    mfa: true,
    description: 'Platform owner: users, roles, facilities, integrations, AI and system health.',
    nav: [
      { label: 'Dashboard', path: '', icon: 'LayoutDashboard' },
      { label: 'Users', path: 'users', icon: 'Users' },
      { label: 'Roles & Permissions', path: 'roles', icon: 'KeyRound' },
      { label: 'Facilities', path: 'facilities', icon: 'Hospital' },
      { label: 'HMOs & Payers', path: 'hmos', icon: 'Shield' },
      { label: 'Integrations', path: 'integrations', icon: 'Plug' },
      { label: 'AI Models', path: 'ai', icon: 'Brain' },
      { label: 'Security Settings', path: 'security', icon: 'Lock' },
      { label: 'System Health', path: 'system', icon: 'Server' },
      { label: 'Platform Audit Log', path: 'audit', icon: 'ScrollText' },
      { label: 'Messages', path: 'messages', icon: 'MessageSquare' },
    ],
  },
}

export const ROLE_KEYS = Object.keys(ROLES)

/* Screens every signed-in role gets, appended under the role's base path. */
export const SHARED_NAV = [
  { label: 'Notifications', path: 'notifications', icon: 'Bell' },
  { label: 'Settings', path: 'settings', icon: 'Settings' },
  { label: 'Help & Support', path: 'help', icon: 'CircleHelp' },
]

/*
 * Permission matrix. Used by screens (via `can()`) to hide or lock data —
 * e.g. a receptionist can open a patient's demographics but not clinical
 * notes (requirements doc §7). The Super Admin "Roles & Permissions" screen
 * renders this same table.
 */
export const PERMISSIONS = [
  { key: 'record.own.view', label: 'View own health record', roles: ['PATIENT'] },
  { key: 'demographics.view', label: 'View patient demographics', roles: ['DOCTOR', 'NURSE', 'CHW', 'RECEPTIONIST', 'PHARMACIST', 'LAB_SCIENTIST', 'BILLING_OFFICER'] },
  { key: 'clinical.notes.view', label: 'View clinical notes', roles: ['DOCTOR', 'NURSE'] },
  { key: 'clinical.notes.write', label: 'Write clinical notes', roles: ['DOCTOR', 'NURSE'] },
  { key: 'vitals.write', label: 'Record vitals', roles: ['DOCTOR', 'NURSE', 'CHW'] },
  { key: 'orders.create', label: 'Order labs / imaging', roles: ['DOCTOR'] },
  { key: 'prescriptions.create', label: 'Issue e-prescriptions', roles: ['DOCTOR'] },
  { key: 'prescriptions.dispense', label: 'Dispense medication', roles: ['PHARMACIST'] },
  { key: 'results.enter', label: 'Enter & verify lab results', roles: ['LAB_SCIENTIST'] },
  { key: 'results.view', label: 'View lab results', roles: ['PATIENT', 'DOCTOR', 'NURSE', 'LAB_SCIENTIST'] },
  { key: 'patients.register', label: 'Register patients', roles: ['RECEPTIONIST', 'CHW', 'NURSE'] },
  { key: 'adt.manage', label: 'Admit / discharge / transfer', roles: ['RECEPTIONIST', 'NURSE'] },
  { key: 'billing.manage', label: 'Invoices & payments', roles: ['BILLING_OFFICER'] },
  { key: 'claims.submit', label: 'Submit insurance claims', roles: ['BILLING_OFFICER'] },
  { key: 'claims.adjudicate', label: 'Adjudicate claims', roles: ['CLAIMS_OFFICER'] },
  { key: 'staff.manage', label: 'Manage facility staff', roles: ['FACILITY_ADMIN'] },
  { key: 'reports.facility', label: 'Facility reports', roles: ['FACILITY_ADMIN'] },
  { key: 'providers.verify', label: 'Verify providers & facilities', roles: ['MODERATOR'] },
  { key: 'content.moderate', label: 'Moderate complaints, reviews & AI', roles: ['MODERATOR'] },
  { key: 'audit.view', label: 'View full audit trail', roles: ['COMPLIANCE_OFFICER', 'SUPER_ADMIN'] },
  { key: 'privacy.requests', label: 'Handle data subject requests', roles: ['COMPLIANCE_OFFICER'] },
  { key: 'users.manage', label: 'Manage all users & roles', roles: ['SUPER_ADMIN'] },
  { key: 'system.configure', label: 'Configure integrations & system', roles: ['SUPER_ADMIN'] },
  { key: 'break_glass', label: 'Emergency break-glass access', roles: ['DOCTOR', 'NURSE'] },
]

export function can(role, permissionKey) {
  const p = PERMISSIONS.find((x) => x.key === permissionKey)
  return Boolean(p && p.roles.includes(role))
}

export function homeFor(role) {
  return ROLES[role]?.base ?? '/login'
}
