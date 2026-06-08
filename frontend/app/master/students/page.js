'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'

export default function StudentsPage() {
  const [students, setStudents] = useState([])

  useEffect(() => {
    api.get('/master/students').then((res) => setStudents(res.data))
  }, [])

  return (
    <ProtectedRoute allowedRoles={['master_admin']}>
      <Navbar />
      <main className="max-w-5xl mx-auto mt-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">All Students</h1>
          <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
            {students.length} total
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">College</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Year</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No students registered yet.
                  </td>
                </tr>
              ) : (
                students.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-gray-600">{s.college || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.year || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </ProtectedRoute>
  )
}