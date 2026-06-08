'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const studentLinks = [
    { href: '/student/profile', label: 'Profile' },
    { href: '/student/request', label: 'Submit Request' },
    { href: '/student/requests', label: 'My Requests' },
    { href: '/student/card', label: 'Verified Card' },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Requests' },
  ]

  const masterLinks = [
    { href: '/master', label: 'Dashboard' },
    { href: '/master/create-admin', label: 'Create Admin' },
    { href: '/master/students', label: 'All Students' },
  ]

  const links =
    user.role === 'student' ? studentLinks :
    user.role === 'domain_admin' ? adminLinks :
    masterLinks

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-0 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="font-bold text-blue-600 text-base py-4">
          Student Portal
        </Link>
        <div className="flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm px-3 py-4 border-b-2 transition-colors ${
                pathname === link.href
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}