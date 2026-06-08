import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'Student Verification Portal',
  description: 'Student domain verification system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}