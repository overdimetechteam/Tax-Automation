import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, LogOut, Menu, ChevronRight, User, Banknote
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import clsx from 'clsx'

const NAV_ITEMS = [
  { path: '/accounts/dashboard', icon: LayoutDashboard, label: 'Payment Queue', exact: true },
]

export default function AccountsDeptLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-brand-black overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-brand-black-light border-r border-brand-gray-border',
        'flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-gray-border">
          <img src="/logo.png" alt="OVERDIME - TMS" className="h-9 w-auto object-contain" />
          <p className="text-xs text-blue-400">Accounts Division</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label, exact }) => {
            const active = exact ? location.pathname === path : location.pathname.startsWith(path)
            return (
              <button
                key={path}
                onClick={() => { navigate(path); setSidebarOpen(false) }}
                className={clsx('sidebar-item w-full', active ? 'sidebar-item-active' : 'sidebar-item-inactive')}
              >
                <Icon size={17} />
                <span>{label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </button>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-brand-gray-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
              <User size={14} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Accounts Officer'}</p>
              <p className="text-xs text-brand-gray truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="sidebar-item sidebar-item-inactive w-full mt-1">
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-brand-gray-border bg-brand-black-light flex items-center justify-between px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-brand-gray hover:text-white">
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <Banknote size={16} className="text-blue-400" />
            <p className="text-sm text-brand-gray">Accounts Division — <span className="text-white font-medium">Y/A 2025/2026</span></p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
