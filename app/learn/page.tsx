'use client'

import { useRouter } from 'next/navigation'
import { useLearningStore } from '@/lib/store'
import { useEffect, useState } from 'react'

export default function LearnPage() {
  const router = useRouter()
  const { result, currentStepIndex, setCurrentStep } = useLearningStore()
  
  // Hydration fix for Zustand with Next.js
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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
    <main className="min-h-screen flex flex-col" style={{ background: '#EFF3F7' }}>
      {/* Header / Progress Bar */}
      <header className="bg-white px-6 py-4 border-b border-[#CCDAE4] shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={() => router.push('/')}
            className="text-[#536878] hover:text-[#1C2B3A] transition-colors p-2 -ml-2 rounded-lg hover:bg-[#F7FAFB]"
            aria-label="Kembali"
          >
            ← Keluar
          </button>
          
          <div className="flex-1 max-w-md text-center">
            <div className="text-xs font-semibold text-[#536878] mb-2">
              LANGKAH {currentStepIndex + 1} DARI {result.steps.length}
            </div>
            <div className="h-2 w-full bg-[#E8F2F6] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#3B6B7C] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${((currentStepIndex + 1) / result.steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-10" /> {/* Spacer untuk balance */}
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 w-full max-w-2xl mx-auto p-6 flex flex-col justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-[0_4px_32px_rgba(36,59,85,0.08)] anim-fade-up" key={step.id}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8F2F6] text-[#3B6B7C] font-bold text-lg mb-6">
            {step.stepNumber}
          </div>
          
          <h2 className="text-2xl font-bold text-[#1C2B3A] mb-4 leading-tight">
            {step.title}
          </h2>
          
          <div className="text-[#1C2B3A] text-[1.05rem] leading-relaxed space-y-4">
            {step.content}
          </div>
          
          <div className="mt-8 pt-6 border-t border-[#E8F2F6] flex justify-end">
            <button className="flex items-center gap-2 text-sm font-medium text-[#3B6B7C] hover:text-[#2E5868] p-2 rounded-lg hover:bg-[#F7FAFB] transition-colors">
              🔊 Dengarkan (TTS)
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 gap-4">
          <button
            onClick={() => setCurrentStep(currentStepIndex - 1)}
            disabled={isFirstStep}
            className="px-6 py-3.5 rounded-xl font-medium transition-all"
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
            onClick={() => setCurrentStep(currentStepIndex + 1)}
            disabled={isLastStep}
            className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-sm"
            style={{ 
              background: isLastStep ? '#3A8C6E' : '#3B6B7C',
            }}
          >
            {isLastStep ? 'Selesai & Quiz ✨' : 'Selanjutnya →'}
          </button>
        </div>
      </section>
    </main>
  )
}
