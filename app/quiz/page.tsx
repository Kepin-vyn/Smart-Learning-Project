'use client'

import { useRouter } from 'next/navigation'

export default function QuizPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#EFF3F7' }}>
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b border-[#CCDAE4] shadow-sm shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => router.push('/steps')}
            className="text-[#536878] hover:text-[#1C2B3A] transition-colors p-2 -ml-2 rounded-lg hover:bg-[#F7FAFB]"
            aria-label="Kembali ke materi"
          >
            ← Kembali ke Materi
          </button>
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col items-center justify-center relative text-center">
        <div className="bg-white rounded-2xl p-10 w-full shadow-[0_4px_32px_rgba(36,59,85,0.08)] anim-fade-up">
          <div className="text-6xl mb-6">📝</div>
          <h1 className="text-2xl font-bold text-[#1C2B3A] mb-3">
            Halaman Quiz
          </h1>
          <p className="text-[#536878] text-base mb-8">
            Fitur Quiz interaktif sedang dalam tahap pengembangan.
          </p>
          
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-sm"
            style={{ background: '#3B6B7C' }}
          >
            Kembali ke Beranda
          </button>
        </div>
      </section>
    </main>
  )
}
