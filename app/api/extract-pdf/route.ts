import { NextRequest, NextResponse } from 'next/server'
const pdfParse = require('pdf-parse')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ ok: false, message: 'Tidak ada file yang diterima.' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ ok: false, message: 'Mohon unggah file PDF yang valid.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const data = await pdfParse(buffer)
    const text = data.text?.trim()

    if (!text || text.length < 10) {
      return NextResponse.json({
        ok: false,
        message: 'Teks dalam PDF tidak dapat dibaca secara otomatis. PDF ini mungkin berisi gambar teks — coba unggah halaman PDF sebagai gambar melalui tab Gambar.',
      })
    }

    // Warn user if text was truncated (> 8000 chars safe limit for Groq free tier)
    const MAX_CHARS = 8000
    if (text.length > MAX_CHARS) {
      const truncated = text.slice(0, MAX_CHARS)
      return NextResponse.json({
        ok: true,
        text: truncated,
        warning: `PDF berisi ${text.length.toLocaleString()} karakter. Hanya ${MAX_CHARS.toLocaleString()} karakter pertama yang diproses agar sesuai batas AI. Pertimbangkan untuk mengunggah per bagian.`,
      })
    }

    return NextResponse.json({ ok: true, text })
  } catch (err) {
    console.error('PDF Extraction Error:', err)
    return NextResponse.json({
      ok: false,
      message: 'PDF tidak dapat dibaca saat ini. Coba unggah file lain atau masukkan teks secara manual.',
    }, { status: 500 })
  }
}
