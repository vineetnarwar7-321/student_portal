'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

const statusColor = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState('')

  const fetchRequests = () => {
    api.get('/admin/requests').then((res) => setRequests(res.data))
  }

  useEffect(() => { fetchRequests() }, [])

  const handleReview = async (id, status) => {
    setMessage('')
    try {
      await api.patch(`/admin/requests/${id}`, { status })
      setMessage(`Request ${status} successfully`)
      fetchRequests()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Action failed')
    }
  }

  return (
    <ProtectedRoute allowedRoles={['domain_admin']}>
      <Navbar />
      <main className="max-w-4xl mx-auto mt-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {user?.domain} — Domain Requests
          </h1>
          <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
            {requests.length} total
          </span>
        </div>

        {message && (
          <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
            No requests for your domain yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{r.student_name}</p>
                  <p className="text-sm text-gray-500">{r.student_email}</p>
                  <p className="text-xs text-gray-400 mt-1">{r.submitted_at}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[r.status]}`}>
                    {r.status}
                  </span>
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReview(r.id, 'approved')}
                        className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(r.id, 'rejected')}
                        className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}