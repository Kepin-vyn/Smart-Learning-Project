'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useLearningStore } from '@/lib/store'

export default function PomodoroTimer() {
  const {
    pomodoroMode,
    pomodoroEndTime,
    isPomodoroRunning,
    studyDurationMinutes,
    breakDurationMinutes,
    startPomodoro,
    stopPomodoro,
    updatePomodoroDurations
  } = useLearningStore()

  const pathname = usePathname()
  const [timeLeftStr, setTimeLeftStr] = useState<string>('25:00')
  const [showSettings, setShowSettings] = useState(false)
  const [localStudy, setLocalStudy] = useState(studyDurationMinutes)
  const [localBreak, setLocalBreak] = useState(breakDurationMinutes)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    const tick = () => {
      if (!isPomodoroRunning || !pomodoroEndTime) {
        if (pomodoroMode === 'idle') setTimeLeftStr(`${studyDurationMinutes}:00`)
        return
      }
      const now = Date.now()
      const diff = pomodoroEndTime - now
      if (diff <= 0) {
        if (audioRef.current) audioRef.current.play().catch(() => {})
        if (pomodoroMode === 'study') startPomodoro('break')
        else if (pomodoroMode === 'break') stopPomodoro()
        return
      }
      const m = Math.floor(diff / 1000 / 60)
      const s = Math.floor((diff / 1000) % 60)
      setTimeLeftStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }
    tick()
    interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isPomodoroRunning, pomodoroEndTime, pomodoroMode, startPomodoro, stopPomodoro, studyDurationMinutes])

  const handleSaveSettings = () => {
    updatePomodoroDurations(localStudy, localBreak)
    setShowSettings(false)
  }

  // Hide on home page
  if (pathname === '/') return null

  // Break overlay
  if (pomodoroMode === 'break' && isPomodoroRunning) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center anim-fade-up"
        style={{ background: 'rgba(206,233,214,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-lifted"
          style={{ background: 'var(--color-primary-fixed)' }}>
          <span className="material-symbols-outlined text-6xl filled" style={{ color: 'var(--color-primary)' }}>
            local_cafe
          </span>
        </div>
        <h2 className="text-3xl font-bold mb-2 text-center"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
          Waktunya Istirahat Sejenak
        </h2>
        <p className="text-lg mb-8 text-center max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          Regangkan tubuhmu dan minum air putih — kamu sudah bekerja keras! 🌿
        </p>
        <div className="text-5xl font-bold tabular-nums mb-10 px-10 py-5 rounded-[2rem] shadow-soft border-2"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-primary-container)', background: 'white', borderColor: 'var(--color-primary-fixed)' }}>
          {timeLeftStr}
        </div>
        <button onClick={stopPomodoro}
          className="px-8 py-3.5 rounded-full font-semibold border-2 transition-colors squishy-btn"
          style={{ borderColor: 'var(--color-primary-container)', color: 'var(--color-primary)', background: 'white' }}>
          Lewati Istirahat
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Settings panel */}
      {showSettings && (
        <div className="mb-3 p-5 rounded-[1.5rem] border shadow-lifted anim-fade-up"
          style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>Atur Timer</p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Belajar (menit)', value: localStudy, setter: setLocalStudy },
              { label: 'Istirahat (menit)', value: localBreak, setter: setLocalBreak },
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <input type="number" value={value}
                  onChange={e => setter(Number(e.target.value))}
                  className="w-16 p-1.5 border rounded-xl text-center text-sm font-semibold"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'var(--color-surface-container-low)' }} />
              </div>
            ))}
          </div>
          <button onClick={handleSaveSettings}
            className="w-full mt-4 py-2 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'var(--color-primary)' }}>
            Simpan Pengaturan
          </button>
        </div>
      )}

      {/* Widget */}
      <div className="flex items-center gap-4 p-4 rounded-[1.5rem] border shadow-lifted"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--color-outline-variant)',
        }}>
        {/* Timer icon & display */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isPomodoroRunning ? 'var(--color-primary-fixed)' : 'var(--color-surface-container)' }}>
          <span className="material-symbols-outlined text-2xl"
            style={{ color: isPomodoroRunning ? 'var(--color-primary)' : 'var(--color-text-subtle)' }}>
            {isPomodoroRunning ? 'timer' : 'timer_off'}
          </span>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest leading-none mb-1"
            style={{ color: 'var(--color-outline)' }}>
            {pomodoroMode === 'idle' ? 'Focus Time' : pomodoroMode === 'study' ? 'Sedang Belajar' : 'Istirahat'}
          </div>
          <div className="text-2xl font-bold tabular-nums leading-none"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}>
            {timeLeftStr}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-1.5 ml-1">
          {!isPomodoroRunning ? (
            <button onClick={() => startPomodoro('study')}
              className="w-9 h-9 rounded-xl flex items-center justify-center squishy-btn shadow-soft transition-all"
              style={{ background: 'var(--color-primary)', color: 'white' }}
              title="Mulai Belajar">
              <span className="material-symbols-outlined text-lg filled">play_arrow</span>
            </button>
          ) : (
            <button onClick={stopPomodoro}
              className="w-9 h-9 rounded-xl flex items-center justify-center squishy-btn shadow-soft transition-all"
              style={{ background: 'var(--color-amber)', color: 'white' }}
              title="Hentikan Timer">
              <span className="material-symbols-outlined text-lg">stop</span>
            </button>
          )}
          <button onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--color-surface-container)', color: 'var(--color-text-subtle)' }}
            title="Pengaturan Timer">
            <span className="material-symbols-outlined text-lg">settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
