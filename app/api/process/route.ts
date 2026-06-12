import { NextRequest, NextResponse } from 'next/server'
import { processContentToSteps } from '@/lib/groq'

// Groq free tier limit ~12.000 TPM; prompt overhead ~500 token.
// 1 token ≈ 4 chars → safe budget ≈ (12000 - 500) * 4 = ~46.000 chars.
// We stay conservative at 8.000 chars to leave room for system prompt.
const MAX_TEXT_CHARS = 8000

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { ok: false, message: 'Teks terlalu pendek untuk diproses.' },
        { status: 400 }
      )
    }

    // Truncate to avoid hitting Groq token limit
    const trimmed = text.trim()
    const truncated = trimmed.length > MAX_TEXT_CHARS
      ? trimmed.slice(0, MAX_TEXT_CHARS) + '\n\n[... teks dipotong karena terlalu panjang]'
      : trimmed

    const result = await processContentToSteps(truncated)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('API Error:', err)
    const msg = err instanceof Error ? err.message : String(err)

    if (msg.includes('GROQ_API_KEY')) {
      return NextResponse.json(
        { ok: false, message: 'Konfigurasi AI belum lengkap. Hubungi pengembang.' },
        { status: 500 }
      )
    }

    // Rate limit / token limit exceeded
    if (msg.includes('413') || msg.includes('rate_limit') || msg.includes('tokens')) {
      return NextResponse.json(
        { ok: false, message: 'Materi terlalu panjang untuk diproses. Coba potong teks menjadi bagian lebih kecil (maks ~2 halaman) lalu coba lagi.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { ok: false, message: 'Materi belum bisa diproses. Coba lagi dalam beberapa saat.' },
      { status: 500 }
    )
  }
}
