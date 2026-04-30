import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MicroStep, ProcessResult } from './types'

function getClient() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY belum diatur di .env.local')
  return new GoogleGenerativeAI(key)
}

export async function extractTextFromImage(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
    {
      inlineData: { data: base64Data, mimeType },
    },
    `Ekstrak semua teks yang terlihat di gambar ini. 
Kembalikan HANYA teks yang diekstrak, tanpa penjelasan tambahan. 
Jika tidak ada teks yang bisa dibaca, balas dengan tepat: TIDAK_ADA_TEKS`,
  ])

  const text = result.response.text().trim()
  if (text === 'TIDAK_ADA_TEKS') return ''
  return text
}

export async function processContentToSteps(text: string): Promise<ProcessResult> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `Kamu adalah asisten pembelajaran yang membantu pengguna dengan ADHD, disleksia, dan autisme belajar lebih mudah.

Tugas: Ubah materi berikut menjadi micro-steps yang mudah dipahami.

Aturan:
- Buat 5–8 langkah (micro-steps)
- Setiap langkah maksimal 3–5 kalimat pendek
- Setiap langkah punya judul singkat (maks 6 kata)
- Gunakan bahasa sederhana dan jelas
- Deteksi bahasa input dan WAJIB merespons dalam bahasa yang SAMA
- Jangan ubah makna inti materi
- Kembalikan HANYA JSON valid

Format JSON:
{
  "language": "id" atau "en",
  "steps": [
    {
      "id": "step-1",
      "stepNumber": 1,
      "title": "Judul Singkat Langkah",
      "content": "Penjelasan langkah ini dalam 3-5 kalimat pendek."
    }
  ]
}

Materi:
${text}`

  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()

  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()

  const parsed = JSON.parse(jsonStr)
  return {
    steps: parsed.steps as MicroStep[],
    totalSteps: parsed.steps.length,
    language: parsed.language ?? 'id',
  }
}
