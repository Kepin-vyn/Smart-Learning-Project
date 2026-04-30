'use client'

import { useRouter } from 'next/navigation'
import { useLearningStore } from '@/lib/store'
import { useEffect, useState } from 'react'

export default function StepsPage() {
  const router = useRouter()
  const { result, currentStepIndex, setCurrentStep } = useLearningStore()
  
  // Hydration fix for Zustand with Next.js
  const [mounted, setMounted] = useState(false)
  const [isTtsSupported, setIsTtsSupported] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => { 
    setMounted(true)
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      setIsTtsSupported(false)
    }
  }, [])

  // Stop TTS when component unmounts or step changes
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
    
    // Set language based on AI detected language
    const lang = result?.language === 'en' ? 'en-US' : 'id-ID'
    utterance.lang = lang
    
    // Make voice slightly slower and higher pitch for easier listening (ADHD/Dyslexia friendly)
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

  if (!mounted) return <div className="min-h-screen bg-[#EFF3F7]" />

  if (!result || !result.steps || result.steps.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: '#EFF3F7' }}>
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm max-w-md w-full">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="text-xl font-bold text-[#1C2B3A]">Belum Ada Materi</h1>
          <p className="mt-2 text-sm text-[#536878]">
            Kamu belum memasukkan materi apapun. Silakan kembali ke beranda untuk memproses materi baru.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="inline-block mt-6 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: '#3B6B7C' }}
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </main>
    )
  }

  const step = result.steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === result.steps.length - 1

  return (
    <main className="h-screen overflow-hidden flex flex-col" style={{ background: '#EFF3F7' }}>
      {/* Header / Progress Bar */}
      <header className="bg-white px-6 py-4 border-b border-[#CCDAE4] shadow-sm shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={() => router.push('/')}
            className="text-[#536878] hover:text-[#1C2B3A] transition-colors p-2 -ml-2 rounded-lg hover:bg-[#F7FAFB]"
            aria-label="Keluar dari sesi belajar"
          >
            ✕ Keluar
          </button>
          
          <div className="flex-1 max-w-md text-center">
            <div className="text-xs font-semibold text-[#536878] mb-2 tracking-wide">
              LANGKAH {currentStepIndex + 1} DARI {result.steps.length}
            </div>
            <div className="h-2 w-full bg-[#E8F2F6] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#3B6B7C] transition-all duration-500 ease-out rounded-full"
                style={{ width: `${((currentStepIndex + 1) / result.steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-16" /> {/* Spacer untuk balance */}
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col justify-center relative">
        <div 
          key={step.id} 
          className="bg-white rounded-2xl p-8 md:p-10 shadow-[0_4px_32px_rgba(36,59,85,0.08)] anim-fade-up max-h-full overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8F2F6] text-[#3B6B7C] font-bold text-lg">
              {step.stepNumber}
            </div>
            
            {/* Tombol TTS */}
            {isTtsSupported ? (
              <button 
                onClick={() => handleTTS(`${step.title}. ${step.content}`)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                  isPlaying 
                    ? 'text-white bg-[#C47E2A] border-[#C47E2A] shadow-inner' 
                    : 'text-[#3B6B7C] bg-[#F7FAFB] border-[#CCDAE4] hover:bg-[#E8F2F6]'
                }`}
                aria-label={isPlaying ? "Hentikan suara" : "Dengarkan teks"}
              >
                <span className="text-lg">{isPlaying ? '⏹️' : '🔊'}</span>
                {isPlaying ? 'Berhenti' : 'Dengarkan'}
              </button>
            ) : (
              <span className="text-xs text-[#8DA4B4] italic bg-[#F7FAFB] px-3 py-1.5 rounded-md border border-[#E8F2F6]">
                TTS tidak didukung browser ini
              </span>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-[#1C2B3A] mb-4 leading-tight">
            {step.title}
          </h2>
          
          <div className="text-[#1C2B3A] text-lg leading-relaxed space-y-4">
            {step.content}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 shrink-0 gap-4">
          <button
            onClick={() => navigateStep(currentStepIndex - 1)}
            disabled={isFirstStep}
            className="px-6 py-3.5 rounded-xl font-medium transition-all min-w-[140px]"
            style={{ 
              background: isFirstStep ? 'transparent' : 'white',
              color: isFirstStep ? 'transparent' : '#536878',
              border: isFirstStep ? 'none' : '1px solid #CCDAE4',
              pointerEvents: isFirstStep ? 'none' : 'auto'
            }}
          >
            ← Sebelumnya
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
            className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-sm min-w-[140px]"
            style={{ 
              background: isLastStep ? '#C47E2A' : '#3B6B7C',
            }}
          >
            {isLastStep ? 'Mulai Quiz ✨' : 'Selanjutnya →'}
          </button>
        </div>
      </section>
    </main>
  )
}
