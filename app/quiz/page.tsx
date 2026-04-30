'use client'

import { useRouter } from 'next/navigation'
import { useLearningStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { saveSession } from '@/lib/sessions'
import type { SessionRecord } from '@/lib/types'

interface ShuffledOption {
  text: string
  originalIndex: number
}

interface MissedQuestion {
  question: string
  correctAnswer: string
  explanation: string
}

export default function QuizPage() {
  const router = useRouter()
  const { result, quizResult, setQuizResult, difficulty, setDifficulty, setLatestScore } = useLearningStore()
  
  const [mounted, setMounted] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([])
  
  // Quiz state for the current question
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([])
  const [retryCount, setRetryCount] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | null, message: string }>({ type: null, message: '' })
  const [isRevealed, setIsRevealed] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  // Initialization and generation
  useEffect(() => {
    setMounted(true)
  }, [])

  const generateQuiz = useCallback(async (forcedDifficulty?: 'easy' | 'normal' | 'hard') => {
    if (!result?.steps) return
    setIsGenerating(true)
    const targetDifficulty = forcedDifficulty || difficulty

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: result.steps, language: result.language, difficulty: targetDifficulty })
      })
      const data = await res.json()
      if (data.ok && data.questions) {
        const shuffledQuestions = [...data.questions].sort(() => Math.random() - 0.5)
        setQuizResult({ questions: shuffledQuestions })
        setCurrentQuestionIndex(0)
        setCorrectAnswers(0)
        setMissedQuestions([])
      } else {
        setFeedback({ type: 'warning', message: 'Kuis belum siap, mari coba lagi sebentar.' })
      }
    } catch {
      setFeedback({ type: 'warning', message: 'Kuis belum siap, mari coba lagi sebentar.' })
    } finally {
      setIsGenerating(false)
    }
  }, [result, setQuizResult, difficulty])

  useEffect(() => {
    if (mounted && result?.steps && !quizResult && !isGenerating) {
      generateQuiz()
    }
  }, [mounted, result, quizResult, isGenerating, generateQuiz])

  // Setup current question options
  useEffect(() => {
    if (quizResult?.questions && quizResult.questions[currentQuestionIndex]) {
      const q = quizResult.questions[currentQuestionIndex]
      const optionsWithIndices = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }))
      const shuffled = [...optionsWithIndices].sort(() => Math.random() - 0.5)
      
      setShuffledOptions(shuffled)
      setRetryCount(0)
      setFeedback({ type: null, message: '' })
      setIsRevealed(false)
      setShowExplanation(false)
    } else if (quizResult?.questions && currentQuestionIndex >= quizResult.questions.length && quizResult.questions.length > 0) {
      // Quiz Finished — save session and redirect
      const score = Math.round((correctAnswers / quizResult.questions.length) * 100)
      setLatestScore(score)

      const newDifficulty = score < 60 ? 'easy' : score >= 80 ? 'hard' : 'normal'
      setDifficulty(newDifficulty)

      // Build session record
      const topic = result?.steps?.[0]?.title ?? 'Materi tanpa judul'
      const session: SessionRecord = {
        id: `session_${Date.now()}`,
        date: new Date().toISOString(),
        topic,
        score,
        totalSteps: result?.totalSteps ?? result?.steps?.length ?? 0,
        difficulty,
        missedQuestions,
        status: score >= 60 ? 'lulus' : 'perlu-review'
      }
      saveSession(session)

      // Store session ID for summary page
      localStorage.setItem('smartstep_last_session', JSON.stringify(session))

      router.push('/summary')
    }
  }, [quizResult, currentQuestionIndex, correctAnswers, missedQuestions, setLatestScore, setDifficulty, result, difficulty, router])

  if (!mounted) return <div className="min-h-screen bg-[#EFF3F7]" />

  if (!result || !result.steps) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: '#EFF3F7' }}>
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm max-w-md w-full">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="text-xl font-bold text-[#1C2B3A]">Belum Ada Materi</h1>
          <button 
            onClick={() => router.push('/')}
            className="inline-block mt-6 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: '#3B6B7C' }}
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </main>
    )
  }

  if (isGenerating || !quizResult) {
    return (
      <main className="h-screen flex flex-col items-center justify-center" style={{ background: '#EFF3F7' }}>
        <div className="animate-spin text-4xl mb-4">✨</div>
        <h2 className="text-[#1C2B3A] font-medium text-lg">Menyiapkan kuis khusus untukmu...</h2>
      </main>
    )
  }

  const question = quizResult.questions[currentQuestionIndex]
  const isFinished = currentQuestionIndex >= quizResult.questions.length

  if (isFinished) {
    return (
      <main className="h-screen flex flex-col items-center justify-center" style={{ background: '#EFF3F7' }}>
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <h2 className="text-[#1C2B3A] font-medium text-lg">Menyiapkan ringkasan sesimu...</h2>
      </main>
    )
  }

  const handleOptionClick = (originalIndex: number) => {
    if (isRevealed || showExplanation) return

    if (originalIndex === question.correctIndex) {
      setFeedback({ type: 'success', message: 'Luar biasa! Jawabanmu tepat.' })
      setIsRevealed(true)
      setShowExplanation(true)
      if (retryCount === 0) setCorrectAnswers(prev => prev + 1)
    } else {
      const newRetry = retryCount + 1
      setRetryCount(newRetry)
      
      if (newRetry >= 2) {
        setFeedback({ type: 'warning', message: 'Mari kita pelajari bersama jawaban yang paling tepat.' })
        setIsRevealed(true)
        setShowExplanation(true)
        // Track this as a missed question
        setMissedQuestions(prev => [...prev, {
          question: question.question,
          correctAnswer: question.options[question.correctIndex],
          explanation: question.explanation
        }])
      } else {
        setFeedback({ type: 'warning', message: `Hampir! Coba lagi. Petunjuk: ${question.hint}` })
      }
    }
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col" style={{ background: '#EFF3F7' }}>
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b border-[#CCDAE4] shadow-sm shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={() => router.push('/steps')}
            className="text-[#536878] hover:text-[#1C2B3A] transition-colors p-2 -ml-2 rounded-lg hover:bg-[#F7FAFB]"
          >
            ← Materi
          </button>
          
          <div className="flex-1 max-w-md text-center">
            <div className="text-xs font-semibold text-[#536878] mb-2 tracking-wide">
              SOAL {currentQuestionIndex + 1} DARI {quizResult.questions.length}
            </div>
            <div className="h-2 w-full bg-[#E8F2F6] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#3B6B7C] transition-all duration-500 ease-out rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / quizResult.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-16" />
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col justify-center relative overflow-y-auto">
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_32px_rgba(36,59,85,0.08)] anim-fade-up">
          
          <h2 className="text-xl md:text-2xl font-bold text-[#1C2B3A] mb-8 leading-relaxed">
            {question.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {shuffledOptions.map((opt, idx) => {
              let btnStyle = "bg-white border-2 border-[#E8F2F6] text-[#1C2B3A] hover:border-[#3B6B7C] hover:bg-[#F7FAFB]"
              
              if (isRevealed) {
                if (opt.originalIndex === question.correctIndex) {
                  btnStyle = "bg-[#E6F4EA] border-2 border-[#3A8C6E] text-[#1C2B3A] font-semibold"
                } else {
                  btnStyle = "bg-[#F7FAFB] border-2 border-[#E8F2F6] text-[#8DA4B4] opacity-70 cursor-not-allowed"
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt.originalIndex)}
                  disabled={isRevealed}
                  className={`w-full text-left p-4 rounded-xl transition-all text-[1.05rem] ${btnStyle}`}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>

          {/* Feedback Section */}
          {feedback.message && (
            <div 
              className={`mt-6 p-4 rounded-xl border flex items-start gap-3 anim-fade-up ${
                feedback.type === 'success' 
                  ? 'bg-[#E6F4EA] border-[#CDE9D6] text-[#2E6B52]' 
                  : 'bg-[#FFF9E6] border-[#FFECB3] text-[#A67C00]'
              }`}
            >
              <div className="text-xl mt-0.5">
                {feedback.type === 'success' ? '✨' : '💡'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[1.05rem]">{feedback.message}</p>
                {showExplanation && (
                  <p className="mt-2 text-sm opacity-90 leading-relaxed">
                    {question.explanation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Next Button */}
          {showExplanation && (
            <div className="mt-8 flex justify-end anim-fade-up">
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-sm"
                style={{ background: '#3B6B7C' }}
              >
                {currentQuestionIndex === quizResult.questions.length - 1 ? 'Lihat Ringkasan ✨' : 'Soal Selanjutnya →'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
