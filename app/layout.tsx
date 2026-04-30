import type { Metadata } from 'next'
import { Lexend, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import PomodoroTimer from '@/components/PomodoroTimer'

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Smart Step Learning Assistant',
  description:
    'Ubah materi panjang menjadi langkah belajar yang mudah dipahami — dirancang untuk semua pelajar, terutama mereka dengan ADHD, disleksia, dan autisme.',
  keywords: ['belajar', 'micro-step', 'ADHD', 'disleksia', 'autisme', 'AI', 'pendidikan'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${lexend.variable} ${jakarta.variable}`}>
      <head>
        {/* Material Symbols Outlined font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased">
        {children}
        <PomodoroTimer />
      </body>
    </html>
  )
}
