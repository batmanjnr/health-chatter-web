import logoMark from '../assets/logo-mark.png'

export default function Logo({ light = false }) {
  return (
    <a href="#home" className={`logo ${light ? 'logo--light' : ''}`} aria-label="Healthchatter home">
      <img src={logoMark} alt="" width="34" height="34" />
      <span>Healthchatter</span>
    </a>
  )
}
