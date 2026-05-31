'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLearningStore } from '@/lib/store'
import { translations } from '@/lib/i18n'
import LangToggle from '@/components/LangToggle'

type Tab = 'text' | 'pdf' | 'image'
type NoticeType = 'info' | 'success' | 'warning'
interface Notice { type: NoticeType; msg: string }

/* ── small helpers ───────────────────────────────── */
function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className="anim-spin"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function TabButton({
  id, active, onClick, icon, label,
}: { id: string; active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-offset-2"
      style={
        active
          ? { background: 'var(--color-primary)', color: '#fff', boxShadow: '0 2px 8px rgba(76,100,85,)' }
          : { color: 'var(--color-text-muted)', background: 'transparent' }
      }
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  )
}

function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const styles: Record<NoticeType, { bg: string; border: string; color: string; icon: string }> = {
    success: { bg: 'var(--color-green-bg)', border: 'var(--color-green-border)', color: 'var(--color-green)', icon: '✓' },
    warning: { bg: 'var(--color-amber-bg)', border: 'var(--color-amber-border)', color: 'var(--color-amber)', icon: '!' },
    info:    { bg: 'var(--color-primary-light)', border: 'var(--color-primary-muted)', color: 'var(--color-primary)', icon: 'i' },
  }
  const s = styles[notice.type]
  return (
    <div
      role="status"
      className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm anim-fade-up mb-4"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      <span className="font-bold shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs"
        style={{ background: s.color, color: '#fff' }}>
        {s.icon}
      </span>
      <p className="flex-1 leading-relaxed">{notice.msg}</p>
      <button onClick={onClose} aria-label="Tutup pesan" className="opacity-60 hover:opacity-100 transition-opacity shrink-0">✕</button>
    </div>
  )
}

/* ── Drop zone shared styles ────────────────────── */
function DropZone({
  dragging, onClick, onDrop, onDragOver, onDragEnter, onDragLeave, children,
}: {
  dragging: boolean
  onClick: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: () => void
  onDragLeave: () => void
  children: React.ReactNode
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Zone unggah file"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className="rounded-xl p-6 md:p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 min-h-36 md:min-h-44 select-none text-center"
      style={{
        border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: dragging ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
        transform: dragging ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter()
  const { setResult, lang } = useLearningStore()
  const t = translations[lang]

  /* state */
  const [activeTab, setActiveTab] = useState<Tab>('text')
  const [textInput, setTextInput] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [previewText, setPreviewText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [pdfDrag, setPdfDrag] = useState(false)
  const [imgDrag, setImgDrag] = useState(false)

  const pdfRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)

  const showNotice = useCallback((type: NoticeType, msg: string) => {
    setNotice({ type, msg })
    const t = setTimeout(() => setNotice(null), 7000)
    return () => clearTimeout(t)
  }, [])

  /* ── PDF extraction ──────────────────── */
  const doExtractPdf = useCallback(async (file: File) => {
    setIsExtracting(true); setPreviewText('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok && data.text) {
        setPreviewText(data.text)
        showNotice('success', t.notice_pdf_ok)
      } else {
        showNotice('warning', data.message ?? t.notice_pdf_fail)
      }
    } catch {
      showNotice('warning', t.notice_pdf_error)
    } finally { setIsExtracting(false) }
  }, [showNotice, t])

  /* ── Image extraction ────────────────── */
  const doExtractImage = useCallback(async (file: File) => {
    setIsExtracting(true); setPreviewText('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/extract-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok && data.text) {
        setPreviewText(data.text)
        showNotice('success', t.notice_img_ok)
      } else {
        showNotice('warning', data.message ?? t.notice_img_fail)
      }
    } catch {
      showNotice('warning', t.notice_img_error)
    } finally { setIsExtracting(false) }
  }, [showNotice, t])

  useEffect(() => { if (pdfFile)   doExtractPdf(pdfFile) },   [pdfFile,   doExtractPdf])
  useEffect(() => { if (imageFile) doExtractImage(imageFile) }, [imageFile, doExtractImage])

  /* ── Tab switch → reset state ────────── */
  const switchTab = (t: Tab) => {
    setActiveTab(t)
    setPreviewText('')
    setNotice(null)
  }

  /* ── Drag-and-drop handlers ─────────── */
  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setPdfDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      showNotice('warning', t.notice_pdf_invalid); return
    }
    setPdfFile(file)
  }

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setImgDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file) selectImage(file)
  }

  /* ── Image select helper ─────────────── */
  const selectImage = (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showNotice('warning', t.notice_img_format); return
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotice('warning', t.notice_img_size); return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  /* ── Process ─────────────────────────── */
  const handleProcess = async () => {
    const content = (activeTab === 'text' ? textInput : previewText).trim()
    if (content.length < 20 || isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      })
      const data = await res.json()
      if (data.ok && data.steps) {
        setResult(data)
        router.push('/steps')
      } else {
        showNotice('warning', data.message ?? t.notice_process_fail)
      }
    } catch {
      showNotice('warning', t.notice_connection)
    } finally { setIsProcessing(false) }
  }

  const contentForProcessing = (activeTab === 'text' ? textInput : previewText).trim()
  const canProcess = contentForProcessing.length >= 20 && !isExtracting && !isProcessing

  /* ══ RENDER ══════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>

      {/* ── Decorative BG blobs ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full blur-[100px]"
          style={{ background: 'rgba(206,233,214,0.35)' }} />
        <div className="absolute bottom-[5%] -right-[5%] w-[30%] h-[30%] rounded-full blur-[100px]"
          style={{ background: 'rgba(221,217,253,0.25)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(251,249,244,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined filled text-xl md:text-2xl" style={{ color: 'var(--color-primary-container)' }}>menu_book</span>
            <span className="text-base md:text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
              Smart Step <span className="hidden sm:inline">Learning Assistant</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 h-full">
            <nav className="flex items-center gap-6 h-full">
              <a href="#" className="text-sm font-semibold border-b-2 pb-0.5"
                style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-container)' }}>{t.nav_home}</a>
              <a href="/history" className="text-sm transition-colors hover:text-primary"
                style={{ color: 'var(--color-text-subtle)' }}>{t.nav_history}</a>
            </nav>
            <LangToggle />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 px-6 py-12 md:py-16">
        <section className="max-w-4xl mx-auto">

          {/* Hero text */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
              {t.hero_title}
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              {t.hero_subtitle}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-[1.5rem] md:rounded-[2rem] p-2 md:p-3 mb-8 md:mb-10 border shadow-card"
            style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-border)' }}>

            {/* Tab bar */}
            <div className="flex flex-row gap-1 p-1 rounded-xl md:rounded-2xl mb-3"
              style={{ background: 'var(--color-surface-container-low)' }}>
              {([
                { id: 'text' as Tab, icon: 'edit_note', label: t.tab_text, short: t.tab_text_short },
                { id: 'pdf' as Tab,  icon: 'picture_as_pdf', label: t.tab_pdf, short: t.tab_pdf_short },
                { id: 'image' as Tab,icon: 'image', label: t.tab_image, short: t.tab_image_short },
              ] as const).map(({ id, icon, label, short }) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  onClick={() => switchTab(id)}
                  role="tab"
                  aria-selected={activeTab === id}
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3.5 px-2 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap"
                  style={activeTab === id
                    ? { background: 'var(--color-surface-container-lowest)', color: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(76,100,85,0.08)' }
                    : { color: 'var(--color-text-subtle)', background: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-lg md:text-xl">{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{short}</span>
                </button>
              ))}
            </div>

            {/* Notice */}
            <div className="px-4">
              {notice && <NoticeBar notice={notice} onClose={() => setNotice(null)} />}
            </div>

            {/* Text tab */}
            {activeTab === 'text' && (
              <div className="px-1 md:px-2 pb-2 anim-fade-up">
                <textarea
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t.text_placeholder}
                  rows={10}
                  className="w-full rounded-xl md:rounded-[1.5rem] px-4 md:px-6 py-4 md:py-5 text-sm md:text-base leading-relaxed resize-none transition-all"
                  style={{
                    background: 'var(--color-surface-container-low)',
                    border: '2px solid transparent',
                    color: 'var(--color-text)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary-fixed)')}
                  onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                />
                <div className="flex justify-between items-center px-2 mt-2">
                  <span className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-subtle)' }}>
                    <span className="material-symbols-outlined text-sm">info</span>
                    {t.text_hint}
                  </span>
                  <span className="text-sm tabular-nums" style={{ color: 'var(--color-text-subtle)' }}>
                    {t.text_char_count(textInput.length)}
                  </span>
                </div>
              </div>
            )}

            {/* PDF tab */}
            {activeTab === 'pdf' && (
              <div className="px-2 pb-2 anim-fade-up">
                <input ref={pdfRef} type="file" accept=".pdf" className="hidden" id="pdf-file-input"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setPdfFile(f) }} />
                {!pdfFile ? (
                  <DropZone dragging={pdfDrag} onClick={() => pdfRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDragEnter={() => setPdfDrag(true)} onDragLeave={() => setPdfDrag(false)} onDrop={handlePdfDrop}>
                    <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--color-primary-container)' }}>picture_as_pdf</span>
                    <div className="text-center">
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{t.pdf_drop_title}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{t.pdf_drop_sub}</p>
                    </div>
                  </DropZone>
                ) : (
                  <div className="rounded-2xl p-4 flex items-center gap-4"
                    style={{ background: 'var(--color-surface-container-low)', border: '1.5px solid var(--color-border)' }}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--color-primary)' }}>description</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>{pdfFile.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {(pdfFile.size / 1024).toFixed(0)} KB
                        {isExtracting && <span className="ml-2 anim-pulse">· {t.pdf_reading}</span>}
                      </p>
                    </div>
                    {isExtracting ? <Spinner size={18} /> : (
                      <button onClick={() => { setPdfFile(null); setPreviewText('') }}
                        className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-container)' }}>{t.btn_change}</button>
                    )}
                  </div>
                )}
                {/* Preview panel */}
                {(pdfFile || previewText) && (
                  <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)' }}>
                    <div className="px-4 py-2.5 flex items-center justify-between"
                      style={{ background: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-border)' }}>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{t.pdf_preview_label}</span>
                      {previewText && <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{t.pdf_editable(previewText.length)}</span>}
                    </div>
                    {isExtracting && !previewText ? (
                      <div className="flex items-center gap-3 p-5" style={{ color: 'var(--color-text-muted)' }}>
                        <Spinner size={16} /><span className="text-sm">{t.pdf_reading}…</span>
                      </div>
                    ) : (
                      <textarea id="preview-text" value={previewText} onChange={(e) => setPreviewText(e.target.value)}
                        rows={7} placeholder={t.pdf_placeholder}
                        className="w-full px-4 py-3 text-sm leading-relaxed resize-none"
                        style={{ color: 'var(--color-text)', background: 'var(--color-surface-container-lowest)', outline: 'none', border: 'none' }} />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Image tab */}
            {activeTab === 'image' && (
              <div className="px-2 pb-2 anim-fade-up">
                <input ref={imgRef} type="file" accept="image/jpeg,image/png" className="hidden" id="image-file-input"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) selectImage(f) }} />
                {!imageFile ? (
                  <DropZone dragging={imgDrag} onClick={() => imgRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDragEnter={() => setImgDrag(true)} onDragLeave={() => setImgDrag(false)} onDrop={handleImageDrop}>
                    <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--color-primary-container)' }}>image</span>
                    <div className="text-center">
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{t.img_drop_title}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{t.img_drop_sub}</p>
                    </div>
                  </DropZone>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)' }}>
                    {imagePreview && (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Preview gambar yang diunggah" className="w-full object-contain max-h-52" />
                        {isExtracting && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                            style={{ background: 'rgba(76,100,85,0.6)', color: '#fff' }}>
                            <Spinner size={28} /><span className="text-sm font-medium">{t.img_reading}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-3 flex items-center gap-3" style={{ background: 'var(--color-surface-container)' }}>
                      <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-text-muted)' }}>{imageFile.name}</span>
                      {!isExtracting && (
                        <button onClick={() => { setImageFile(null); setImagePreview(''); setPreviewText('') }}
                          className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-container-high)' }}>{t.btn_change}</button>
                      )}
                    </div>
                    {previewText && (
                      <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="px-4 py-2" style={{ background: 'var(--color-surface-container)' }}>
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{t.img_preview_label}</span>
                        </div>
                        <textarea value={previewText} onChange={(e) => setPreviewText(e.target.value)}
                          rows={6} className="w-full px-4 py-3 text-sm leading-relaxed resize-none"
                          style={{ color: 'var(--color-text)', background: 'var(--color-surface-container-lowest)', outline: 'none', border: 'none' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Process button */}
          <div className="flex justify-center mb-8 md:mb-10 px-4">
            <button
              id="btn-process"
              onClick={handleProcess}
              disabled={!canProcess}
              aria-busy={isProcessing}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 md:gap-4 px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-base md:text-lg squishy-btn transition-all duration-300"
              style={canProcess
                ? {
                    background: 'var(--color-primary-fixed)',
                    color: 'var(--color-on-primary-container)',
                    boxShadow: '0 20px 40px -10px rgba(143,169,152,0.4)',
                    cursor: 'pointer',
                  }
                : {
                    background: 'var(--color-surface-container-high)',
                    color: 'var(--color-text-subtle)',
                    cursor: 'not-allowed',
                  }}
            >
              {isProcessing ? (
                <><Spinner size={20} /><span>{t.btn_processing}</span></>
              ) : (
                <>
                  <span className="material-symbols-outlined filled transition-transform group-hover:rotate-12">auto_awesome</span>
                  <span>{t.btn_process}</span>
                </>
              )}
            </button>
          </div>

          {/* Bento feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: 'psychology', color: 'var(--color-tertiary-container)', textColor: 'var(--color-tertiary)', title: t.bento_ai_title, desc: t.bento_ai_desc },
              { icon: 'rebase_edit', color: 'var(--color-secondary-container)', textColor: 'var(--color-secondary)', title: t.bento_adapt_title, desc: t.bento_adapt_desc },
              { icon: 'task_alt', color: 'var(--color-primary-fixed)', textColor: 'var(--color-primary)', title: t.bento_eval_title, desc: t.bento_eval_desc },
            ].map(({ icon, color, textColor, title, desc }) => (
              <div key={title} className="bento-card p-7 rounded-[2rem] border"
                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-border)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: color, color: textColor }}>
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>

        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 border-t text-center"
        style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex justify-center gap-8 mb-3">
          {([t.footer_help, t.footer_privacy, t.footer_guide]).map((l) => (
            <a key={l} href="#" className="text-xs transition-colors hover:text-primary"
              style={{ color: 'var(--color-text-subtle)', fontFamily: 'var(--font-heading)' }}>{l}</a>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          © 2024 Smart Step Learning Assistant • {t.footer_tagline}
        </p>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-16 px-4 z-50"
        style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-border)' }}>
        <button className="flex flex-col items-center gap-0.5" style={{ color: 'var(--color-primary)' }}>
          <span className="material-symbols-outlined filled">home</span>
          <span className="text-[10px] font-bold">{t.nav_home}</span>
        </button>
        <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-0.5" style={{ color: 'var(--color-text-subtle)' }}>
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-medium">{t.nav_history_short}</span>
        </button>
      </nav>

    </div>
  )
}
