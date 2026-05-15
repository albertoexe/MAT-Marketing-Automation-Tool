import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import NotificationBell from '../features/notifications/NotificationBell'

interface NavItem {
  to: string
  label: string
  icon: string
  roles?: ('marketing' | 'sales')[]
}

const NAV: NavItem[] = [
  { to: '/',          label: 'Dashboard',  icon: '▦' },
  { to: '/contatti',  label: 'Contatti',   icon: '👥' },
  { to: '/pipeline',  label: 'Pipeline',   icon: '⟶' },
  { to: '/attivita',  label: 'Attività',   icon: '✓' },
  // Marketing-only
  { to: '/scoring',       label: 'Punteggio',    icon: '📊', roles: ['marketing'] },
  { to: '/automazioni',   label: 'Automazioni',  icon: '⚡', roles: ['marketing'] },
]

export default function Sidebar(): React.JSX.Element {
  const { user, signOut } = useAuth()

  const visibleNav = NAV.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <span className="text-xs font-bold text-white">C</span>
        </div>
        <span className="font-semibold text-gray-900">CRM</span>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-400">
              {user?.role === 'marketing' ? 'Marketing' : 'Vendite'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="ml-2 text-xs text-gray-400 hover:text-gray-600"
            title="Esci"
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  )
}
