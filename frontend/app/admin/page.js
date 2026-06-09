'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

const statusConfig = {
  pending:  { color: 'bg-yellow-50 border-yellow-200 text-yellow-700', label: 'Pending'  },
  approved: { color: 'bg-green-50 border-green-200 text-green-700',   label: 'Approved' },
  rejected: { color: 'bg-red-50 border-red-200 text-red-700',         label: 'Rejected' },
}

export default function AdminPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [notes, setNotes] = useState({})
  const [toast, setToast] = useState(null)
  const [loadingId, setLoadingId] = useState(null)

  const fetchRequests = () => {
    api.get('/admin/requests').then((res) => setRequests(res.data))
  }

  useEffect(() => { fetchRequests() }, [])

  const showToast = (text, type = 'success') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleReview = async (id, status) => {
    setLoadingId(id + status)
    try {
      await api.patch(`/admin/requests/${id}`, {
        status,
        admin_note: notes[id] || '',
      })
      showToast(`Request ${status} successfully`)
      fetchRequests()
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['domain_admin']}>
      <Navbar />
      <main className="max-w-3xl mx-auto mt-10 px-4 pb-10">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white
            ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {toast.text}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user?.domain} — Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review verification applications</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
            {requests.length} total
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
            No requests for your domain yet.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {requests.map((r) => {
              const s = statusConfig[r.status] || statusConfig.pending
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

                  {/* Student info + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{r.student_name}</p>
                      <p className="text-sm text-gray-500">{r.student_email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(r.submitted_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${s.color}`}>
                      {s.label}
                    </span>
                  </div>

                  {/* Student message */}
                  {r.message && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                      <p className="text-xs text-blue-400 font-medium mb-1">Student message</p>
                      <p className="text-sm text-gray-700">{r.message}</p>
                    </div>
                  )}

                  {/* Previous admin note */}
                  {r.admin_note && r.status !== 'pending' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">Your previous reply</p>
                      <p className="text-sm text-gray-600">{r.admin_note}</p>
                    </div>
                  )}

                  {/* Action area — only for pending */}
                  {r.status === 'pending' && (
                    <div className="border-t border-gray-100 pt-4 mt-2">
                      <textarea
                        value={notes[r.id] || ''}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        rows={2}
                        placeholder="Write a reply to the student (optional)..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(r.id, 'approved')}
                          disabled={loadingId === r.id + 'approved'}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-xl transition disabled:opacity-50"
                        >
                          {loadingId === r.id + 'approved' ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleReview(r.id, 'rejected')}
                          disabled={loadingId === r.id + 'rejected'}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-xl transition disabled:opacity-50"
                        >
                          {loadingId === r.id + 'rejected' ? 'Processing...' : '✕ Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}