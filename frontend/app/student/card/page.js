
'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

const domainInfo = {
  GnS: { grad: 'from-blue-500 to-blue-600',     light: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   label: 'Games & Sports'        },
  AnC: { grad: 'from-purple-500 to-purple-600',  light: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Arts & Culture'        },
  SnT: { grad: 'from-green-500 to-green-600',    light: 'bg-green-50 border-green-200',   text: 'text-green-700',  label: 'Science & Technology'  },
  MnC: { grad: 'from-orange-500 to-orange-600',  light: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: 'Media & Communication' },
}

export default function CardPage() {
  const { user } = useAuth()
  const [verified, setVerified] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/student/verified'),
      api.get('/student/profile'),
    ]).then(([vRes, pRes]) => {
      setVerified(vRes.data.verified_requests || [])
      setProfile(pRes.data)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-xl mx-auto mt-10 px-4 pb-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Verified Card</h1>

        {/* Student identity card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">IITK Student Portal</p>
              <p className="text-white font-bold text-lg mt-0.5">Verification Card</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
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
              <p className="font-bold text-white text-lg leading-tight">{user?.name}</p>
              <p className="text-blue-200 text-sm">{user?.email}</p>
              {profile?.college && (
                <p className="text-blue-200 text-xs mt-0.5">
                  {profile.college} {profile.year ? `· Year ${profile.year}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-white/20 pt-3">
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-2">
              Verified in {verified.length} domain{verified.length !== 1 ? 's' : ''}
            </p>
            {verified.length === 0 ? (
              <p className="text-white/50 text-sm">No approvals yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {verified.map((v) => (
                  <span key={v.id} className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
                    ✓ {v.domain}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Individual approved request cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
        ) : verified.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">No approved requests yet.</p>
            <a href="/student/request" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Submit a request →
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {verified.map((v) => {
              const info = domainInfo[v.domain] || domainInfo.GnS
              return (
                <div key={v.id} className={`border rounded-2xl overflow-hidden shadow-sm ${info.light}`}>

                  {/* Domain header */}
                  <div className={`bg-gradient-to-r ${info.grad} px-5 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{v.domain}</span>
                      <span className="text-white/70 text-xs">· {info.label}</span>
                    </div>
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      ✓ Approved
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-4 bg-white">

                    {/* Student message */}
                    {v.message && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 font-medium mb-1">Your message</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{v.message}</p>
                      </div>
                    )}

                    {/* Admin note */}
                    {v.admin_note && (
                      <div className={`rounded-xl px-4 py-3 border ${info.light} mt-2`}>
                        <p className={`text-xs font-medium mb-1 ${info.text}`}>Admin reply</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{v.admin_note}</p>
                      </div>
                    )}

                    {/* Date */}
                    <p className="text-xs text-gray-400 mt-3">
                      Approved on {new Date(v.submitted_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
