import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trading Watchlist',
  description: 'Real-time stock watchlist with Excel-like interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sheet-bg">{children}</body>
    </html>
  )
}

