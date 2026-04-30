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
  const [timeLeftStr, setTimeLeftStr] = useState<string>('00:00')
  const [showSettings, setShowSettings] = useState(false)
  const [localStudy, setLocalStudy] = useState(studyDurationMinutes)
  const [localBreak, setLocalBreak] = useState(breakDurationMinutes)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create a gentle audio for notification
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3') // Gentle bell sound
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    const tick = () => {
      if (!isPomodoroRunning || !pomodoroEndTime) {
        if (pomodoroMode === 'idle') {
          setTimeLeftStr(`${studyDurationMinutes}:00`)
        }
        return
      }

      const now = Date.now()
      const diff = pomodoroEndTime - now

      if (diff <= 0) {
        // Time's up
        if (audioRef.current) {
          audioRef.current.play().catch(() => {})
        }

        if (pomodoroMode === 'study') {
          startPomodoro('break')
        } else if (pomodoroMode === 'break') {
          stopPomodoro()
        }
        return
      }

      const m = Math.floor(diff / 1000 / 60)
      const s = Math.floor((diff / 1000) % 60)
      setTimeLeftStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }

    tick() // initial tick
    interval = setInterval(tick, 1000)

    return () => clearInterval(interval)
  }, [isPomodoroRunning, pomodoroEndTime, pomodoroMode, startPomodoro, stopPomodoro, studyDurationMinutes])

  const handleSaveSettings = () => {
    updatePomodoroDurations(localStudy, localBreak)
    setShowSettings(false)
  }

  // Hide entirely if on home page
  if (pathname === '/') return null

  // If we are on break, show a full screen overlay blocking the content gently
  if (pomodoroMode === 'break' && isPomodoroRunning) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#E8F2F6] bg-opacity-95 backdrop-blur-sm anim-fade-up">
        <div className="text-6xl mb-4">🌿</div>
        <h2 className="text-3xl font-bold text-[#3B6B7C] mb-2">Waktunya istirahat sejenak</h2>
        <p className="text-[#536878] text-lg mb-8">Peregangan tubuh dan minum air putih yuk!</p>
        
        <div className="text-5xl font-mono font-bold text-[#1C2B3A] bg-white px-8 py-4 rounded-3xl shadow-sm mb-8">
          {timeLeftStr}
        </div>

        <button 
          onClick={stopPomodoro}
          className="px-6 py-3 rounded-xl font-medium text-[#536878] border-2 border-[#CCDAE4] hover:bg-white transition-colors"
        >
          Lewati Istirahat
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(36,59,85,0.1)] p-4 border border-[#E8F2F6] flex flex-col items-center">
        
        {showSettings ? (
          <div className="flex flex-col gap-3 mb-3 text-sm">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[#536878]">Belajar (m)</span>
              <input type="number" value={localStudy} onChange={e => setLocalStudy(Number(e.target.value))} className="w-16 p-1 border rounded text-center" />
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[#536878]">Istirahat (m)</span>
              <input type="number" value={localBreak} onChange={e => setLocalBreak(Number(e.target.value))} className="w-16 p-1 border rounded text-center" />
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-[#3B6B7C] text-white py-1.5 rounded-lg font-medium text-xs">Simpan</button>
          </div>
        ) : null}

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[0.65rem] font-bold text-[#8DA4B4] uppercase tracking-widest mb-1">
              {pomodoroMode === 'idle' ? 'Pomodoro' : 'Fokus Belajar'}
            </div>
            <div className="text-2xl font-mono font-bold text-[#1C2B3A] tracking-tight">
              {timeLeftStr}
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            {!isPomodoroRunning ? (
              <button 
                onClick={() => startPomodoro('study')}
                className="bg-[#3A8C6E] text-white w-8 h-8 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                title="Mulai Belajar"
              >
                ▶
              </button>
            ) : (
              <button 
                onClick={stopPomodoro}
                className="bg-[#C47E2A] text-white w-8 h-8 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                title="Hentikan Timer"
              >
                ⏹
              </button>
            )}
            
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="bg-[#F7FAFB] text-[#8DA4B4] border border-[#E8F2F6] w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#E8F2F6] transition-colors"
              title="Pengaturan Timer"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
