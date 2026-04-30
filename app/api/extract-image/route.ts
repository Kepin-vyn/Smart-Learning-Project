import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromImage } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ ok: false, message: 'Tidak ada gambar yang diterima.' }, { status: 400 })
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ ok: false, message: 'Format yang diterima: JPG dan PNG.' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, message: 'Ukuran gambar terlalu besar. Gunakan gambar di bawah 5 MB.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const text = await extractTextFromImage(base64, file.type)

    if (!text || text.length < 5) {
      return NextResponse.json({
        ok: false,
        message: 'Teks dalam gambar sulit terbaca. Coba gunakan gambar yang lebih terang dan resolusinya lebih tinggi, atau ketik teks secara manual.',
      })
    }

    return NextResponse.json({ ok: true, text })
  } catch (err) {
    console.error('Image Extraction Error:', err)
    return NextResponse.json({
      ok: false,
      message: 'Gambar tidak dapat diproses saat ini. Pastikan GROQ_API_KEY valid dan model vision tersedia.',
    }, { status: 500 })
  }
}
