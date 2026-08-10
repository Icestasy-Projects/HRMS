import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Icestasy HRMS',
  description: 'Human Resource Management System',
  icons: {
    icon: '/favicon.jpeg',
    apple: '/favicon.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
