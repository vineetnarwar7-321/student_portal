'use client'

import { useEffect, useState, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ college: '', year: '', phone: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const fetchProfile = () => {
    api.get('/student/profile').then((res) => {
      setProfile(res.data)
      setForm({
        college: res.data.college || '',
        year: res.data.year || '',
        phone: res.data.phone || '',
      })
    })
  }

  useEffect(() => { fetchProfile() }, [])

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('photo', file)
      await api.post('/student/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      fetchProfile()
      setMessage('Photo updated successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await api.put('/student/profile', { ...form, year: parseInt(form.year) || 0 })
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed')
    }
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-2xl mx-auto mt-10 px-4 pb-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

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

        {/* Photo + basic info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                {profile?.photo_url ? (
                  <img
                    src={`http://localhost:8080${profile.photo_url}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-blue-600">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileRef.current.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs shadow hover:bg-blue-700 transition"
              >
                {uploading ? '...' : '✎'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{profile?.name}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <span className="inline-block mt-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Student
              </span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Edit Details</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">College</label>
              <input
                type="text"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="Your college name"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Year</label>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition mt-2"
            >
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  )
}