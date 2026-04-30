import type { Metadata } from 'next'
import { Lexend, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import PomodoroTimer from '@/components/PomodoroTimer'

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
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
    <html lang="id" className={`${lexend.variable} ${jakarta.variable}`}>
      <body className="antialiased">
        {children}
        <PomodoroTimer />
      </body>
    </html>
  )
}
