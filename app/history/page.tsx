'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSessions, deleteSession, clearAllSessions } from '@/lib/sessions'
import type { SessionRecord } from '@/lib/types'
import { useLearningStore } from '@/lib/store'
import { translations } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import LangToggle from '@/components/LangToggle'

function formatDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function HistoryPage() {
  const router = useRouter()
  const { lang } = useLearningStore()
  const t = translations[lang]
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [mounted, setMounted] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSessions(getSessions())
  }, [])

  const handleDelete = (id: string) => {
    deleteSession(id)
    setSessions(getSessions())
  }

  const handleClearAll = () => {
    clearAllSessions()
    setSessions([])
    setConfirmClear(false)
  }

  if (!mounted) return <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} />

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)
    : 0
  const passCount = sessions.filter(s => s.status === 'lulus').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[5%] -right-[5%] w-[35%] h-[35%] rounded-full blur-[100px]"
          style={{ background: 'rgba(206,233,214,0.3)' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(251,249,244,0.90)', backdropFilter: 'blur(12px)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined filled text-2xl" style={{ color: 'var(--color-primary-container)' }}>menu_book</span>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
              Smart Step
            </span>
          </div>
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{ color: 'var(--color-primary)', background: 'var(--color-primary-fixed)' }}>
            <span className="material-symbols-outlined text-base">add</span> {t.nav_new_material}
          </button>
          <LangToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {t.history_title}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {sessions.length === 0 ? t.history_empty_subtitle : t.history_count(sessions.length)}
          </p>
        </div>

        {/* Stats bento */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: t.history_stat_total, value: sessions.length, icon: 'menu_book', color: 'var(--color-primary-fixed)', iconColor: 'var(--color-primary)' },
              { label: t.history_stat_avg, value: `${avgScore}%`, icon: 'bar_chart', color: 'var(--color-secondary-container)', iconColor: 'var(--color-secondary)' },
              { label: t.history_stat_pass, value: passCount, icon: 'task_alt', color: 'var(--color-tertiary-fixed)', iconColor: 'var(--color-tertiary)' },
            ].map(({ label, value, icon, color, iconColor }) => (
              <div key={label} className="bento-card flex items-center gap-4 p-6 rounded-[2rem] border"
                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-border)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: color }}>
                  <span className="material-symbols-outlined" style={{ color: iconColor }}>{icon}</span>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{value}</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        {sessions.length > 0 && (
          <div className="flex justify-end mb-4">
            {confirmClear ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmClear(false)}
                  className="text-sm px-4 py-2 rounded-xl border transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'white' }}>
                  {t.history_btn_cancel}
                </button>
                <button onClick={handleClearAll}
                  className="text-sm px-4 py-2 rounded-xl font-semibold text-white transition-colors"
                  style={{ background: 'var(--color-error)' }}>
                  {t.history_btn_delete_all}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)}
                className="text-sm px-4 py-2 rounded-xl border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-subtle)', background: 'var(--color-surface-container-low)' }}>
                {t.history_btn_delete_all}
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="text-center py-12 md:py-20 px-4 rounded-2xl md:rounded-[2rem] border"
            style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-border)' }}>
            <span className="material-symbols-outlined text-5xl md:text-6xl block mb-3 md:mb-4" style={{ color: 'var(--color-primary-container)' }}>
              auto_stories
            </span>
            <h2 className="text-lg md:text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{t.history_empty_title}</h2>
            <p className="text-xs md:text-sm mb-6 md:mb-8 max-w-xs mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              {t.history_empty_desc}
            </p>
            <button onClick={() => router.push('/')}
              className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-3.5 rounded-full font-semibold text-white squishy-btn shadow-lifted text-sm md:text-base"
              style={{ background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(76,100,85,0.25)' }}>
              {t.history_btn_start}
            </button>
          </div>
        )}

        {/* Session list */}
        <div className="space-y-3 md:space-y-4">
          {sessions.map((s, i) => {
            const isPass = s.status === 'lulus'
            const scoreIcon = s.score >= 80 ? '🌟' : s.score >= 60 ? '⭐' : '🌱'
            return (
              <div key={s.id}
                className="bento-card rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex flex-row items-center gap-3 md:gap-5 border anim-fade-up"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  borderColor: 'var(--color-border)',
                  animationDelay: `${i * 0.05}s`
                }}>

                {/* Score circle */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex flex-col items-center justify-center shrink-0"
                   style={{ background: isPass ? 'var(--color-primary-fixed)' : 'var(--color-amber-bg)' }}>
                  <span className="text-lg md:text-xl">{scoreIcon}</span>
                  <span className="text-[10px] md:text-xs font-bold" style={{ color: isPass ? 'var(--color-primary)' : 'var(--color-amber)' }}>{s.score}%</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base truncate mb-1" style={{ color: 'var(--color-text)' }}>{s.topic}</p>
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                    <span className="text-[10px] md:text-xs" style={{ color: 'var(--color-text-subtle)' }}>{formatDate(s.date, lang)}</span>
                    <span className="text-[10px] md:text-xs" style={{ color: 'var(--color-text-subtle)' }}>·</span>
                    <span className="text-[10px] md:text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.history_steps_label(s.totalSteps)}</span>
                    <span className={`text-[9px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 rounded-full border`}
                      style={isPass
                        ? { background: 'var(--color-primary-fixed)', color: 'var(--color-primary)', borderColor: 'transparent' }
                        : { background: 'var(--color-amber-bg)', color: 'var(--color-amber)', borderColor: 'transparent' }}>
                      {isPass ? t.history_badge_pass : t.history_badge_review}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(s.id)}
                  className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'var(--color-surface-container)', color: 'var(--color-text-subtle)' }}
                  title={t.history_delete_title}>
                  <span className="material-symbols-outlined text-lg md:text-xl">delete</span>
                </button>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        {sessions.length > 0 && (
          <div className="mt-8 md:mt-10 flex justify-center px-4">
            <button onClick={() => router.push('/')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 md:gap-2.5 px-8 md:px-10 py-3.5 md:py-4 rounded-full font-bold text-white shadow-lifted squishy-btn transition-all hover:scale-105 text-sm md:text-base"
              style={{ background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(76,100,85,0.25)' }}>
              <span className="material-symbols-outlined text-lg md:text-xl filled">auto_awesome</span>
              {t.history_btn_new}
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center border-t mt-12 pt-6" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-subtle)', fontFamily: 'var(--font-heading)' }}>
            © 2024 Smart Step Learning Assistant • {t.footer_tagline}
          </p>
        </footer>
      </main>
    </div>
  )
}
