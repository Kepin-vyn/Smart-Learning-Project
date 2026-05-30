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

  if (!mounted) return <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} />

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center p-12 rounded-[2rem] max-w-md w-full shadow-card border"
          style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-border)' }}>
          <span className="material-symbols-outlined text-5xl block mb-4" style={{ color: 'var(--color-primary-container)' }}>inbox</span>
          <h1 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>Belum Ada Ringkasan</h1>
          <button onClick={() => router.push('/')}
            className="px-6 py-3 rounded-full font-semibold text-sm squishy-btn"
            style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-container)' }}>
            ← Kembali ke Beranda
          </button>
        </div>
      </main>
    )
  }

  const isPass = session.status === 'lulus'

  const stepsToRevisit: number[] = []
  if (result?.steps && session.missedQuestions.length > 0) {
    result.steps.forEach((step, i) => {
      const isRelated = session.missedQuestions.some(mq =>
        mq.question.toLowerCase().includes(step.title.toLowerCase().split(' ')[0])
      )
      if (isRelated) stepsToRevisit.push(i + 1)
    })
    if (stepsToRevisit.length === 0 && result.steps.length >= 2) {
      stepsToRevisit.push(result.steps.length - 1, result.steps.length)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[5%] -left-[5%] w-[45%] h-[45%] rounded-full blur-[100px]"
          style={{ background: 'rgba(206,233,214,0.25)' }} />
        <div className="absolute bottom-[10%] -right-[5%] w-[35%] h-[35%] rounded-full blur-[100px]"
          style={{ background: 'rgba(221,217,253,0.2)' }} />
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Celebration section ── */}
        <section className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-soft"
            style={{ background: 'var(--color-secondary-container)' }}>
            <span className="material-symbols-outlined text-5xl filled" style={{ color: 'var(--color-secondary)' }}>stars</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
            Sesi Belajar Selesai!
          </h1>
          <p className="text-lg max-w-lg" style={{ color: 'var(--color-text-muted)' }}>
            Kamu telah menyelesaikan pembelajaran hari ini dengan sangat tenang dan fokus. Mari lihat kemajuanmu.
          </p>
        </section>

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start mb-8">

          {/* Score card */}
          <div className="md:col-span-7 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center justify-center border-2 relative overflow-hidden group shadow-lifted"
            style={{ background: 'rgba(93,91,122,0.08)', borderColor: 'var(--color-secondary-container)' }}>
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-125"
              style={{ background: 'rgba(221,217,253,0.4)' }} />
            <span className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-on-secondary-container)' }}>HASIL PEMBELAJARAN</span>
            <div className="flex items-end gap-2 mb-2">
              <span className="font-bold leading-none text-6xl md:text-8xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-secondary)' }}>
                {session.score}
              </span>
              <span className="text-2xl mb-2 opacity-50" style={{ color: 'var(--color-secondary)' }}>/100</span>
              <span className="text-3xl md:text-4xl mb-1.5 anim-bounce-gentle">{session.score >= 80 ? '🌟' : session.score >= 60 ? '⭐' : '🌱'}</span>
            </div>
            <p className="font-semibold mb-6 text-base md:text-lg text-center" style={{ color: 'var(--color-on-secondary-container)', opacity: 0.8 }}>
              Skor kamu: {session.score}/100 {session.score >= 80 ? '🌟' : '⭐'}
            </p>
            <div className="w-full max-w-xs">
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.4)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${session.score}%`, background: 'var(--color-secondary)', boxShadow: '0 0 12px rgba(93,91,122,0.35)' }} />
              </div>
            </div>
            {/* Stats row */}
            <div className="flex items-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-secondary)' }}>{session.totalSteps}</div>
                <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-subtle)' }}>Langkah</div>
              </div>
              <div className="w-px h-10" style={{ background: 'var(--color-secondary-container)' }} />
              <div className="text-center">
                <div className="text-sm md:text-base font-bold"
                  style={{ color: isPass ? 'var(--color-primary)' : 'var(--color-amber)' }}>
                  {isPass ? 'Lulus ✓' : 'Perlu Review'}
                </div>
                <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-subtle)' }}>Status</div>
              </div>
            </div>
          </div>

          {/* Review section */}
          <div className="md:col-span-5 rounded-2xl md:rounded-[2.5rem] p-5 md:p-7 border-2 shadow-soft"
            style={{ background: 'var(--color-surface-container-low)', borderColor: 'var(--color-surface-container-highest)' }}>
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--color-primary)' }}>psychology</span>
              <h2 className="font-bold text-base md:text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>Review Materi</h2>
            </div>

            {session.missedQuestions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs md:text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Soal yang perlu diulang:</p>
                {session.missedQuestions.map((mq, i) => (
                  <div key={i} className="p-3 md:p-4 rounded-2xl md:rounded-3xl border flex items-start gap-3 md:gap-4 transition-transform duration-300 hover:translate-x-2"
                    style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'rgba(194,200,194,0.3)' }}>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(143,169,152,0.2)' }}>
                      <span className="material-symbols-outlined text-sm md:text-base filled" style={{ color: 'var(--color-primary)' }}>bookmark</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium mb-1 leading-snug" style={{ color: 'var(--color-text)' }}>{mq.question}</p>
                      <p className="text-[10px] md:text-xs font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Jawaban: {mq.correctAnswer}</p>
                      <p className="text-[10px] md:text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{mq.explanation}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-2.5 rounded-xl border mt-2"
                  style={{ background: 'rgba(66,98,117,0.08)', borderColor: 'rgba(134,167,187,0.25)' }}>
                  <span className="material-symbols-outlined text-sm md:text-base" style={{ color: 'var(--color-tertiary)' }}>info</span>
                  <p className="text-[10px] md:text-xs" style={{ color: 'var(--color-tertiary)' }}>
                    Mengulang langkah ini akan membantumu memahami materi selanjutnya lebih mudah.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: 'var(--color-primary-container)' }}>celebration</span>
                <p className="font-semibold text-sm md:text-base" style={{ color: 'var(--color-primary)' }}>Semua soal dijawab dengan benar!</p>
                <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--color-text-subtle)' }}>Luar biasa, kamu sudah sangat paham 🌿</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 md:gap-4 mb-8 md:mb-10 px-4">
          {!isPass && (
            <button onClick={() => router.push('/steps')}
              className="w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 rounded-full font-semibold border-2 flex items-center justify-center gap-2 squishy-btn shadow-soft hover:bg-opacity-80 transition-all text-sm md:text-base"
              style={{ background: 'white', borderColor: 'var(--color-secondary-container)', color: 'var(--color-secondary)' }}>
              <span className="material-symbols-outlined text-lg md:text-xl">refresh</span> Ulangi Sesi
            </button>
          )}
          <button onClick={() => router.push('/history')}
            className="w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 rounded-full font-semibold border-2 flex items-center justify-center gap-2 squishy-btn shadow-soft hover:opacity-90 transition-all text-sm md:text-base"
            style={{ background: 'white', borderColor: 'var(--color-primary-container)', color: 'var(--color-primary)' }}>
            <span className="material-symbols-outlined text-lg md:text-xl">history</span> Lihat Riwayat
          </button>
          <button onClick={() => router.push('/')}
            className="w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 rounded-full font-semibold text-white flex items-center justify-center gap-2 squishy-btn shadow-lifted hover:scale-105 transition-all text-sm md:text-base"
            style={{ background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(76,100,85,0.25)' }}>
            <span className="material-symbols-outlined text-lg md:text-xl filled">play_arrow</span> Materi Baru
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center border-t py-6" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-subtle)', fontFamily: 'var(--font-heading)' }}>
            © 2024 Smart Step Learning Assistant • Pendamping Belajar Tenang
          </p>
        </footer>
      </main>
    </div>
  )
}
