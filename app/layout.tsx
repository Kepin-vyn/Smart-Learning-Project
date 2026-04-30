import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Smart Step Learning Assistant',
  description:
    'Ubah materi panjang menjadi langkah belajar yang mudah dipahami — dirancang untuk semua pelajar, terutama mereka dengan ADHD, disleksia, dan autisme.',
  keywords: ['belajar', 'micro-step', 'ADHD', 'disleksia', 'autisme', 'AI', 'pendidikan'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
