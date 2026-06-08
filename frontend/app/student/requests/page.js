'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'

const statusColor = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function RequestsPage() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    api.get('/student/requests').then((res) => setRequests(res.data))
  }, [])

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-2xl mx-auto mt-10 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Requests</h1>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
            No requests submitted yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{r.domain}</p>
                  <p className="text-xs text-gray-400 mt-1">{r.submitted_at}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[r.status]}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}