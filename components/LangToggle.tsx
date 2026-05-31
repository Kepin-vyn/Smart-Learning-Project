'use client'

import { useLearningStore } from '@/lib/store'
import type { Lang } from '@/lib/i18n'

export default function LangToggle() {
  const { lang, setLang } = useLearningStore()

  const toggle = () => setLang(lang === 'id' ? 'en' : 'id')

  return (
    <button
      id="lang-toggle"
      onClick={toggle}
      aria-label={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 hover:scale-105 select-none"
      style={{
        background: 'var(--color-surface-container-low)',
        borderColor: 'var(--color-outline-variant)',
        color: 'var(--color-text-muted)',
      }}
    >
      <span className="text-sm">{lang === 'id' ? '🇮🇩' : '🇺🇸'}</span>
      <span className="tracking-wider">{lang === 'id' ? 'ID' : 'EN'}</span>
    </button>
  )
}
