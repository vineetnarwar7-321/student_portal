'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import api from '@/lib/api'
import { useEffect, useState } from 'react'

export default function MasterPage() {
  const [stats, setStats] = useState({ students: 0, admins: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/master/students'),
      api.get('/master/admins'),
    ]).then(([s, a]) => {
      setStats({ students: s.data.length, admins: a.data.length })
    })
  }, [])

  const downloadReport = async () => {
    const res = await api.get('/master/report', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'student_report.pdf')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <ProtectedRoute allowedRoles={['master_admin']}>
      <Navbar />
      <main className="max-w-4xl mx-auto mt-10 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Master Admin Dashboard</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-4xl font-bold text-blue-600">{stats.students}</p>
            <p className="text-gray-500 mt-1">Total Students</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-4xl font-bold text-purple-600">{stats.admins}</p>
            <p className="text-gray-500 mt-1">Domain Admins</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Link href="/master/create-admin"
            className="bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition text-center">
            Create Domain Admin
          </Link>
          <Link href="/master/students"
            className="bg-white border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition text-center">
            View All Students
          </Link>
          <button
            onClick={downloadReport}
            className="bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition">
            Download PDF Report
          </button>
        </div>
      </main>
    </ProtectedRoute>
  )
}