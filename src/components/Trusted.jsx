/* PLACEHOLDER: the demo shows provider logos here. These are generic icon badges —
   replace them with real partner logos (and keep the "100+" figure only if it is true). */
const PROVIDERS = [
  { label: 'Hospital partner', icon: '🏥', color: '#0E9C8F' },
  { label: 'Clinic partner', icon: '🛡️', color: '#2E7BEF' },
  { label: 'Medical centre', icon: '➕', color: '#0B4F5C' },
  { label: 'Specialist hospital', icon: '❤️', color: '#C0392B' },
  { label: 'Diagnostics lab', icon: '🧪', color: '#6C4AB6' },
  { label: 'Health insurer', icon: '🔰', color: '#1F4FA8' },
  { label: 'Pharmacy network', icon: '🌿', color: '#2E9E5B' },
]

export default function Trusted() {
  return (
    <section className="trusted">
      <div className="container">
        <h2 className="trusted__title">Trusted By 100+ Healthcare Providers</h2>
        <ul className="trusted__row">
          {PROVIDERS.map((p) => (
            <li key={p.label} className="trusted__badge" title={p.label} style={{ color: p.color }}>
              <span aria-hidden="true">{p.icon}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
