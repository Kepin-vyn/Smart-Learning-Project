'use client'

import { useRouter } from 'next/navigation'
import { useLearningStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { translations } from '@/lib/i18n'
import LangToggle from '@/components/LangToggle'

export default function StepsPage() {
  const router = useRouter()
  const { result, currentStepIndex, setCurrentStep, lang } = useLearningStore()
  const t = translations[lang]
  
  const [mounted, setMounted] = useState(false)
  const [isTtsSupported, setIsTtsSupported] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => { 
    setMounted(true)
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      setIsTtsSupported(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [currentStepIndex])

  const handleTTS = (text: string) => {
    if (!window.speechSynthesis) return
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = result?.language === 'en' ? 'en-US' : 'id-ID'
    utterance.rate = 0.9
    utterance.pitch = 1.05
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }

  const navigateStep = (newIndex: number) => {
    if (isPlaying && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
    setCurrentStep(newIndex)
  }

  if (!mounted) return <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} />

  if (!result || !result.steps || result.steps.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center p-12 rounded-[2rem] max-w-md w-full shadow-card"
          style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-border)' }}>
          <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: 'var(--color-primary-container)' }}>inbox</span>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{t.steps_no_material_title}</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t.steps_no_material_desc}
          </p>
          <button onClick={() => router.push('/')}
            className="px-6 py-3 rounded-full font-semibold text-sm transition-all squishy-btn"
            style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-container)' }}>
            {t.steps_back_home}
          </button>
        </div>
      </main>
    )
  }

  const step = result.steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === result.steps.length - 1
  const progress = ((currentStepIndex + 1) / result.steps.length) * 100

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: 'var(--color-bg)' }}>

      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[35%] h-[35%] rounded-full blur-[100px]"
          style={{ background: 'rgba(206,233,214,0.3)' }} />
        <div className="absolute bottom-[5%] right-[5%] w-[25%] h-[25%] rounded-full blur-[100px]"
          style={{ background: 'rgba(165,199,226,0.2)' }} />
      </div>

      {/* Pomodoro widget — floating top right */}
      <div className="absolute right-6 top-24 z-10 hidden md:block">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 anim-pulse-gentle"
            style={{ background: 'rgba(143,169,152,0.15)', borderColor: 'var(--color-primary-container)' }}>
            <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>25:00</span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>FOKUS</span>
        </div>
      </div>

      <main className="w-full max-w-3xl px-6 pt-8 pb-24 flex flex-col items-center flex-1">

        {/* Exit + progress */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex justify-start mb-5">
            <button onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-container)' }}>
              <span className="material-symbols-outlined text-base">close</span>
              {t.steps_exit}
            </button>
          </div>

          <div className="flex justify-between items-end mb-3">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              {t.steps_progress_label(currentStepIndex + 1, result.steps.length)}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>{t.steps_progress_pct(Math.round(progress))}</span>
              <LangToggle />
            </div>
          </div>

          <div className="w-full h-3 rounded-full overflow-hidden"
            style={{ background: 'rgba(169,203,224,0.3)' }}>
            <div className="h-full rounded-full anim-pulse transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--color-tertiary-container)' }} />
          </div>
        </div>

        {/* Main glass card */}
        <div key={step.id}
          className="w-full max-w-2xl glass-card rounded-2xl md:rounded-[2rem] p-6 md:p-10 shadow-lifted mb-6 md:mb-8 flex flex-col items-center text-center anim-fade-up">

          {/* Step icon */}
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6"
            style={{ background: 'var(--color-primary-fixed)' }}>
            <span className="material-symbols-outlined text-3xl md:text-4xl filled" style={{ color: 'var(--color-primary)' }}>menu_book</span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-5 leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-primary-container)' }}>
            {step.title}
          </h1>

          <p className="text-base md:text-lg leading-relaxed mb-6 md:mb-8 max-w-xl" style={{ color: 'var(--color-text-muted)' }}>
            {step.content}
          </p>

          {/* TTS button */}
          {isTtsSupported ? (
            <button
              onClick={() => handleTTS(`${step.title}. ${step.content}`)}
              className="flex items-center gap-2 px-5 py-3 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm transition-all squishy-btn"
              style={isPlaying
                ? { background: 'var(--color-on-primary-container)', color: 'var(--color-on-secondary)', boxShadow: '0 8px 20px rgba(76,100,85,0.2)' }
                : { background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-container)' }}
              aria-label={isPlaying ? t.steps_tts_stop : t.steps_tts_play}
            >
              <span className="material-symbols-outlined text-lg md:text-xl">{isPlaying ? 'stop_circle' : 'volume_up'}</span>
              {isPlaying ? t.steps_tts_stop : t.steps_tts_play}
            </button>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: 'var(--color-text-subtle)', background: 'var(--color-surface-container)' }}>
              {t.steps_tts_unsupported}
            </span>
          )}
        </div>

        {/* Navigation */}
        <div className="w-full max-w-2xl flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigateStep(currentStepIndex - 1)}
            disabled={isFirstStep}
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-semibold transition-all squishy-btn border-2 text-sm md:text-base"
            style={{
              background: isFirstStep ? 'transparent' : 'var(--color-surface-container-high)',
              color: isFirstStep ? 'transparent' : 'var(--color-text-muted)',
              borderColor: isFirstStep ? 'transparent' : 'var(--color-outline-variant)',
              pointerEvents: isFirstStep ? 'none' : 'auto',
            }}>
            <span className="material-symbols-outlined text-lg md:text-xl">arrow_back</span> {t.steps_btn_back}
          </button>

          <button
            onClick={() => {
              if (isLastStep) {
                if (isPlaying && window.speechSynthesis) window.speechSynthesis.cancel()
                router.push('/quiz')
              } else {
                navigateStep(currentStepIndex + 1)
              }
            }}
            className="flex-[1.5] flex items-center justify-center gap-1.5 md:gap-2 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-semibold text-white transition-all squishy-btn shadow-lifted text-sm md:text-base"
            style={{
              background: isLastStep ? 'var(--color-primary)' : 'var(--color-primary)',
              boxShadow: '0 8px 24px rgba(76,100,85,0.25)',
            }}>
            {isLastStep ? t.steps_btn_quiz : t.steps_btn_next}
            <span className="material-symbols-outlined text-lg md:text-xl">arrow_forward</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs" style={{ color: 'var(--color-text-subtle)', fontFamily: 'var(--font-heading)' }}>
          © 2024 Smart Step Learning Assistant • {t.footer_tagline}
        </p>
      </footer>
    </div>
  )
}
