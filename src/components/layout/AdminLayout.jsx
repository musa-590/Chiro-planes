import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { APP_NAME } from '../../lib/constants.js'
import { todayShortDate } from '../../lib/date.js'
import { useAuth } from '../../hooks/useAuth.js'
import ThemeToggle from '../ThemeToggle.jsx'

const nav = [
  { to: '/admin', label: 'Inicio', end: true },
  { to: '/admin/users', label: 'Usuarios' },
  { to: '/admin/plans', label: 'Planes' },
  { to: '/admin/foods', label: 'Alimentos' },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <header className="sticky top-0 z-40 bg-ink border-b border-ink-700 safe-area-pt">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-bold text-accent truncate">{APP_NAME}</h1>
            <p className="text-xs text-muted">{todayShortDate()} · Panel admin</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <button onClick={signOut} className="text-sm text-muted-light min-h-10 px-3">
              Salir
            </button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                  isActive ? 'bg-accent text-ink font-semibold' : 'text-muted-light border border-ink-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main key={location.pathname} className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 pb-12 animate-bookTurn" style={{ perspective: '1800px' }}>
        <Outlet />
      </main>
    </div>
  )
}
