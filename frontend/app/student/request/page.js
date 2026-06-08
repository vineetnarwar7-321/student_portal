'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'

const DOMAINS = [
  { id: 'GnS', label: 'Games & Sports',       color: 'blue'   },
  { id: 'AnC', label: 'Academic and Career',        color: 'purple' },
  { id: 'SnT', label: 'Science & Technology',  color: 'green'  },
  { id: 'MnC', label: 'Media & Cultural', color: 'orange' },
]

const colorMap = {
  blue:   { card: 'border-blue-200 bg-blue-50',     badge: 'bg-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700' },
  purple: { card: 'border-purple-200 bg-purple-50', badge: 'bg-purple-600', btn: 'bg-purple-600 hover:bg-purple-700' },
  green:  { card: 'border-green-200 bg-green-50',   badge: 'bg-green-600',  btn: 'bg-green-600 hover:bg-green-700' },
  orange: { card: 'border-orange-200 bg-orange-50', badge: 'bg-orange-500', btn: 'bg-orange-500 hover:bg-orange-600' },
}

export default function RequestPage() {
  const [existingRequests, setExistingRequests] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loadingDomain, setLoadingDomain] = useState(null)

  const fetchRequests = () => {
    api.get('/student/requests').then((res) => setExistingRequests(res.data))
  }

  useEffect(() => { fetchRequests() }, [])

  const getStatusForDomain = (domainId) => {
    const req = existingRequests.find((r) => r.domain === domainId)
    return req ? req.status : null
  }

  const handleSubmit = async (domainId) => {
    setMessage('')
    setError('')
    setLoadingDomain(domainId)
    try {
      await api.post('/student/request', { domain: domainId })
      setMessage(`Request submitted for ${domainId} successfully`)
      fetchRequests()
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed')
    } finally {
      setLoadingDomain(null)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-2xl mx-auto mt-10 px-4 pb-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Submit Verification Request</h1>
        <p className="text-gray-500 text-sm mb-6">
          You can apply to multiple domains. Each domain can only be applied once.
        </p>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <span>✓</span> {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <span>✕</span> {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {DOMAINS.map((d) => {
            const status = getStatusForDomain(d.id)
            const c = colorMap[d.color]
            const isLoading = loadingDomain === d.id

            return (
              <div
                key={d.id}
                className={`border rounded-2xl p-5 flex items-center justify-between transition
                  ${status ? c.card : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${c.badge} flex items-center justify-center text-white font-bold text-sm`}>
                    {d.id}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{d.id}</p>
                    <p className="text-xs text-gray-500">{d.label}</p>
                  </div>
                </div>

                <div>
                  {status === 'pending' && (
                    <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-medium px-3 py-1.5 rounded-full">
                      ⏳ Pending
                    </span>
                  )}
                  {status === 'approved' && (
                    <span className="bg-green-100 text-green-700 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-full">
                      ✓ Approved
                    </span>
                  )}
                  {status === 'rejected' && (
                    <button
                      onClick={() => handleSubmit(d.id)}
                      disabled={isLoading}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-1.5 rounded-full transition disabled:opacity-50"
                    >
                      {isLoading ? 'Submitting...' : 'Reapply'}
                    </button>
                  )}
                  {!status && (
                    <button
                      onClick={() => handleSubmit(d.id)}
                      disabled={isLoading}
                      className={`${c.btn} text-white text-xs font-medium px-4 py-1.5 rounded-full transition disabled:opacity-50`}
                    >
                      {isLoading ? 'Submitting...' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </ProtectedRoute>
  )
}