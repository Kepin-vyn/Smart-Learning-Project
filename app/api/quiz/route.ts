import { NextRequest, NextResponse } from 'next/server'
import { generateQuizFromSteps } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { steps, language, difficulty } = body

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Data steps tidak valid atau kosong.' },
        { status: 400 }
      )
    }

    const quizResult = await generateQuizFromSteps(steps, language ?? 'id', difficulty ?? 'normal')
    return NextResponse.json({ ok: true, ...quizResult, difficulty })
  } catch (err) {
    console.error('Quiz Generation Error:', err)
    return NextResponse.json(
      { ok: false, message: 'Gagal membuat kuis. Coba lagi nanti.' },
      { status: 500 }
    )
  }
}
