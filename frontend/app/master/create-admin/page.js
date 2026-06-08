'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'

const DOMAINS = ['GnS', 'AnC', 'SnT', 'MnC']

export default function CreateAdminPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', domain: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)
    try {
      await api.post('/master/create-admin', form)
      setMessage(`Domain admin for ${form.domain} created successfully`)
      setForm({ name: '', email: '', password: '', domain: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['master_admin']}>
      <Navbar />
      <main className="max-w-md mx-auto mt-10 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Domain Admin</h1>

        {message && <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg mb-4 text-sm">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Name</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email</label>
            <input type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Password</label>
            <input type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required minLength={6} />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Assign Domain</label>
            <select value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
              <option value="">-- Select domain --</option>
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </main>
    </ProtectedRoute>
  )
}