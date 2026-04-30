'use client'

import { useRouter } from 'next/navigation'
import { useLearningStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import type { SessionRecord } from '@/lib/types'

export default function SummaryPage() {
  const router = useRouter()
  const { result } = useLearningStore()
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem('smartstep_last_session')
      if (raw) setSession(JSON.parse(raw) as SessionRecord)
    } catch {}
  }, [])

  if (!mounted) return <div className="min-h-screen bg-[var(--color-bg)]" />

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm max-w-md w-full">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Belum Ada Ringkasan</h1>
          <button onClick={() => router.push('/')} className="inline-block mt-6 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: 'var(--color-primary)' }}>
            ← Kembali ke Beranda
          </button>
        </div>
      </main>
    )
  }

  const isPass = session.status === 'lulus'
  const emoji = session.score >= 80 ? '🏆' : session.score < 60 ? '🌱' : '⭐'

  // Figure out which steps to revisit based on missed questions
  const stepsToRevisit: number[] = []
  if (result?.steps && session.missedQuestions.length > 0) {
    result.steps.forEach((step, i) => {
      const isRelated = session.missedQuestions.some(mq =>
        mq.question.toLowerCase().includes(step.title.toLowerCase().split(' ')[0])
      )
      if (isRelated) stepsToRevisit.push(i + 1)
    })
    // Fallback: suggest last 2 steps if nothing matched
    if (stepsToRevisit.length === 0 && result.steps.length >= 2) {
      stepsToRevisit.push(result.steps.length - 1, result.steps.length)
    }
  }

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Score Card */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_32px_rgba(76,100,85,)] text-center anim-fade-up">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Ringkasan Sesi</h1>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">{session.topic}</p>
          
          <div className="flex items-center justify-center gap-8">
            <div>
              <div className="text-4xl font-bold text-[var(--color-primary)]">{session.score}%</div>
              <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wide mt-1">Skor</div>
            </div>
            <div className="w-px h-12 bg-[var(--color-primary-light)]" />
            <div>
              <div className="text-4xl font-bold text-[var(--color-primary)]">{session.totalSteps}</div>
              <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wide mt-1">Langkah</div>
            </div>
            <div className="w-px h-12 bg-[var(--color-primary-light)]" />
            <div>
              <div className={`text-base font-semibold ${isPass ? 'text-[var(--color-green)]' : 'text-[var(--color-amber)]'}`}>
                {isPass ? 'Lulus ✓' : 'Perlu Review'}
              </div>
              <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wide mt-1">Status</div>
            </div>
          </div>
        </div>

        {/* Recommendation if steps to revisit */}
        {stepsToRevisit.length > 0 && (
          <div className="bg-[var(--color-amber-bg)] border border-[var(--color-amber-border)] rounded-2xl p-6 anim-fade-up">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h2 className="font-bold text-[var(--color-amber)] mb-1">Rekomendasi untuk Kamu</h2>
                <p className="text-[var(--color-amber)] text-sm leading-relaxed">
                  Coba ulangi <strong>Langkah {stepsToRevisit.join(' & ')}</strong> untuk memperkuat pemahamanmu sebelum melanjutkan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Missed Questions Detail */}
        {session.missedQuestions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm anim-fade-up">
            <h2 className="font-bold text-[var(--color-text)] mb-4 text-lg">📋 Soal yang Perlu Dipelajari Lagi</h2>
            <div className="space-y-4">
              {session.missedQuestions.map((mq, i) => (
                <div key={i} className="border border-[var(--color-primary-light)] rounded-xl p-4">
                  <p className="font-medium text-[var(--color-text)] text-sm mb-2">{mq.question}</p>
                  <p className="text-xs text-[var(--color-green)] font-semibold mb-1">Jawaban: {mq.correctAnswer}</p>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{mq.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pb-8 anim-fade-up">
          {!isPass && (
            <button onClick={() => router.push('/steps')} className="w-full py-4 rounded-xl font-semibold text-[var(--color-primary)] border-2 border-[var(--color-primary)] hover:bg-white transition-colors">
              Ulangi Sesi Ini
            </button>
          )}
          <button onClick={() => router.push('/history')} className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90" style={{ background: 'var(--color-primary)' }}>
            Lihat Riwayat Belajar
          </button>
          <button onClick={() => router.push('/')} className="w-full py-4 rounded-xl font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-2)] transition-colors">
            Input Materi Baru ✨
          </button>
        </div>

      </div>
    </main>
  )
}
