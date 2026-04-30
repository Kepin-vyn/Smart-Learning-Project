import { NextRequest, NextResponse } from 'next/server'
import { processContentToSteps } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text } = body

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json({
        ok: false,
        message: 'Materi terlalu singkat. Coba tambahkan lebih banyak teks agar dapat diproses.',
      }, { status: 400 })
    }

    if (text.length > 50000) {
      return NextResponse.json({
        ok: false,
        message: 'Materi terlalu panjang. Coba potong menjadi bagian yang lebih kecil (maks sekitar 50.000 karakter).',
      }, { status: 400 })
    }

    const result = await processContentToSteps(text.trim())
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('API Error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('JSON')) {
      return NextResponse.json({
        ok: false,
        message: 'AI sedang sibuk memformat respons. Coba lagi dalam beberapa saat.',
      }, { status: 500 })
    }
    return NextResponse.json({
      ok: false,
      message: 'Materi tidak dapat diproses saat ini. Pastikan API key sudah benar dan coba lagi.',
    }, { status: 500 })
  }
}
