'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type { Employee } from '@/lib/supabase/types'
import { Bell, Home, Clock, Calendar, Users, Settings, LogOut, Menu, X, ClockCheck } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  href: string
  label: string
  icon: ReactNode
}

function navItems(role: string): NavItem[] {
  const base: NavItem[] = [
    { href: '/dashboard',          label: 'Dashboard',    icon: <Home size={20} /> },
    { href: '/attendance',         label: 'Clock In/Out', icon: <Clock size={20} /> },
    { href: '/attendance/history', label: 'My Attendance',icon: <ClockCheck size={20} /> },
    { href: '/leave',              label: 'My Leave',     icon: <Calendar size={20} /> },
    { href: '/notifications',      label: 'Notifications',icon: <Bell size={20} /> },
  ]
  const adminExtra: NavItem[] = [
    { href: '/team',       label: 'Team',           icon: <Users size={20} /> },
    { href: '/team/leave', label: 'Leave Requests', icon: <Calendar size={20} /> },
  ]
  const superAdminExtra: NavItem[] = [
    { href: '/manage', label: 'Manage', icon: <Settings size={20} /> },
  ]

  if (role === 'super_admin') return [...base, ...adminExtra, ...superAdminExtra]
  if (role === 'admin')       return [...base, ...adminExtra]
  return base
}

export default function AppShell({
  employee,
  notificationCount,
  children,
}: {
  employee: Employee
  notificationCount: number
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const items = navItems(employee.role)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    return (
      <Link
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-sm min-h-[44px] transition-colors ${
          active
            ? 'bg-blue-700 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        {item.icon}
        <span>{item.label}</span>
        {item.href === '/notifications' && notificationCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Company name */}
          <span className="text-blue-700 font-bold text-lg tracking-tight md:block hidden">
            Icestasy HRMS
          </span>
          <span className="text-blue-700 font-bold text-base tracking-tight md:hidden">
            Icestasy
          </span>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1 py-0.5 min-w-[16px] text-center leading-none">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </Link>

            {/* Employee name */}
            <span className="hidden sm:block text-sm text-gray-700 font-medium max-w-[120px] truncate">
              {employee.full_name}
            </span>

            {/* Sign out */}
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium min-h-[44px] transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-gray-200 min-h-[calc(100vh-3.5rem)] sticky top-14 p-3 gap-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-1">
            Navigation
          </div>
          {items.map(item => <NavLink key={item.href} item={item} />)}
          <div className="mt-auto border-t border-gray-100 pt-3">
            <div className="px-3 py-2 text-xs text-gray-500">
              <div className="font-medium text-gray-700 truncate">{employee.full_name}</div>
              <div className="mt-0.5 capitalize">{employee.role.replace('_', ' ')}</div>
            </div>
          </div>
        </nav>

        {/* Mobile overlay menu */}
        {mobileMenuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/40 z-30"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav className="md:hidden fixed top-14 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 p-3 flex flex-col gap-1 overflow-y-auto">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                Navigation
              </div>
              {items.map(item => <NavLink key={item.href} item={item} />)}
              <div className="mt-auto border-t border-gray-100 pt-3">
                <div className="px-3 py-2 text-xs text-gray-500">
                  <div className="font-medium text-gray-700 truncate">{employee.full_name}</div>
                  <div className="mt-0.5 capitalize">{employee.role.replace('_', ' ')}</div>
                </div>
              </div>
            </nav>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex">
        {items.slice(0, 5).map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-xs font-medium transition-colors relative ${
                active ? 'text-blue-700' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="text-[10px] leading-none">{item.label.split(' ')[0]}</span>
              {item.href === '/notifications' && notificationCount > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] rounded-full px-1 py-0.5 leading-none">
                  {notificationCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
