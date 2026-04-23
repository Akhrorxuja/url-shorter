import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/lib/providers'

export const metadata: Metadata = {
  title: 'URL Shortener',
  description: 'Shorten URLs and track analytics',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        <Providers>
          <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-xs">U</div>
                <span className="font-semibold text-white">URL Shortener</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a>
                <a href="http://localhost:3100" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Grafana
                </a>
                <a href="http://localhost:3001/api/docs" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />API Docs
                </a>
              </div>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
