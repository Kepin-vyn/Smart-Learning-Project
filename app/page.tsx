'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLearningStore } from '@/lib/store'

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
          ? { background: 'var(--color-primary)', color: '#fff', boxShadow: '0 2px 8px rgba(59,107,124,0.3)' }
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
      className="rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 min-h-44 select-none"
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
  const setResult = useLearningStore((state) => state.setResult)

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
        showNotice('success', 'Teks berhasil dibaca dari PDF. Kamu bisa sunting jika perlu.')
      } else {
        showNotice('warning', data.message ?? 'Teks tidak dapat diekstrak. Coba gunakan tab Teks untuk mengetik langsung.')
      }
    } catch {
      showNotice('warning', 'Terjadi kendala saat membaca PDF. Pastikan koneksi internet kamu aktif.')
    } finally { setIsExtracting(false) }
  }, [showNotice])

  /* ── Image extraction ────────────────── */
  const doExtractImage = useCallback(async (file: File) => {
    setIsExtracting(true); setPreviewText('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/extract-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok && data.text) {
        setPreviewText(data.text)
        showNotice('success', 'Teks berhasil dibaca dari gambar. Silakan periksa hasilnya.')
      } else {
        showNotice('warning', data.message ?? 'Teks dalam gambar sulit terbaca. Coba gambar yang lebih jelas.')
      }
    } catch {
      showNotice('warning', 'Terjadi kendala saat membaca gambar. Pastikan API key sudah diatur.')
    } finally { setIsExtracting(false) }
  }, [showNotice])

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
      showNotice('warning', 'Mohon unggah file PDF yang valid.'); return
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
      showNotice('warning', 'Format yang diterima: JPG dan PNG.'); return
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotice('warning', 'Ukuran file terlalu besar. Gunakan gambar di bawah 5 MB.'); return
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
        showNotice('warning', data.message ?? 'Materi belum bisa diproses. Coba lagi dalam beberapa saat.')
      }
    } catch {
      showNotice('warning', 'Koneksi terputus. Pastikan internet kamu aktif, lalu coba lagi.')
    } finally { setIsProcessing(false) }
  }

  const contentForProcessing = (activeTab === 'text' ? textInput : previewText).trim()
  const canProcess = contentForProcessing.length >= 20 && !isExtracting && !isProcessing

  /* ══ RENDER ══════════════════════════════════════ */
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #EFF3F7 0%, #E4EEF5 100%)' }}>

      {/* ── Header ─────────────────────────────── */}
      <header style={{ background: 'linear-gradient(135deg, #243B55 0%, #2C5F72 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-7">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
              🎯
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
                Smart Step Learning Assistant
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#A8C9D8' }}>
                Ubah materi panjang menjadi langkah belajar yang mudah dipahami
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main card ──────────────────────────── */}
      <section className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-surface)', boxShadow: '0 4px 32px rgba(36,59,85,0.10)' }}>

          {/* Card header */}
          <div className="px-6 pt-6 pb-0">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Masukkan Materi Belajar
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Pilih cara memasukkan materi — ketik, unggah PDF, atau unggah foto
            </p>

            {/* ── Tab bar ─── */}
            <div role="tablist" aria-label="Pilihan input materi"
              className="flex gap-1 mt-5 p-1 rounded-xl w-fit"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <TabButton id="tab-text"  active={activeTab === 'text'}  onClick={() => switchTab('text')}  icon="✍️" label="Tulis Teks" />
              <TabButton id="tab-pdf"   active={activeTab === 'pdf'}   onClick={() => switchTab('pdf')}   icon="📄" label="Upload PDF" />
              <TabButton id="tab-image" active={activeTab === 'image'} onClick={() => switchTab('image')} icon="🖼️" label="Upload Gambar" />
            </div>
          </div>

          {/* ── Tab content ─── */}
          <div className="px-6 pt-5 pb-2">
            {notice && <NoticeBar notice={notice} onClose={() => setNotice(null)} />}

            {/* TEXT TAB */}
            {activeTab === 'text' && (
              <div className="anim-fade-up">
                <label htmlFor="text-input" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Tulis atau tempel materi di sini
                </label>
                <textarea
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Contoh: Fotosintesis adalah proses yang digunakan oleh tumbuhan untuk mengubah cahaya matahari menjadi energi..."
                  rows={9}
                  className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none transition-all duration-200"
                  style={{
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text)',
                    background: 'var(--color-surface-2)',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                  onBlur={(e)  => { e.target.style.borderColor = 'var(--color-border)' }}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                    {textInput.length < 20 && textInput.length > 0 ? '⚠ Materi terlalu singkat' : ''}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-subtle)' }}>
                    {textInput.length.toLocaleString('id')} karakter
                  </span>
                </div>
              </div>
            )}

            {/* PDF TAB */}
            {activeTab === 'pdf' && (
              <div className="anim-fade-up">
                <input
                  ref={pdfRef} type="file" accept=".pdf" className="hidden"
                  id="pdf-file-input"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setPdfFile(f) }}
                />
                {!pdfFile ? (
                  <DropZone
                    dragging={pdfDrag}
                    onClick={() => pdfRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDragEnter={() => setPdfDrag(true)}
                    onDragLeave={() => setPdfDrag(false)}
                    onDrop={handlePdfDrop}
                  >
                    <div className="text-4xl">📄</div>
                    <div className="text-center">
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                        Klik atau seret file PDF ke sini
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Hanya PDF berbasis teks yang didukung · Maks 20 MB
                      </p>
                    </div>
                  </DropZone>
                ) : (
                  <div className="rounded-xl p-4 flex items-center gap-4"
                    style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
                    <div className="text-3xl">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>
                        {pdfFile.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {(pdfFile.size / 1024).toFixed(0)} KB
                        {isExtracting && <span className="ml-2 anim-pulse">· Membaca teks…</span>}
                      </p>
                    </div>
                    {isExtracting
                      ? <Spinner size={18} />
                      : <button
                          onClick={() => { setPdfFile(null); setPreviewText('') }}
                          aria-label="Hapus file"
                          className="text-sm px-3 py-1 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-muted)', background: 'var(--color-border)' }}
                        >Ganti</button>
                    }
                  </div>
                )}
              </div>
            )}

            {/* IMAGE TAB */}
            {activeTab === 'image' && (
              <div className="anim-fade-up">
                <input
                  ref={imgRef} type="file" accept="image/jpeg,image/png" className="hidden"
                  id="image-file-input"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) selectImage(f) }}
                />
                {!imageFile ? (
                  <DropZone
                    dragging={imgDrag}
                    onClick={() => imgRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDragEnter={() => setImgDrag(true)}
                    onDragLeave={() => setImgDrag(false)}
                    onDrop={handleImageDrop}
                  >
                    <div className="text-4xl">🖼️</div>
                    <div className="text-center">
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                        Klik atau seret gambar ke sini
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Format JPG dan PNG · Maks 5 MB
                      </p>
                    </div>
                  </DropZone>
                ) : (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)' }}>
                    {imagePreview && (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Preview gambar yang diunggah" className="w-full object-contain max-h-52" />
                        {isExtracting && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                            style={{ background: 'rgba(36,59,85,0.6)', color: '#fff' }}>
                            <Spinner size={28} />
                            <span className="text-sm font-medium">Membaca teks dari gambar…</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-3 flex items-center gap-3" style={{ background: 'var(--color-surface-2)' }}>
                      <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {imageFile.name}
                      </span>
                      {!isExtracting && (
                        <button
                          onClick={() => { setImageFile(null); setImagePreview(''); setPreviewText('') }}
                          className="text-xs px-3 py-1 rounded-lg"
                          style={{ color: 'var(--color-text-muted)', background: 'var(--color-border)' }}
                        >Ganti</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Preview panel (PDF & Image tabs) ─── */}
          {(activeTab !== 'text') && (
            <div className="px-6 pt-2 pb-4 anim-fade-up">
              <div className="mt-3 rounded-xl overflow-hidden"
                style={{ border: '1.5px solid var(--color-border)' }}>
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    Preview Teks Hasil Ekstraksi
                  </span>
                  {previewText && (
                    <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                      {previewText.length.toLocaleString('id')} karakter · bisa diedit
                    </span>
                  )}
                </div>
                {isExtracting && !previewText ? (
                  <div className="flex items-center gap-3 p-5" style={{ color: 'var(--color-text-muted)' }}>
                    <Spinner size={16} />
                    <span className="text-sm">Sedang membaca materi…</span>
                  </div>
                ) : (
                  <textarea
                    id="preview-text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    rows={7}
                    placeholder={
                      activeTab === 'pdf'
                        ? 'Teks dari PDF akan muncul di sini setelah file diunggah…'
                        : 'Teks dari gambar akan muncul di sini setelah gambar diunggah…'
                    }
                    className="w-full px-4 py-3 text-sm leading-relaxed resize-none"
                    style={{ color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none', border: 'none' }}
                    aria-label="Preview dan edit teks yang diekstrak"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Process button ──────────────────────── */}
          <div className="px-6 pb-6 pt-2">
            <button
              id="btn-process"
              onClick={handleProcess}
              disabled={!canProcess}
              aria-busy={isProcessing}
              className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200"
              style={
                canProcess
                  ? {
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, #2C5F72 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 16px rgba(59,107,124,0.35)',
                      cursor: 'pointer',
                    }
                  : {
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-text-subtle)',
                      cursor: 'not-allowed',
                      border: '1.5px solid var(--color-border)',
                    }
              }
            >
              {isProcessing ? (
                <>
                  <Spinner size={20} />
                  <span>AI sedang menyusun langkah belajar…</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Proses Materi</span>
                  <span style={{ opacity: 0.8 }}>→</span>
                </>
              )}
            </button>
            {!canProcess && !isProcessing && contentForProcessing.length > 0 && contentForProcessing.length < 20 && (
              <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-subtle)' }}>
                Tambahkan lebih banyak teks agar AI dapat memproses materi dengan baik
              </p>
            )}
            {!canProcess && !isProcessing && contentForProcessing.length === 0 && (
              <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-subtle)' }}>
                Masukkan materi terlebih dahulu
              </p>
            )}
          </div>

        </div>

        {/* ── Tip box ──────────────────────────── */}
        <div className="mt-4 px-5 py-4 rounded-xl text-sm"
          style={{ background: 'rgba(59,107,124,0.07)', border: '1px solid var(--color-primary-muted)' }}>
          <p className="font-medium mb-1" style={{ color: 'var(--color-primary)' }}>💡 Tips penggunaan</p>
          <ul className="space-y-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            <li>• Materi yang lebih panjang menghasilkan langkah belajar yang lebih lengkap</li>
            <li>• PDF hasil scan gambar → gunakan tab <strong>Upload Gambar</strong> untuk hasil lebih baik</li>
            <li>• Kamu bisa mengedit teks hasil ekstraksi sebelum diproses</li>
          </ul>
        </div>

      </section>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="py-5 text-center text-xs" style={{ color: 'var(--color-text-subtle)' }}>
        Smart Step Learning Assistant · Belajar dengan cara yang nyaman untukmu
      </footer>
    </main>
  )
}
