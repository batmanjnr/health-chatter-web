import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ROLES, SHARED_NAV } from '../config/roles.js'
import { Avatar, Icon } from '../components/ui/index.jsx'
import { useCollection } from '../lib/store.js'
import logoMark from '../assets/logo-mark.png'

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export default function AppShell() {
  const { user, signOut } = useAuth()
  const role = ROLES[user.role]
  const navigate = useNavigate()
  const location = useLocation()
  const online = useOnline()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [notifications] = useCollection('notifications')
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    setOpen(false)
    setMenu(false)
  }, [location.pathname])

  const link = (item) => (
    <NavLink
      key={item.path}
      to={item.path ? `${role.base}/${item.path}` : role.base}
      end={!item.path}
      className={({ isActive }) => `side__link ${isActive ? 'is-active' : ''}`}
    >
      <Icon name={item.icon} size={18} />
      <span>{item.label}</span>
    </NavLink>
  )

  return (
    <div className={`shell ${open ? 'is-open' : ''}`}>
      <aside className="side" aria-label="Main navigation">
        <a href="/" className="side__brand">
          <img src={logoMark} alt="" width="30" height="30" />
          <span>Healthchatter</span>
        </a>
        <div className="side__role">
          <small>Signed in as</small>
          <b>{role.label}</b>
        </div>
        <nav className="side__nav">
          {role.nav.map(link)}
          <hr />
          {SHARED_NAV.map(link)}
        </nav>
      </aside>
      <div className="shell__scrim" onClick={() => setOpen(false)} />

      <div className="main">
        <header className="top">
          <button className="icon-btn top__menu" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="Menu" />
          </button>
          <div className="top__context">
            {user.facility && (
              <span className="chip">
                <Icon name="Building2" size={14} /> {user.facility}
              </span>
            )}
            {user.payer && (
              <span className="chip">
                <Icon name="Shield" size={14} /> {user.payer}
              </span>
            )}
            <span className={`chip ${online ? 'chip--ok' : 'chip--warn'}`} title="Offline actions are queued and synced automatically">
              <Icon name={online ? 'Wifi' : 'WifiOff'} size={14} /> {online ? 'Online' : 'Offline — changes queued'}
            </span>
          </div>
          <button className="icon-btn top__bell" onClick={() => navigate(`${role.base}/notifications`)} aria-label={`Notifications (${unread} unread)`}>
            <Icon name="Bell" />
            {unread > 0 && <span className="dot">{unread}</span>}
          </button>
          <div className="top__user">
            <button className="top__user-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
              <Avatar name={user.name} size={32} />
              <span>
                <b>{user.name}</b>
                <small>{role.label}</small>
              </span>
              <Icon name="ChevronDown" size={16} />
            </button>
            {menu && (
              <div className="menu">
                <button onClick={() => navigate(`${role.base}/settings`)}>
                  <Icon name="Settings" size={16} /> Settings
                </button>
                <button onClick={() => navigate(`${role.base}/help`)}>
                  <Icon name="CircleHelp" size={16} /> Help & Support
                </button>
                <button
                  onClick={() => {
                    signOut()
                    navigate('/login')
                  }}
                >
                  <Icon name="LogOut" size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
