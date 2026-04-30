import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MicroStep, ProcessResult, QuizResult } from './types'

// Simple hash for caching
function hashText(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0 }
  return `ssl_cache_${Math.abs(h)}`
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
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY belum diatur di .env.local')
  return new GoogleGenerativeAI(key)
}

export async function extractTextFromImage(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

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
  // Check cache first — avoid unnecessary API calls
  const cacheKey = hashText(text.trim())
  const cached = getCache<ProcessResult>(cacheKey)
  if (cached) {
    console.log('[SmartStep] Cache hit — skipping API call')
    return cached
  }

  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

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

  const aiResult = await model.generateContent(prompt)
  const raw = aiResult.response.text().trim()

  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()

  const parsed = JSON.parse(jsonStr)
  const result: ProcessResult = {
    steps: parsed.steps as MicroStep[],
    totalSteps: parsed.steps.length,
    language: parsed.language ?? 'id',
  }

  // Save to cache
  setCache(cacheKey, result)

  return result
}

export async function generateQuizFromSteps(steps: MicroStep[], language: string, difficulty: 'easy' | 'normal' | 'hard' = 'normal'): Promise<QuizResult> {
  // Cache quiz per steps hash + difficulty
  const stepsHash = hashText(steps.map(s => s.id).join(',') + difficulty)
  const cachedQuiz = getCache<QuizResult>(stepsHash)
  if (cachedQuiz) {
    console.log('[SmartStep] Quiz cache hit')
    return cachedQuiz
  }

  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

  const contentSummary = steps.map(s => `[${s.title}]: ${s.content}`).join('\n')
  const isEn = language === 'en'

  let difficultyInstruction = ""
  if (difficulty === 'easy') {
    difficultyInstruction = "Buat soal yang SANGAT MUDAH dan sangat jelas (faktual sederhana), agar tidak membuat siswa frustrasi."
  } else if (difficulty === 'hard') {
    difficultyInstruction = "Buat soal yang CUKUP MENANTANG (perlu analisis sedikit), namun tetap bersumber dari teks."
  } else {
    difficultyInstruction = "Buat soal dengan tingkat kesulitan STANDAR."
  }

  const prompt = `Kamu adalah asisten pembelajaran. Berdasarkan ringkasan materi berikut, buatlah 3 hingga 5 soal pilihan ganda.
  
ATURAN WAJIB:
1. Soal HARUS sepenuhnya berasal dari teks materi yang diberikan di bawah ini. Jangan gunakan pengetahuan dari luar.
2. Setiap soal memiliki 4 pilihan jawaban (satu benar, tiga pengecoh yang logis).
3. Berikan 'hint' (petunjuk) untuk membantu jika user salah menjawab.
4. Berikan 'explanation' (penjelasan) mengapa jawaban tersebut benar.
5. Gunakan bahasa ${isEn ? 'Inggris' : 'Indonesia'}.
6. Kembalikan HANYA JSON valid.
7. ${difficultyInstruction}

Format JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "Pertanyaan?",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctIndex": 0, // index dari jawaban benar (0-3)
      "hint": "Petunjuk jika salah",
      "explanation": "Penjelasan mengapa opsi ini benar."
    }
  ]
}

Materi:
${contentSummary}`

  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()
  const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()

  const quizResult = JSON.parse(jsonStr) as QuizResult
  setCache(stepsHash, quizResult)
  return quizResult
}
