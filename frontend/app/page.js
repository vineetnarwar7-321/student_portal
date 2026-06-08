import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Student Verification Portal
        </h1>
        <p className="text-gray-500 mb-8">
          Verify your domain credentials across GnS, AnC, SnT and MnC
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="border border-blue-600 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}