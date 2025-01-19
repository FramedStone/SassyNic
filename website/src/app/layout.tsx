import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import VerticalProgressBar from './components/VerticalProgressBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Your Chrome Extension',
  description: 'Enhance your browsing experience with our Chrome extension',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-800`}>
        <div className="relative">
          <main className="max-w-3xl mx-auto px-4">
            {children}
          </main>
          <VerticalProgressBar />
        </div>
      </body>
    </html>
  )
}