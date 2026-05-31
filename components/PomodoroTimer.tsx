'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useLearningStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { translations } from '@/lib/i18n'

export default function PomodoroTimer() {
  const {
    lang,
    pomodoroMode,
    pomodoroEndTime,
    isPomodoroRunning,
    studyDurationMinutes,
    breakDurationMinutes,
    startPomodoro,
    stopPomodoro,
    updatePomodoroDurations
  } = useLearningStore()

  const t = translations[lang]

  const pathname = usePathname()
  const [timeLeftStr, setTimeLeftStr] = useState<string>('25:00')
  const [showSettings, setShowSettings] = useState(false)
  const [localStudy, setLocalStudy] = useState(studyDurationMinutes)
  const [localBreak, setLocalBreak] = useState(breakDurationMinutes)
  const [isMinimized, setIsMinimized] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Drag bounds for floating widget
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateBounds = () => {
        setDragBounds({
          left: -window.innerWidth + (isMinimized ? 120 : 320),
          right: 20,
          top: -window.innerHeight + 140,
          bottom: 20
        })
      }
      updateBounds()
      window.addEventListener('resize', updateBounds)
      return () => window.removeEventListener('resize', updateBounds)
    }
  }, [isMinimized])

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
          {t.pomo_break_title}
        </h2>
        <p className="text-lg mb-8 text-center max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t.pomo_break_desc}
        </p>
        <div className="text-5xl font-bold tabular-nums mb-10 px-10 py-5 rounded-[2rem] shadow-soft border-2"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-primary-container)', background: 'white', borderColor: 'var(--color-primary-fixed)' }}>
          {timeLeftStr}
        </div>
        <button onClick={stopPomodoro}
          className="px-8 py-3.5 rounded-full font-semibold border-2 transition-colors squishy-btn"
          style={{ borderColor: 'var(--color-primary-container)', color: 'var(--color-primary)', background: 'white' }}>
          {t.pomo_skip_break}
        </button>
      </div>
    )
  }

  return (
    <motion.div
      drag
      dragElastic={0.12} // Smooth rubber-band elasticity on boundaries
      dragMomentum={true} // satisfying gliding momentum physics
      dragTransition={{ power: 0.12, timeConstant: 180 }} // Gentle friction so it glides and stops smoothly
      whileHover={{ scale: 1.04, zIndex: 50 }}
      whileTap={{ scale: 0.96, cursor: 'grabbing' }}
      dragConstraints={dragBounds}
      layout // Beautiful automatic layout transition animation
      transition={{ type: 'spring', stiffness: 280, damping: 28 }} // Organic spring physics
      className="fixed bottom-20 md:bottom-6 right-6 z-40 flex flex-col items-end select-none cursor-grab"
    >
      {isMinimized ? (
        /* Minimized Capsule State */
        <div 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 p-2 rounded-full border shadow-lifted transition-all duration-300"
          style={{
            background: isPomodoroRunning ? 'var(--color-primary-container)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderColor: isPomodoroRunning ? 'var(--color-primary)' : 'var(--color-outline-variant)',
          }}
          title={t.pomo_expand_title}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isPomodoroRunning ? 'animate-pulse' : ''}`}
            style={{ background: isPomodoroRunning ? 'var(--color-primary)' : 'var(--color-surface-container)' }}>
            <span className="material-symbols-outlined text-lg"
              style={{ color: isPomodoroRunning ? 'white' : 'var(--color-text-subtle)' }}>
              {isPomodoroRunning ? 'timer' : 'timer_off'}
            </span>
          </div>
          <div className="pr-3 text-sm font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}>
            {timeLeftStr}
          </div>
        </div>
      ) : (
        /* Full Widget State */
        <>
          {/* Settings panel */}
          {showSettings && (
            <div className="mb-3 p-5 rounded-[1.5rem] border shadow-lifted anim-fade-up cursor-default"
              style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}
              onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when setting durations
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>{t.pomo_settings_title}</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: t.pomo_study_label, value: localStudy, setter: setLocalStudy },
                  { label: t.pomo_break_label, value: localBreak, setter: setLocalBreak },
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
                {t.pomo_save}
              </button>
            </div>
          )}

          {/* Widget Body */}
          <div className="flex items-center gap-2 md:gap-3 p-3 md:p-3.5 rounded-2xl md:rounded-[1.5rem] border shadow-lifted"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              borderColor: 'var(--color-outline-variant)',
            }}>
            
            {/* Gripper indicator for drag handle feedback */}
            <div className="flex items-center text-slate-300">
              <span className="material-symbols-outlined text-lg">drag_indicator</span>
            </div>

            {/* Timer icon & display */}
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"
              style={{ background: isPomodoroRunning ? 'var(--color-primary-fixed)' : 'var(--color-surface-container)' }}>
              <span className="material-symbols-outlined text-xl md:text-2xl"
                style={{ color: isPomodoroRunning ? 'var(--color-primary)' : 'var(--color-text-subtle)' }}>
                {isPomodoroRunning ? 'timer' : 'timer_off'}
              </span>
            </div>
            <div>
              <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest leading-none mb-1"
                style={{ color: 'var(--color-outline)' }}>
                {pomodoroMode === 'idle'
                  ? t.pomo_mode_idle
                  : pomodoroMode === 'study'
                  ? t.pomo_mode_study
                  : t.pomo_mode_break}
              </div>
              <div className="text-xl md:text-2xl font-bold tabular-nums leading-none"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}>
                {timeLeftStr}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-1 ml-0.5"
              onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking buttons
            >
              {!isPomodoroRunning ? (
                <button onClick={() => startPomodoro('study')}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center squishy-btn shadow-soft transition-all cursor-pointer"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                  title={t.pomo_start_title}>
                  <span className="material-symbols-outlined text-base md:text-lg filled">play_arrow</span>
                </button>
              ) : (
                <button onClick={stopPomodoro}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center squishy-btn shadow-soft transition-all cursor-pointer"
                  style={{ background: 'var(--color-amber)', color: 'white' }}
                  title={t.pomo_stop_title}>
                  <span className="material-symbols-outlined text-base md:text-lg">stop</span>
                </button>
              )}
              
              <div className="flex gap-1">
                <button onClick={() => setShowSettings(!showSettings)}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  style={{ background: 'var(--color-surface-container)', color: 'var(--color-text-subtle)' }}
                  title={t.pomo_settings_btn_title}>
                  <span className="material-symbols-outlined text-base md:text-lg">settings</span>
                </button>
                <button onClick={() => setIsMinimized(true)}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  style={{ background: 'var(--color-surface-container)', color: 'var(--color-text-subtle)' }}
                  title={t.pomo_minimize_title}>
                  <span className="material-symbols-outlined text-base md:text-lg">close_fullscreen</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
