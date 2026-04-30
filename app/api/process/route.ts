import { NextRequest, NextResponse } from 'next/server'
import { processContentToSteps } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { ok: false, message: 'Teks terlalu pendek untuk diproses.' },
        { status: 400 }
      )
    }

    const result = await processContentToSteps(text.trim())
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('API Error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('GROQ_API_KEY')) {
      return NextResponse.json(
        { ok: false, message: 'Konfigurasi AI belum lengkap. Hubungi pengembang.' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { ok: false, message: 'Materi belum bisa diproses. Coba lagi dalam beberapa saat.' },
      { status: 500 }
    )
  }
}
