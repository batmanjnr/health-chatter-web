export const user = {
  firstName: "Ada",
  fullName: "Ada Okafor",
  patientId: "HC-204981",
  email: "ada.okafor@gmail.com",
  phone: "+234 803 123 4567",
  hasUnreadNotification: true,
  bloodType: "O+",
  allergies: ["Penicillin", "Peanuts"],
  hmoProvider: "AXA Mansard Health",
  membershipBadge: "AXA Gold Member",
  language: "English",
  biometricEnabled: true,
  genotype: "AA",
};

export const specialties = [
  "General Practice",
  "Cardiology",
  "Pediatrics",
  "Dermatology",
  "Dentistry",
  "Gynecology",
];

export const doctors = [
  {
    id: "1",
    name: "Dr. Ngozi Adeyemi",
    specialty: "General Practice",
    hospital: "Reddington Hospital, Lagos",
    rating: 4.8,
    reviewCount: 214,
    visitType: "Telemedicine",
    fee: 8000,
    originalFee: null,
    experienceYears: 9,
    patientsSeen: "3,200",
    languages: "English, Igbo",
    about:
      "Dr. Ngozi Adeyemi is a general practitioner with 9 years of experience treating patients across Lagos. She focuses on preventive care, chronic disease management, and family medicine, and is known for her calm, thorough consultations.",
    slots: ["Today, 2:00 PM", "Tomorrow, 10:00 AM", "Wed, 4:30 PM"],
  },
  {
    id: "2",
    name: "Dr. Emeka Obi",
    specialty: "Cardiology",
    hospital: "Lagoon Hospitals, Ikoyi",
    rating: 4.9,
    reviewCount: 356,
    visitType: "In-person",
    fee: 15000,
    originalFee: 18000,
    experienceYears: 14,
    patientsSeen: "5,100",
    languages: "English, Yoruba",
    about:
      "Dr. Emeka Obi is a consultant cardiologist specializing in hypertension management, heart failure, and preventive cardiac screening. He has over 14 years of clinical experience across leading Nigerian teaching hospitals.",
    slots: ["Tomorrow, 9:00 AM", "Wed, 1:00 PM", "Thu, 11:30 AM"],
  },
  {
    id: "3",
    name: "Dr. Amina Bello",
    specialty: "Pediatrics",
    hospital: "St. Nicholas Hospital, Lagos",
    rating: 4.7,
    reviewCount: 178,
    visitType: "both",
    fee: 10000,
    originalFee: null,
    experienceYears: 7,
    patientsSeen: "2,600",
    languages: "English, Hausa",
    about:
      "Dr. Amina Bello is a pediatrician passionate about childhood development, vaccinations, and nutrition counselling. She works closely with families to make sure every child gets attentive, friendly care.",
    slots: ["Today, 3:30 PM", "Tomorrow, 12:00 PM", "Fri, 9:00 AM"],
  },
  {
    id: "4",
    name: "Dr. Tunde Fashola",
    specialty: "Dermatology",
    hospital: "EKO Hospital, Lagos",
    rating: 4.6,
    reviewCount: 132,
    visitType: "Telemedicine",
    fee: 9500,
    originalFee: null,
    experienceYears: 6,
    patientsSeen: "1,900",
    languages: "English, Yoruba",
    about:
      "Dr. Tunde Fashola treats a wide range of skin, hair, and nail conditions, from acne and eczema to more complex dermatological concerns, with an emphasis on evidence-based skincare.",
    slots: ["Tomorrow, 2:30 PM", "Wed, 10:00 AM", "Thu, 4:00 PM"],
  },
  {
    id: "5",
    name: "Dr. Chiamaka Eze",
    specialty: "Dentistry",
    hospital: "Smile House Dental Clinic, Abuja",
    rating: 4.9,
    reviewCount: 245,
    visitType: "In-person",
    fee: 12000,
    originalFee: null,
    experienceYears: 11,
    patientsSeen: "4,000",
    languages: "English, Igbo",
    about:
      "Dr. Chiamaka Eze is a dental surgeon offering general and cosmetic dentistry, including cleanings, fillings, and orthodontic consultations, with a gentle approach for anxious patients.",
    slots: ["Today, 4:00 PM", "Tomorrow, 11:00 AM", "Fri, 1:30 PM"],
  },
  {
    id: "6",
    name: "Dr. Folake Adeniran",
    specialty: "Gynecology",
    hospital: "Nordica Fertility Centre, Lagos",
    rating: 4.8,
    reviewCount: 198,
    visitType: "both",
    fee: 13500,
    originalFee: 16000,
    experienceYears: 12,
    patientsSeen: "3,800",
    languages: "English, Yoruba",
    about:
      "Dr. Folake Adeniran provides comprehensive women's health services including prenatal care, fertility consultations, and routine gynecological screening in a warm, confidential setting.",
    slots: ["Tomorrow, 3:00 PM", "Wed, 9:30 AM", "Thu, 2:00 PM"],
  },
];

export const upcomingConsultation = {
  doctorId: "2",
  doctorName: "Dr. Emeka Obi",
  specialty: "Cardiology",
  hospital: "Lagoon Hospitals",
  date: { day: "14", month: "Sep" },
  time: "10:30 AM",
};

export const insurance = {
  provider: "Hygeia HMO",
  nhiaId: "NHIA-8827301",
  tier: "Premium",
  status: "ACTIVE",
};

export const insuranceOptions = [
  { id: "ins-1", provider: "Hygeia HMO", policyId: "HYG-44210" },
  { id: "ins-2", provider: "AXA Mansard Health", policyId: "AXA-99183" },
  { id: "ins-3", provider: "NHIA Direct", policyId: "NHIA-8827301" },
];

export const quickAccessItems = [
  { key: "health-record", label: "My Health Record", icon: "folder" },
  { key: "symptoms", label: "Symptoms", icon: "activity" },
  { key: "medicines", label: "Medicines", icon: "package" },
  { key: "lab-tests", label: "Lab Tests", icon: "clipboard" },
];

export function getDoctorById(id) {
  return doctors.find((doctor) => doctor.id === id);
}

export const appointments = [
  {
    id: "appt-1",
    doctorId: "2",
    status: "upcoming",
    date: "Sep 14, 2026",
    time: "10:30 AM",
    mode: "Video",
  },
  {
    id: "appt-2",
    doctorId: "5",
    status: "upcoming",
    date: "Sep 18, 2026",
    time: "1:30 PM",
    mode: "In-Person",
  },
  {
    id: "appt-3",
    doctorId: "1",
    status: "past",
    date: "Aug 22, 2026",
    time: "3:00 PM",
    mode: "Video",
  },
  {
    id: "appt-4",
    doctorId: "3",
    status: "past",
    date: "Jul 30, 2026",
    time: "11:00 AM",
    mode: "In-Person",
  },
];

export function getAppointmentById(id) {
  return appointments.find((appt) => appt.id === id);
}

export const billing = {
  totalOutstanding: 24500,
  lineItems: [
    {
      id: "bill-1",
      service: "Cardiology Consultation",
      provider: "Dr. Emeka Obi",
      amount: 15000,
      coverageTag: "Patient Out-of-pocket",
      coverageType: "patient",
    },
    {
      id: "bill-2",
      service: "Dental Cleaning & Checkup",
      provider: "Dr. Chiamaka Eze",
      amount: 12000,
      coverageTag: "HMO Covered (100%)",
      coverageType: "covered",
    },
    {
      id: "bill-3",
      service: "Full Blood Count Test",
      provider: "HealthChatter Labs",
      amount: 6500,
      coverageTag: "Patient Out-of-pocket",
      coverageType: "patient",
    },
    {
      id: "bill-4",
      service: "General Consultation",
      provider: "Dr. Ngozi Adeyemi",
      amount: 8000,
      coverageTag: "HMO Covered (100%)",
      coverageType: "covered",
    },
    {
      id: "bill-5",
      service: "Prescription Refill Fee",
      provider: "HealthChatter Pharmacy",
      amount: 3000,
      coverageTag: "Patient Out-of-pocket",
      coverageType: "patient",
    },
  ],
};

export const labResults = [
  {
    id: "lab-1",
    testName: "Full Blood Count (FBC)",
    orderingDoctor: "Dr. Ngozi Adeyemi",
    hospital: "Reddington Hospital, Lagos",
    status: "READY",
    summary: "Within normal range",
    timestamp: "Sep 7, 2026 • 9:14 AM",
  },
  {
    id: "lab-2",
    testName: "Lipid Profile",
    orderingDoctor: "Dr. Emeka Obi",
    hospital: "Lagoon Hospitals, Ikoyi",
    status: "FLAGGED",
    summary: "LDL slightly elevated",
    timestamp: "Sep 5, 2026 • 2:40 PM",
  },
  {
    id: "lab-3",
    testName: "Fasting Blood Glucose",
    orderingDoctor: "Dr. Emeka Obi",
    hospital: "Lagoon Hospitals, Ikoyi",
    status: "READY",
    summary: "Normal — 88 mg/dL",
    timestamp: "Sep 5, 2026 • 2:40 PM",
  },
  {
    id: "lab-4",
    testName: "Malaria Parasite Screen",
    orderingDoctor: "Dr. Amina Bello",
    hospital: "St. Nicholas Hospital, Lagos",
    status: "PENDING",
    summary: "Awaiting lab processing",
    timestamp: "Sep 9, 2026 • 8:02 AM",
  },
  {
    id: "lab-5",
    testName: "Skin Allergy Panel",
    orderingDoctor: "Dr. Tunde Fashola",
    hospital: "EKO Hospital, Lagos",
    status: "READY",
    summary: "2 mild reactive markers",
    timestamp: "Aug 29, 2026 • 11:20 AM",
  },
];

export const conditions = [
  {
    id: "cond-1",
    name: "Hypertension",
    status: "Active",
    diagnosedDate: "Mar 14, 2025",
    diagnosedBy: "Dr. Emeka Obi",
  },
  {
    id: "cond-2",
    name: "Type 2 Diabetes",
    status: "Active",
    diagnosedDate: "Jun 2, 2025",
    diagnosedBy: "Dr. Ngozi Adeyemi",
  },
  {
    id: "cond-3",
    name: "Malaria",
    status: "Resolved",
    diagnosedDate: "Sep 9, 2024",
    diagnosedBy: "Dr. Amina Bello",
  },
];

export function getConditionById(id) {
  return conditions.find((condition) => condition.id === id);
}

export const imagingStudies = [
  {
    id: "img-1",
    type: "X-Ray",
    bodyPart: "Chest",
    facility: "Reddington Hospital, Lagos",
    date: "Aug 20, 2026 • 11:00 AM",
    status: "READY",
    summary: "No acute cardiopulmonary abnormality",
  },
  {
    id: "img-2",
    type: "Ultrasound",
    bodyPart: "Abdomen",
    facility: "Lagoon Hospitals, Ikoyi",
    date: "Jul 3, 2026 • 3:15 PM",
    status: "READY",
    summary: "Normal liver, kidneys, and gallbladder",
  },
  {
    id: "img-3",
    type: "MRI",
    bodyPart: "Lumbar Spine",
    facility: "EKO Hospital, Lagos",
    date: "Sep 8, 2026 • 9:40 AM",
    status: "PENDING",
    summary: "Awaiting radiologist review",
  },
];

export function getImagingStudyById(id) {
  return imagingStudies.find((study) => study.id === id);
}

export const immunizations = [
  {
    id: "imm-1",
    vaccine: "Yellow Fever",
    doseLabel: "Single Dose",
    date: "Feb 10, 2020",
    facility: "Reddington Hospital, Lagos",
  },
  {
    id: "imm-2",
    vaccine: "COVID-19 (AstraZeneca)",
    doseLabel: "Dose 2 of 2",
    date: "Nov 18, 2021",
    facility: "St. Nicholas Hospital, Lagos",
  },
  {
    id: "imm-3",
    vaccine: "Hepatitis B",
    doseLabel: "Dose 3 of 3",
    date: "May 5, 2019",
    facility: "EKO Hospital, Lagos",
  },
  {
    id: "imm-4",
    vaccine: "Tetanus Toxoid",
    doseLabel: "Booster",
    date: "Jan 22, 2026",
    facility: "Lagoon Hospitals, Ikoyi",
  },
];

export const referrals = [
  {
    id: "ref-1",
    fromDoctor: "Dr. Ngozi Adeyemi",
    toSpecialty: "Cardiology",
    reason: "Elevated blood pressure readings over 3 visits",
    status: "Scheduled",
    date: "Sep 5, 2026",
    matchedDoctorId: "2",
  },
  {
    id: "ref-2",
    fromDoctor: "Dr. Emeka Obi",
    toSpecialty: "Dermatology",
    reason: "Persistent skin reaction, needs specialist review",
    status: "Pending",
    date: "Sep 9, 2026",
    matchedDoctorId: "4",
  },
  {
    id: "ref-3",
    fromDoctor: "Dr. Amina Bello",
    toSpecialty: "Gynecology",
    reason: "Routine specialist screening",
    status: "Completed",
    date: "Jun 18, 2026",
    matchedDoctorId: "6",
  },
];

export const medications = {
  active: [
    {
      id: "med-1",
      name: "Amlodipine",
      dosage: "5mg tablet",
      frequency: "Once daily, morning",
      refillProgress: 0.65,
      daysLeft: 12,
      prescribingDoctor: "Dr. Emeka Obi",
    },
    {
      id: "med-2",
      name: "Metformin",
      dosage: "500mg tablet",
      frequency: "Twice daily, with meals",
      refillProgress: 0.3,
      daysLeft: 5,
      prescribingDoctor: "Dr. Ngozi Adeyemi",
    },
    {
      id: "med-3",
      name: "Cetirizine",
      dosage: "10mg tablet",
      frequency: "Once daily, night",
      refillProgress: 0.9,
      daysLeft: 20,
      prescribingDoctor: "Dr. Tunde Fashola",
    },
  ],
  completed: [
    {
      id: "med-4",
      name: "Amoxicillin",
      dosage: "500mg capsule",
      completedDate: "Aug 12, 2026",
    },
    {
      id: "med-5",
      name: "Ibuprofen",
      dosage: "400mg tablet",
      completedDate: "Jul 2, 2026",
    },
  ],
};

export const notifications = {
  today: [
    {
      id: "notif-1",
      icon: "calendar-outline",
      title: "Appointment Reminder",
      timestamp: "2h ago",
      description:
        "Your video consultation with Dr. Emeka Obi is tomorrow at 10:30 AM.",
    },
    {
      id: "notif-2",
      icon: "flask-outline",
      title: "Lab Result Ready",
      timestamp: "5h ago",
      description: "Your Full Blood Count results are ready to view.",
    },
  ],
  earlier: [
    {
      id: "notif-3",
      icon: "medkit-outline",
      title: "Refill Reminder",
      timestamp: "Yesterday",
      description: "Metformin refill due in 5 days — request it now.",
    },
    {
      id: "notif-4",
      icon: "card-outline",
      title: "Payment Received",
      timestamp: "2 days ago",
      description: "₦8,000 payment for General Consultation was confirmed.",
    },
    {
      id: "notif-5",
      icon: "chatbubble-ellipses-outline",
      title: "New Message",
      timestamp: "3 days ago",
      description: "Dr. Chiamaka Eze sent you a message about your cleaning.",
    },
  ],
};

export const messageThreads = [
  {
    id: "thread-1",
    doctorId: "2",
    lastMessage: "See you at your appointment tomorrow, take care!",
    timestamp: "9:42 AM",
    unreadCount: 2,
  },
  {
    id: "thread-2",
    doctorId: "5",
    lastMessage: "Your cleaning is booked for the 18th, confirmed.",
    timestamp: "Yesterday",
    unreadCount: 0,
  },
  {
    id: "thread-3",
    doctorId: "1",
    lastMessage: "Let me know if the symptoms persist past 3 days.",
    timestamp: "Mon",
    unreadCount: 0,
  },
];

export function getThreadByDoctorId(doctorId) {
  return messageThreads.find((thread) => thread.doctorId === doctorId);
}

export const chatMessages = {
  "2": [
    {
      id: "c2-1",
      sender: "doctor",
      text: "Good morning! Just confirming your consultation for tomorrow at 10:30 AM.",
      timestamp: "9:10 AM",
      date: "Today",
    },
    {
      id: "c2-2",
      sender: "patient",
      text: "Good morning doctor, yes I'll be there. Should I fast beforehand?",
      timestamp: "9:20 AM",
      date: "Today",
    },
    {
      id: "c2-3",
      sender: "doctor",
      text: "No fasting needed this time, just bring your recent lipid profile results.",
      timestamp: "9:35 AM",
      date: "Today",
    },
    {
      id: "c2-4",
      sender: "doctor",
      text: "See you at your appointment tomorrow, take care!",
      timestamp: "9:42 AM",
      date: "Today",
    },
  ],
  "5": [
    {
      id: "c5-1",
      sender: "patient",
      text: "Hi doctor, can I reschedule my cleaning to the 18th?",
      timestamp: "4:02 PM",
      date: "Yesterday",
    },
    {
      id: "c5-2",
      sender: "doctor",
      text: "Your cleaning is booked for the 18th, confirmed.",
      timestamp: "4:10 PM",
      date: "Yesterday",
    },
  ],
  "1": [
    {
      id: "c1-1",
      sender: "patient",
      text: "The mild fever came back last night, should I be worried?",
      timestamp: "8:05 PM",
      date: "Monday",
    },
    {
      id: "c1-2",
      sender: "doctor",
      text: "Let me know if the symptoms persist past 3 days.",
      timestamp: "8:20 PM",
      date: "Monday",
    },
  ],
};

export function getChatMessages(doctorId) {
  return chatMessages[doctorId] ?? [];
}

export function getLabResultById(id) {
  return labResults.find((result) => result.id === id);
}

export function getWaitingRoomChecklist() {
  return [
    { key: "network", label: "Network Connection", status: "ok" },
    { key: "camera", label: "Camera & Microphone Access", status: "ok" },
    { key: "questionnaire", label: "Pre-Visit Questionnaire", status: "warning" },
  ];
}

// ---------------------------------------------------------------------------
// Provider (doctor) portal mock data
// ---------------------------------------------------------------------------

export const providerPatients = [
  {
    id: "pt-1",
    name: "Ada Okafor",
    age: 34,
    gender: "Female",
    mrn: "HC-204981",
    lastVisit: "Sep 5, 2026",
    problems: [
      { id: "prob-1", name: "Hypertension", status: "Active", since: "Mar 2025" },
      { id: "prob-2", name: "Type 2 Diabetes", status: "Active", since: "Jun 2025" },
    ],
    medications: [
      { id: "rxm-1", name: "Amlodipine", dosage: "5mg", frequency: "Once daily, morning" },
      { id: "rxm-2", name: "Metformin", dosage: "500mg", frequency: "Twice daily, with meals" },
    ],
    allergies: ["Penicillin", "Peanuts"],
    encounters: [
      {
        id: "enc-1",
        date: "Sep 5, 2026",
        type: "Telemedicine",
        note: "Reviewed lipid profile, LDL mildly elevated. Continued statin, reinforced diet counseling.",
      },
      {
        id: "enc-2",
        date: "Jun 2, 2025",
        type: "In-person",
        note: "Diagnosed Type 2 Diabetes. Started Metformin 500mg twice daily.",
      },
    ],
    orders: [],
  },
  {
    id: "pt-2",
    name: "Chinedu Okoro",
    age: 58,
    gender: "Male",
    mrn: "HC-118823",
    lastVisit: "Sep 9, 2026",
    problems: [
      { id: "prob-3", name: "Chronic Kidney Disease, Stage 3", status: "Active", since: "Jan 2024" },
      { id: "prob-4", name: "Hypertension", status: "Active", since: "2019" },
    ],
    medications: [
      { id: "rxm-3", name: "Lisinopril", dosage: "10mg", frequency: "Once daily" },
      { id: "rxm-4", name: "Amlodipine", dosage: "5mg", frequency: "Once daily" },
    ],
    allergies: ["Sulfa drugs"],
    encounters: [
      {
        id: "enc-3",
        date: "Sep 9, 2026",
        type: "In-person",
        note: "Basic metabolic panel drawn — potassium elevated at 5.8 mmol/L, flagged for review.",
      },
    ],
    orders: [],
  },
  {
    id: "pt-3",
    name: "Blessing Nwachukwu",
    age: 41,
    gender: "Female",
    mrn: "HC-330912",
    lastVisit: "Aug 22, 2026",
    problems: [
      { id: "prob-5", name: "Asthma", status: "Active", since: "2016" },
      { id: "prob-6", name: "Seasonal Allergic Rhinitis", status: "Active", since: "2016" },
    ],
    medications: [
      { id: "rxm-5", name: "Salbutamol Inhaler", dosage: "100mcg", frequency: "As needed" },
    ],
    allergies: ["None known"],
    encounters: [
      {
        id: "enc-4",
        date: "Aug 22, 2026",
        type: "Telemedicine",
        note: "Asthma well controlled, refilled inhaler, no exacerbations in 6 months.",
      },
    ],
    orders: [],
  },
  {
    id: "pt-4",
    name: "Emeka Nnadi",
    age: 47,
    gender: "Male",
    mrn: "HC-552017",
    lastVisit: "Sep 1, 2026",
    problems: [
      { id: "prob-7", name: "Atrial Fibrillation", status: "Active", since: "2022" },
    ],
    medications: [
      { id: "rxm-6", name: "Warfarin", dosage: "5mg", frequency: "Once daily" },
    ],
    allergies: ["Aspirin"],
    encounters: [
      {
        id: "enc-5",
        date: "Sep 1, 2026",
        type: "In-person",
        note: "INR within therapeutic range. Continue current warfarin dose.",
      },
    ],
    orders: [],
  },
];

export function getProviderPatientById(id) {
  return providerPatients.find((patient) => patient.id === id);
}

export const inBasketItems = [
  {
    id: "ib-1",
    type: "result",
    urgency: "urgent",
    patientId: "pt-2",
    title: "Elevated Potassium — 5.8 mmol/L",
    subtitle: "Basic Metabolic Panel • Chinedu Okoro",
    timestamp: "12m ago",
  },
  {
    id: "ib-2",
    type: "message",
    urgency: "routine",
    patientId: "pt-1",
    title: "Ada Okafor",
    subtitle: "Should I stop the metformin before my blood test on Friday?",
    timestamp: "38m ago",
  },
  {
    id: "ib-3",
    type: "refill",
    urgency: "routine",
    patientId: "pt-3",
    title: "Salbutamol Inhaler refill",
    subtitle: "100mcg • 1 refill remaining",
    timestamp: "1h ago",
  },
  {
    id: "ib-4",
    type: "result",
    urgency: "urgent",
    patientId: "pt-4",
    title: "INR Critical — 5.1",
    subtitle: "Coagulation Panel • Emeka Nnadi",
    timestamp: "1h ago",
  },
  {
    id: "ib-5",
    type: "message",
    urgency: "urgent",
    patientId: "pt-2",
    title: "Chinedu Okoro",
    subtitle: "I've been feeling dizzy and weak since yesterday.",
    timestamp: "2h ago",
  },
  {
    id: "ib-6",
    type: "refill",
    urgency: "routine",
    patientId: "pt-1",
    title: "Metformin 500mg refill",
    subtitle: "30-day supply • 2 refills remaining",
    timestamp: "3h ago",
  },
  {
    id: "ib-7",
    type: "result",
    urgency: "routine",
    patientId: "pt-3",
    title: "Spirometry — Stable",
    subtitle: "Pulmonary Function Test • Blessing Nwachukwu",
    timestamp: "Yesterday",
  },
];

export function getInBasketItemById(id) {
  return inBasketItems.find((item) => item.id === id);
}

export const providerProfile = {
  name: "Dr. Emeka Obi",
  specialty: "Cardiology",
  hospital: "Lagoon Hospitals, Ikoyi",
};

export const providerScheduleToday = [
  { id: "psch-1", time: "9:00 AM", patientId: "pt-1", mode: "Telemedicine", status: "checked-in" },
  { id: "psch-2", time: "9:30 AM", patientId: "pt-3", mode: "In-Person", status: "upcoming" },
  { id: "psch-3", time: "10:30 AM", patientId: "pt-2", mode: "Telemedicine", status: "upcoming" },
  { id: "psch-4", time: "2:00 PM", patientId: "pt-4", mode: "In-Person", status: "upcoming" },
];

export const providerAvailability = [
  { day: "Monday", slots: ["9:00 AM – 12:00 PM", "2:00 PM – 5:00 PM"] },
  { day: "Tuesday", slots: ["9:00 AM – 12:00 PM"] },
  { day: "Wednesday", slots: ["9:00 AM – 12:00 PM", "2:00 PM – 5:00 PM"] },
  { day: "Thursday", slots: ["2:00 PM – 5:00 PM"] },
  { day: "Friday", slots: ["9:00 AM – 1:00 PM"] },
  { day: "Saturday", slots: [] },
  { day: "Sunday", slots: [] },
];

export const telemedicineQueue = [
  {
    id: "psch-1",
    patientId: "pt-1",
    time: "9:00 AM",
    waitingSince: "3m",
    checklist: { network: "ok", camera: "ok", questionnaire: "ok" },
  },
  {
    id: "psch-3",
    patientId: "pt-2",
    time: "10:30 AM",
    waitingSince: "Not yet joined",
    checklist: { network: "ok", camera: "ok", questionnaire: "warning" },
  },
];

export const providerReferrals = {
  outgoing: [
    {
      id: "pref-out-1",
      patientId: "pt-2",
      toSpecialty: "Nephrology",
      toFacility: "St. Nicholas Hospital, Lagos",
      reason: "Stage 3 CKD with rising creatinine — needs specialist co-management.",
      status: "Pending",
      date: "Sep 9, 2026",
    },
    {
      id: "pref-out-2",
      patientId: "pt-4",
      toSpecialty: "Hematology",
      toFacility: "Reddington Hospital, Lagos",
      reason: "Supratherapeutic INR, recurring — rule out interaction or absorption issue.",
      status: "Scheduled",
      date: "Sep 2, 2026",
    },
  ],
  incoming: [
    {
      id: "pref-in-1",
      patientId: "pt-1",
      fromDoctor: "Dr. Ngozi Adeyemi",
      fromFacility: "Reddington Hospital, Lagos",
      reason: "Elevated blood pressure readings over 3 visits — cardiology evaluation requested.",
      status: "Pending",
      date: "Sep 5, 2026",
    },
    {
      id: "pref-in-2",
      patientId: "pt-3",
      fromDoctor: "Dr. Tunde Fashola",
      fromFacility: "EKO Hospital, Lagos",
      reason: "Recurrent wheeze despite topical treatment — pulmonology/asthma review.",
      status: "Completed",
      date: "Jul 18, 2026",
    },
  ],
};

export const drugFormulary = [
  { id: "drug-1", name: "Lisinopril", dosageOptions: ["5mg", "10mg", "20mg"], frequencyOptions: ["Once daily"], interactsWith: ["Ibuprofen", "Potassium Chloride"], allergyFlags: [] },
  { id: "drug-2", name: "Amoxicillin", dosageOptions: ["250mg", "500mg"], frequencyOptions: ["Twice daily", "Three times daily"], interactsWith: [], allergyFlags: ["Penicillin"] },
  { id: "drug-3", name: "Ibuprofen", dosageOptions: ["200mg", "400mg"], frequencyOptions: ["As needed", "Three times daily"], interactsWith: ["Lisinopril", "Warfarin", "Aspirin"], allergyFlags: [] },
  { id: "drug-4", name: "Metformin", dosageOptions: ["500mg", "850mg", "1000mg"], frequencyOptions: ["Once daily", "Twice daily"], interactsWith: [], allergyFlags: [] },
  { id: "drug-5", name: "Warfarin", dosageOptions: ["1mg", "2mg", "5mg"], frequencyOptions: ["Once daily"], interactsWith: ["Ibuprofen", "Aspirin", "Amoxicillin"], allergyFlags: [] },
  { id: "drug-6", name: "Aspirin", dosageOptions: ["75mg", "300mg"], frequencyOptions: ["Once daily", "As needed"], interactsWith: ["Warfarin", "Ibuprofen"], allergyFlags: ["Aspirin"] },
  { id: "drug-7", name: "Sulfamethoxazole", dosageOptions: ["400mg", "800mg"], frequencyOptions: ["Twice daily"], interactsWith: [], allergyFlags: ["Sulfa drugs"] },
  { id: "drug-8", name: "Salbutamol Inhaler", dosageOptions: ["100mcg"], frequencyOptions: ["As needed"], interactsWith: [], allergyFlags: [] },
];

export function getDrugById(id) {
  return drugFormulary.find((drug) => drug.id === id);
}

export function checkPrescriptionSafety(drug, patient) {
  if (!drug || !patient) return { allergyHits: [], interactionHits: [] };
  const allergyHits = (patient.allergies || []).filter((allergy) =>
    drug.allergyFlags.some(
      (flag) => flag.toLowerCase() === allergy.toLowerCase(),
    ),
  );
  const interactionHits = (patient.medications || []).filter((med) =>
    drug.interactsWith.some(
      (name) => name.toLowerCase() === med.name.toLowerCase(),
    ),
  );
  return { allergyHits, interactionHits };
}

export const providerMessageThreads = [
  {
    id: "pthread-1",
    patientId: "pt-1",
    lastMessage: "Should I stop the metformin before my blood test on Friday?",
    timestamp: "38m ago",
    unreadCount: 1,
  },
  {
    id: "pthread-2",
    patientId: "pt-2",
    lastMessage: "I've been feeling dizzy and weak since yesterday.",
    timestamp: "2h ago",
    unreadCount: 2,
  },
  {
    id: "pthread-3",
    patientId: "pt-3",
    lastMessage: "Thank you doctor, the inhaler is working well.",
    timestamp: "Yesterday",
    unreadCount: 0,
  },
];

export function getProviderThreadByPatientId(patientId) {
  return providerMessageThreads.find((thread) => thread.patientId === patientId);
}

export const providerChatMessages = {
  "pt-1": [
    {
      id: "pc1-1",
      sender: "patient",
      text: "Good morning doctor, quick question about my meds.",
      timestamp: "9:02 AM",
      date: "Today",
    },
    {
      id: "pc1-2",
      sender: "patient",
      text: "Should I stop the metformin before my blood test on Friday?",
      timestamp: "9:03 AM",
      date: "Today",
    },
  ],
  "pt-2": [
    {
      id: "pc2-1",
      sender: "patient",
      text: "I've been feeling dizzy and weak since yesterday.",
      timestamp: "7:40 AM",
      date: "Today",
    },
    {
      id: "pc2-2",
      sender: "doctor",
      text: "Thanks for flagging this — I'm reviewing your latest labs now.",
      timestamp: "7:55 AM",
      date: "Today",
    },
  ],
  "pt-3": [
    {
      id: "pc3-1",
      sender: "doctor",
      text: "Your inhaler refill has been sent to your pharmacy.",
      timestamp: "3:30 PM",
      date: "Yesterday",
    },
    {
      id: "pc3-2",
      sender: "patient",
      text: "Thank you doctor, the inhaler is working well.",
      timestamp: "4:05 PM",
      date: "Yesterday",
    },
  ],
};

export function getProviderChatMessages(patientId) {
  return providerChatMessages[patientId] ?? [];
}

export const questionnaireResponses = {
  "pt-1": {
    submittedAt: "8:52 AM",
    answers: [
      { question: "Do you currently have fever or chills?", answer: "No" },
      { question: "Have you started any new medications recently?", answer: "No" },
      { question: "Have you had any allergic reactions lately?", answer: "No" },
    ],
    notes: "Just want to confirm my metformin dose before the blood test on Friday.",
  },
  "pt-2": {
    submittedAt: "10:02 AM",
    answers: [
      { question: "Do you currently have fever or chills?", answer: "No" },
      { question: "Have you started any new medications recently?", answer: "Yes" },
      { question: "Have you had any allergic reactions lately?", answer: "No" },
    ],
    notes: "Started an over-the-counter pain reliever for a headache 2 days ago.",
  },
};

export function getQuestionnaireResponse(patientId) {
  return questionnaireResponses[patientId] ?? null;
}
