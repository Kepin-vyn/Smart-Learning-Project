import Groq from 'groq-sdk'
import type { MicroStep, ProcessResult, QuizResult } from './types'

// Simple hash for caching (same as gemini.ts)
function hashText(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0 }
  return `ssl_groq_${Math.abs(h)}`
}

const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { value, expires } = JSON.parse(raw)
    if (Date.now() > expires) { localStorage.removeItem(key); return null }
    return value as T
  } catch { return null }
}

function setCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify({ value, expires: Date.now() + CACHE_TTL })) } catch {}
}

function getClient() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY belum diatur di .env.local')
  return new Groq({ apiKey: key })
}

function parseJSON(raw: string): unknown {
  const jsonStr = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .replace(/\/\/.*$/gm, '') // strip JS-style comments from JSON
    .trim()
  return JSON.parse(jsonStr)
}

export async function processContentToSteps(text: string): Promise<ProcessResult> {
  const cacheKey = hashText(text.trim())
  const cached = getCache<ProcessResult>(cacheKey)
  if (cached) {
    console.log('[SmartStep/Groq] Cache hit — skipping API call')
    return cached
  }

  const groq = getClient()

  const prompt = `Kamu adalah asisten pembelajaran yang membantu pengguna dengan ADHD, disleksia, dan autisme belajar lebih mudah.

Tugas: Ubah materi berikut menjadi micro-steps yang mudah dipahami.

Aturan:
- Buat 5–8 langkah (micro-steps)
- Setiap langkah maksimal 3–5 kalimat pendek
- Setiap langkah punya judul singkat (maks 6 kata)
- Gunakan bahasa sederhana dan jelas
- Deteksi bahasa input dan WAJIB merespons dalam bahasa yang SAMA
- Jangan ubah makna inti materi
- Kembalikan HANYA JSON valid, tanpa komentar apapun

Format JSON yang wajib dikembalikan:
{"language":"id","steps":[{"id":"step-1","stepNumber":1,"title":"Judul Singkat","content":"Penjelasan 3-5 kalimat."}]}

Materi:
${text}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: 'json_object' }
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  const parsed = parseJSON(raw) as { steps: MicroStep[]; language: string }

  const result: ProcessResult = {
    steps: parsed.steps,
    totalSteps: parsed.steps.length,
    language: parsed.language ?? 'id'
  }

  setCache(cacheKey, result)
  return result
}

export async function generateQuizFromSteps(
  steps: MicroStep[],
  language: string,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal'
): Promise<QuizResult> {
  const stepsHash = hashText(steps.map(s => s.id).join(',') + difficulty)
  const cached = getCache<QuizResult>(stepsHash)
  if (cached) {
    console.log('[SmartStep/Groq] Quiz cache hit')
    return cached
  }

  const groq = getClient()
  const contentSummary = steps.map(s => `[${s.title}]: ${s.content}`).join('\n')
  const isEn = language === 'en'

  const diffMap = {
    easy: isEn ? 'Make questions very simple and factual.' : 'Buat soal yang sangat mudah dan faktual.',
    normal: isEn ? 'Use standard difficulty.' : 'Gunakan tingkat kesulitan standar.',
    hard: isEn ? 'Make questions analytical and challenging.' : 'Buat soal yang memerlukan analisis.'
  }

  const prompt = `Kamu adalah asisten pembelajaran. Berdasarkan materi berikut, buatlah 3–5 soal pilihan ganda.

ATURAN:
1. Soal HARUS dari materi ini saja, bukan pengetahuan umum.
2. Setiap soal: 4 pilihan jawaban, 1 benar, 3 pengecoh logis.
3. Sertakan hint dan explanation.
4. Bahasa: ${isEn ? 'English' : 'Indonesia'}.
5. ${diffMap[difficulty]}
6. Kembalikan HANYA JSON valid tanpa komentar.

Format JSON:
{"questions":[{"id":"q1","question":"Pertanyaan?","options":["A","B","C","D"],"correctIndex":0,"hint":"Petunjuk","explanation":"Penjelasan mengapa jawaban ini benar."}]}

Materi:
${contentSummary}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 2048,
    response_format: { type: 'json_object' }
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  const quizResult = parseJSON(raw) as QuizResult

  setCache(stepsHash, quizResult)
  return quizResult
}

export async function extractTextFromImage(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const groq = getClient()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.2-90b-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Ekstrak semua teks yang ada dalam gambar ini. Kembalikan HANYA teks tersebut tanpa format tambahan atau komentar apapun.' },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 1024,
  })

  return completion.choices[0]?.message?.content ?? ''
}

