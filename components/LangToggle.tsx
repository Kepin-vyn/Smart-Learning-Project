'use client'

import { useLearningStore } from '@/lib/store'

export default function LangToggle() {
  const { lang, setLang } = useLearningStore()

  return (
    <div
      role="group"
      aria-label="Pilih Bahasa / Select Language"
      className="flex items-center gap-0.5 p-1 rounded-full border transition-all duration-200 select-none"
      style={{
        background: 'var(--color-surface-container-low)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      {/* Globe/Translate Icon */}
      <span 
        className="material-symbols-outlined text-base px-1.5 shrink-0 select-none opacity-80"
        style={{ color: 'var(--color-text-muted)' }}
      >
        translate
      </span>

      {/* Bahasa Indonesia Option */}
      <button
        onClick={() => setLang('id')}
        aria-label="Ganti ke Bahasa Indonesia"
        title="Bahasa Indonesia"
        className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider transition-all duration-200 hover:scale-105"
        style={{
          background: lang === 'id' ? 'var(--color-primary)' : 'transparent',
          color: lang === 'id' ? '#ffffff' : 'var(--color-text-subtle)',
          boxShadow: lang === 'id' ? '0 2px 6px rgba(76, 100, 85, 0.15)' : 'none',
        }}
      >
        ID
      </button>

      {/* English Option */}
      <button
        onClick={() => setLang('en')}
        aria-label="Switch to English"
        title="English"
        className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider transition-all duration-200 hover:scale-105"
        style={{
          background: lang === 'en' ? 'var(--color-primary)' : 'transparent',
          color: lang === 'en' ? '#ffffff' : 'var(--color-text-subtle)',
          boxShadow: lang === 'en' ? '0 2px 6px rgba(76, 100, 85, 0.15)' : 'none',
        }}
      >
        EN
      </button>
    </div>
  )
}
