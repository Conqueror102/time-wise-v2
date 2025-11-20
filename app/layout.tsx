import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TimeWise - Smart Attendance Management',
  description: 'Modern attendance tracking system with QR codes, biometric authentication, and real-time analytics',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
