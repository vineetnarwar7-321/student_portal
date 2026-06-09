
'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'

const DOMAINS = [
  { id: 'GnS', label: 'Games & Sports',        bg: 'bg-blue-600'   },
  { id: 'AnC', label: 'Arts & Culture',         bg: 'bg-purple-600' },
  { id: 'SnT', label: 'Science & Technology',   bg: 'bg-green-600'  },
  { id: 'MnC', label: 'Media & Communication',  bg: 'bg-orange-500' },
]

export default function RequestPage() {
  const [messages, setMessages] = useState({ GnS: '', AnC: '', SnT: '', MnC: '' })
  const [loadingDomain, setLoadingDomain] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (text, type = 'success') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async (domainId) => {
    setLoadingDomain(domainId)
    try {
      await api.post('/student/request', {
        domain: domainId,
        message: messages[domainId],
      })
      showToast('Request submitted for ' + domainId)
      setMessages((prev) => ({ ...prev, [domainId]: '' }))
    } catch (err) {
      showToast(err.response?.data?.error || 'Submission failed', 'error')
    } finally {
      setLoadingDomain(null)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-2xl mx-auto mt-10 px-4 pb-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Submit Verification Request</h1>
        <p className="text-gray-500 text-sm mb-6">
          Submit to any domain as many times as you want. Add a message to support your application.
        </p>

        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white
            ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {toast.type === 'error' ? '✕ ' : '✓ '}{toast.text}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {DOMAINS.map((d) => (
            <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${d.bg} flex items-center justify-center text-white font-bold text-sm`}>
                  {d.id}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{d.id}</p>
                  <p className="text-xs text-gray-500">{d.label}</p>
                </div>
              </div>

              <textarea
                value={messages[d.id]}
                onChange={(e) => setMessages((prev) => ({ ...prev, [d.id]: e.target.value }))}
                rows={3}
                placeholder={'Why do you want to join ' + d.id + '? (optional)'}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
              />

              <button
                onClick={() => handleSubmit(d.id)}
                disabled={loadingDomain === d.id}
                className={`w-full ${d.bg} text-white text-sm font-medium py-2.5 rounded-xl transition hover:opacity-90 disabled:opacity-50`}
              >
                {loadingDomain === d.id ? 'Submitting...' : 'Submit Request to ' + d.id}
              </button>
            </div>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  )
}