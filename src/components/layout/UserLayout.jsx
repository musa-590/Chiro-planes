import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { APP_NAME } from '../../lib/constants.js'
import { todayShortDate } from '../../lib/date.js'
import ExpirationAlert from '../user/ExpirationAlert.jsx'
import { useUserPlan } from '../../hooks/useUserPlan.js'
import ThemeToggle from '../ThemeToggle.jsx'
import { TodayIcon, ChartIcon, SendIcon } from '../icons.jsx'

const nav = [
  { to: '/app/today', label: 'Hoy', Icon: TodayIcon },
  { to: '/app/history', label: 'Historial', Icon: ChartIcon },
  { to: '/app/close', label: 'Cerrar', Icon: SendIcon },
]

export default function UserLayout() {
  const { session, signOut } = useAuth()
  const { plan, daysLeft } = useUserPlan(session?.user?.id)
  const navigate = useNavigate()
  const location = useLocation()

  const activeIndex = Math.max(0, nav.findIndex((n) => location.pathname.startsWith(n.to)))

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <header className="sticky top-0 z-40 bg-ink border-b border-ink-700 safe-area-pt">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="font-bold text-accent text-lg">{APP_NAME}</h1>
            <p className="text-xs text-muted">{todayShortDate()}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={signOut} className="text-sm text-muted-light min-h-10 px-3">Salir</button>
          </div>
        </div>
        {plan && daysLeft !== null && daysLeft >= 0 && daysLeft <= 5 && (
          <ExpirationAlert daysLeft={daysLeft} onRenew={() => navigate('/app/close')} />
        )}
      </header>

      <main key={location.pathname} className="flex-1 max-w-md w-full mx-auto px-4 py-4 pb-32 animate-bookTurn" style={{ perspective: '1800px' }}>
        <Outlet />
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 safe-area-pb pointer-events-none">
        <nav
          className="pointer-events-auto max-w-md mx-auto bg-ink-900/85 backdrop-blur-xl border border-ink-700/60 rounded-full shadow-2xl shadow-black/60"
          style={{ boxShadow: '0 -10px 40px -5px rgba(0,0,0,0.5), 0 8px 24px -8px rgba(0,0,0,0.6)' }}
        >
          <div className="relative p-1.5">
            <div
              className="absolute top-1.5 bottom-1.5 left-1.5 bg-accent rounded-full transition-transform duration-500 ease-out shadow-lg shadow-accent/40"
              style={{
                width: `calc((100% - 12px) / ${nav.length})`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
              aria-hidden="true"
            />
            <ul className="relative flex items-stretch">
              {nav.map((item) => {
                const Icon = item.Icon
                return (
                  <li key={item.to} className="flex-1">
                    <NavLink to={item.to} className="block">
                      {({ isActive }) => (
                        <div
                          className={`flex flex-col items-center justify-center gap-0.5 min-h-11 py-1.5 px-2 rounded-full transition-colors duration-300 ${
                            isActive ? 'text-ink' : 'text-muted hover:text-muted-light'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                            isActive ? 'opacity-100' : 'opacity-80'
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  )
}
