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

  if (!mounted) return <div className="min-h-screen bg-[#EFF3F7]" />

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: '#EFF3F7' }}>
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm max-w-md w-full">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="text-xl font-bold text-[#1C2B3A]">Belum Ada Ringkasan</h1>
          <button onClick={() => router.push('/')} className="inline-block mt-6 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: '#3B6B7C' }}>
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
    <main className="min-h-screen py-10 px-4" style={{ background: '#EFF3F7' }}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Score Card */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_32px_rgba(36,59,85,0.08)] text-center anim-fade-up">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-2xl font-bold text-[#1C2B3A] mb-2">Ringkasan Sesi</h1>
          <p className="text-[#536878] text-sm mb-6">{session.topic}</p>
          
          <div className="flex items-center justify-center gap-8">
            <div>
              <div className="text-4xl font-bold text-[#3B6B7C]">{session.score}%</div>
              <div className="text-xs text-[#8DA4B4] uppercase tracking-wide mt-1">Skor</div>
            </div>
            <div className="w-px h-12 bg-[#E8F2F6]" />
            <div>
              <div className="text-4xl font-bold text-[#3B6B7C]">{session.totalSteps}</div>
              <div className="text-xs text-[#8DA4B4] uppercase tracking-wide mt-1">Langkah</div>
            </div>
            <div className="w-px h-12 bg-[#E8F2F6]" />
            <div>
              <div className={`text-base font-semibold ${isPass ? 'text-[#3A8C6E]' : 'text-[#C47E2A]'}`}>
                {isPass ? 'Lulus ✓' : 'Perlu Review'}
              </div>
              <div className="text-xs text-[#8DA4B4] uppercase tracking-wide mt-1">Status</div>
            </div>
          </div>
        </div>

        {/* Recommendation if steps to revisit */}
        {stepsToRevisit.length > 0 && (
          <div className="bg-[#FFF9E6] border border-[#FFECB3] rounded-2xl p-6 anim-fade-up">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h2 className="font-bold text-[#A67C00] mb-1">Rekomendasi untuk Kamu</h2>
                <p className="text-[#A67C00] text-sm leading-relaxed">
                  Coba ulangi <strong>Langkah {stepsToRevisit.join(' & ')}</strong> untuk memperkuat pemahamanmu sebelum melanjutkan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Missed Questions Detail */}
        {session.missedQuestions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm anim-fade-up">
            <h2 className="font-bold text-[#1C2B3A] mb-4 text-lg">📋 Soal yang Perlu Dipelajari Lagi</h2>
            <div className="space-y-4">
              {session.missedQuestions.map((mq, i) => (
                <div key={i} className="border border-[#E8F2F6] rounded-xl p-4">
                  <p className="font-medium text-[#1C2B3A] text-sm mb-2">{mq.question}</p>
                  <p className="text-xs text-[#3A8C6E] font-semibold mb-1">Jawaban: {mq.correctAnswer}</p>
                  <p className="text-xs text-[#536878] leading-relaxed">{mq.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pb-8 anim-fade-up">
          {!isPass && (
            <button onClick={() => router.push('/steps')} className="w-full py-4 rounded-xl font-semibold text-[#3B6B7C] border-2 border-[#3B6B7C] hover:bg-white transition-colors">
              Ulangi Sesi Ini
            </button>
          )}
          <button onClick={() => router.push('/history')} className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90" style={{ background: '#3B6B7C' }}>
            Lihat Riwayat Belajar
          </button>
          <button onClick={() => router.push('/')} className="w-full py-4 rounded-xl font-semibold text-[#536878] border border-[#CCDAE4] bg-white hover:bg-[#F7FAFB] transition-colors">
            Input Materi Baru ✨
          </button>
        </div>

      </div>
    </main>
  )
}
