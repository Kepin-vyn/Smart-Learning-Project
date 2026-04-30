'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSessions, deleteSession, clearAllSessions } from '@/lib/sessions'
import type { SessionRecord } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  })
}

export default function HistoryPage() {
  const router = useRouter()
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

  if (!mounted) return <div className="min-h-screen bg-[#EFF3F7]" />

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: '#EFF3F7' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-[#536878] hover:text-[#1C2B3A] transition-colors mb-1">
              ← Kembali
            </button>
            <h1 className="text-2xl font-bold text-[#1C2B3A]">Riwayat Belajar</h1>
            <p className="text-sm text-[#536878]">{sessions.length} sesi tersimpan</p>
          </div>

          {sessions.length > 0 && (
            confirmClear ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmClear(false)} className="text-sm px-4 py-2 rounded-lg border border-[#CCDAE4] text-[#536878] bg-white hover:bg-[#F7FAFB]">Batal</button>
                <button onClick={handleClearAll} className="text-sm px-4 py-2 rounded-lg text-white bg-[#C47E2A] hover:opacity-90">Hapus Semua</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="text-sm px-4 py-2 rounded-lg border border-[#CCDAE4] text-[#8DA4B4] bg-white hover:border-[#C47E2A] hover:text-[#C47E2A] transition-colors">
                Hapus Semua
              </button>
            )
          )}
        </div>

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-lg font-bold text-[#1C2B3A] mb-2">Belum Ada Riwayat</h2>
            <p className="text-sm text-[#536878] mb-6">Selesaikan sesi belajar pertamamu untuk mulai membangun riwayatmu!</p>
            <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90" style={{ background: '#3B6B7C' }}>
              Mulai Belajar ✨
            </button>
          </div>
        )}

        {/* Session List */}
        <div className="space-y-3">
          {sessions.map((s) => {
            const isPass = s.status === 'lulus'
            const emoji = s.score >= 80 ? '🏆' : s.score < 60 ? '🌱' : '⭐'
            
            return (
              <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 anim-fade-up">
                <div className="text-3xl shrink-0">{emoji}</div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1C2B3A] truncate">{s.topic}</p>
                  <p className="text-xs text-[#8DA4B4] mt-0.5">{formatDate(s.date)}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-bold text-[#3B6B7C]">{s.score}%</span>
                    <span className="text-xs text-[#8DA4B4]">·</span>
                    <span className="text-xs text-[#536878]">{s.totalSteps} langkah</span>
                    <span className="text-xs text-[#8DA4B4]">·</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isPass 
                        ? 'bg-[#E6F4EA] text-[#3A8C6E]' 
                        : 'bg-[#FFF9E6] text-[#C47E2A]'
                    }`}>
                      {isPass ? 'Lulus' : 'Perlu Review'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => handleDelete(s.id)}
                  className="shrink-0 text-[#CCDAE4] hover:text-[#C47E2A] transition-colors p-2 rounded-lg hover:bg-[#FFF9E6]"
                  title="Hapus sesi ini"
                >
                  🗑️
                </button>
              </div>
            )
          })}
        </div>

        {sessions.length > 0 && (
          <div className="mt-6 text-center">
            <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90" style={{ background: '#3B6B7C' }}>
              Input Materi Baru ✨
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
