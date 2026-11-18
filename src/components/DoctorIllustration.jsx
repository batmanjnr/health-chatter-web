/* Flat cartoon doctor used in the hero card and the footer. Pure SVG, no external image. */
export default function DoctorIllustration({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 240 320" role="img" aria-label="Healthchatter doctor illustration">
      {/* coat body */}
      <path d="M40 320 C40 250 60 215 120 205 C180 215 200 250 200 320 Z" fill="#F7FBFB" stroke="#0B4F5C" strokeWidth="3" />
      {/* scrubs V */}
      <path d="M95 210 L120 260 L145 210 Z" fill="#6C4AB6" stroke="#0B4F5C" strokeWidth="3" strokeLinejoin="round" />
      {/* lapels */}
      <path d="M95 210 L108 290 L82 240 Z" fill="#E6F2F1" stroke="#0B4F5C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M145 210 L132 290 L158 240 Z" fill="#E6F2F1" stroke="#0B4F5C" strokeWidth="3" strokeLinejoin="round" />
      {/* neck */}
      <path d="M106 180 L106 212 L134 212 L134 180 Z" fill="#8A5A3B" />
      {/* stethoscope */}
      <path d="M96 212 C80 250 88 280 112 286" fill="none" stroke="#1F2A33" strokeWidth="5" strokeLinecap="round" />
      <path d="M144 212 C160 250 152 272 140 278" fill="none" stroke="#1F2A33" strokeWidth="5" strokeLinecap="round" />
      <circle cx="140" cy="282" r="9" fill="#9AA7B0" stroke="#1F2A33" strokeWidth="3" />
      {/* pocket + pen */}
      <rect x="150" y="262" width="28" height="22" rx="3" fill="#E6F2F1" stroke="#0B4F5C" strokeWidth="2.5" />
      <rect x="156" y="252" width="4" height="16" rx="2" fill="#0E9C8F" />
      {/* ears */}
      <ellipse cx="76" cy="132" rx="9" ry="13" fill="#8A5A3B" stroke="#5B3A25" strokeWidth="2" />
      <ellipse cx="164" cy="132" rx="9" ry="13" fill="#8A5A3B" stroke="#5B3A25" strokeWidth="2" />
      {/* head */}
      <ellipse cx="120" cy="130" rx="44" ry="54" fill="#9A6644" stroke="#5B3A25" strokeWidth="3" />
      {/* hair */}
      <path d="M76 120 C70 70 100 58 122 60 C150 60 172 76 164 122 C160 100 150 92 132 94 C112 96 92 92 80 104 Z" fill="#1B1B1F" />
      {/* brows */}
      <path d="M96 118 Q105 112 113 117" stroke="#1B1B1F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M127 117 Q135 112 144 118" stroke="#1B1B1F" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <ellipse cx="105" cy="131" rx="5" ry="6" fill="#1B1B1F" />
      <ellipse cx="135" cy="131" rx="5" ry="6" fill="#1B1B1F" />
      <circle cx="107" cy="129" r="1.6" fill="#fff" />
      <circle cx="137" cy="129" r="1.6" fill="#fff" />
      {/* nose + smile */}
      <path d="M120 136 Q116 150 122 152" stroke="#5B3A25" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M104 160 Q120 174 136 160" stroke="#5B3A25" strokeWidth="3.5" fill="#fff" strokeLinecap="round" />
      {/* beard shadow */}
      <path d="M86 150 C92 182 148 182 154 150 C150 176 92 176 86 150 Z" fill="#1B1B1F" opacity="0.55" />
    </svg>
  )
}
