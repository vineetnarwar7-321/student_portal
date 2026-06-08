'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

const domainInfo = {
  GnS: { color: 'from-blue-500 to-blue-600', light: 'bg-blue-50 border-blue-200 text-blue-700', label: 'Games & Sports' },
  AnC: { color: 'from-purple-500 to-purple-600', light: 'bg-purple-50 border-purple-200 text-purple-700', label: 'Arts & Culture' },
  SnT: { color: 'from-green-500 to-green-600', light: 'bg-green-50 border-green-200 text-green-700', label: 'Science & Tech' },
  MnC: { color: 'from-orange-500 to-orange-600', light: 'bg-orange-50 border-orange-200 text-orange-700', label: 'Media & Comm' },
}

export default function CardPage() {
  const { user } = useAuth()
  const [domains, setDomains] = useState([])
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    api.get('/student/verified').then((res) => setDomains(res.data.verified_domains))
    api.get('/student/profile').then((res) => setProfile(res.data))
  }, [])

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-md mx-auto mt-10 px-4 pb-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Verified Card</h1>

        {/* Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Student Portal</p>
              <p className="text-white font-bold text-lg mt-0.5">IITK Verification</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center">
              {profile?.photo_url ? (
                <img
                  src={`http://localhost:8080${profile.photo_url}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-white text-lg">{user?.name}</p>
              <p className="text-blue-200 text-sm">{user?.email}</p>
              {profile?.college && (
                <p className="text-blue-200 text-xs mt-0.5">{profile.college} — Year {profile.year}</p>
              )}
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-2">
              Verified Domains
            </p>
            {domains.length === 0 ? (
              <p className="text-white/60 text-sm">No domains verified yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => (
                  <span key={d} className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
                    ✓ {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Domain details */}
        {domains.length > 0 && (
          <div className="flex flex-col gap-3">
            {domains.map((d) => (
              <div key={d} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${domainInfo[d]?.light}`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${domainInfo[d]?.color} flex items-center justify-center text-white text-xs font-bold`}>
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-sm">{d}</p>
                  <p className="text-xs opacity-70">{domainInfo[d]?.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}