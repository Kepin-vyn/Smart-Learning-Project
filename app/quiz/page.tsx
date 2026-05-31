'use client'

import { useRouter } from 'next/navigation'
import { useLearningStore } from '@/lib/store'
import { useEffect, useState, useCallback, useRef } from 'react'
import { saveSession } from '@/lib/sessions'
import type { SessionRecord } from '@/lib/types'
import { translations } from '@/lib/i18n'

interface ShuffledOption { text: string; originalIndex: number }
interface MissedQuestion { question: string; correctAnswer: string; explanation: string }

export default function QuizPage() {
  const router = useRouter()
  const { result, quizResult, setQuizResult, difficulty, setDifficulty, setLatestScore, lang } = useLearningStore()
  const t = translations[lang]
  
  const [mounted, setMounted] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([])
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([])
  const [retryCount, setRetryCount] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | null; message: string }>({ type: null, message: '' })
  const [isRevealed, setIsRevealed] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
    } finally { setIsGenerating(false) }
  }, [result, setQuizResult, difficulty])

  useEffect(() => {
    if (mounted && result?.steps && !quizResult && !isGenerating) generateQuiz()
  }, [mounted, result, quizResult, isGenerating, generateQuiz])

  useEffect(() => {
    if (quizResult?.questions && quizResult.questions[currentQuestionIndex]) {
      const q = quizResult.questions[currentQuestionIndex]
      const optionsWithIndices = q.options.map((opt: string, idx: number) => ({ text: opt, originalIndex: idx }))
      const shuffled = [...optionsWithIndices].sort(() => Math.random() - 0.5)
      setShuffledOptions(shuffled)
      setRetryCount(0)
      setFeedback({ type: null, message: '' })
      setIsRevealed(false)
      setShowExplanation(false)
    }
  }, [quizResult, currentQuestionIndex])

  const savedRef = useRef(false) // ← one-shot flag: only save once per quiz

  useEffect(() => {
    if (
      quizResult?.questions &&
      currentQuestionIndex >= quizResult.questions.length &&
      quizResult.questions.length > 0 &&
      !savedRef.current // ← skip if already saved
    ) {
      savedRef.current = true // ← mark as saved immediately to prevent re-entry
      const score = Math.round((correctAnswers / quizResult.questions.length) * 100)
      setLatestScore(score)
      const newDifficulty = score < 60 ? 'easy' : score >= 80 ? 'hard' : 'normal'
      setDifficulty(newDifficulty)
      const topic = result?.steps?.[0]?.title ?? 'Materi tanpa judul'
      const uniqueMissed = Array.from(new Map(missedQuestions.map(item => [item.question, item])).values())
      const session: SessionRecord = {
        id: `session_${Date.now()}`, date: new Date().toISOString(), topic, score,
        totalSteps: result?.totalSteps ?? result?.steps?.length ?? 0, difficulty,
        missedQuestions: uniqueMissed, status: score >= 60 ? 'lulus' : 'perlu-review'
      }
      saveSession(session)
      localStorage.setItem('smartstep_last_session', JSON.stringify(session))
      router.push('/summary')
    }
  }, [quizResult, currentQuestionIndex, correctAnswers, missedQuestions, setLatestScore, setDifficulty, result, difficulty, router])

  if (!mounted) return <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} />

  if (!result || !result.steps) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center p-12 rounded-[2rem] max-w-md w-full shadow-card"
          style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-border)' }}>
          <span className="material-symbols-outlined text-5xl block mb-4" style={{ color: 'var(--color-primary-container)' }}>inbox</span>
          <h1 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{t.quiz_no_material_title}</h1>
          <button onClick={() => router.push('/')} className="px-6 py-3 rounded-full font-semibold text-sm squishy-btn"
            style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-container)' }}>
            {t.quiz_back_home}
          </button>
        </div>
      </main>
    )
  }

  /* ── Loading state (Stitch: loading_kuis_focused_view) ── */
  if (isGenerating || !quizResult) {
    return (
      <main className="h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--color-bg)' }}>
        {/* Decorative aura */}
        <div className="mb-10 relative anim-pulse-gentle">
          <div className="absolute inset-0 rounded-full blur-3xl scale-150" style={{ background: 'rgba(143,169,152,0.15)' }} />
          <div className="relative p-10 rounded-[3rem] shadow-card border" style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}>
            <span className="material-symbols-outlined text-7xl filled" style={{ color: 'var(--color-primary-container)' }}>auto_awesome</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-3 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)' }}>
          {t.quiz_loading_title}
        </h2>
        <p className="text-sm text-center max-w-xs mb-8" style={{ color: 'var(--color-text-subtle)' }}>
          {t.quiz_loading_desc}
        </p>
        <div className="w-56 h-1 rounded-full overflow-hidden relative" style={{ background: 'var(--color-surface-container-high)' }}>
          <div className="h-full w-2/3 rounded-full shimmer-bar relative" style={{ background: 'var(--color-primary-container)', opacity: 0.8 }} />
        </div>
        <p className="text-xs mt-8 uppercase tracking-widest opacity-40" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-outline)' }}>
          {t.quiz_loading_calm}
        </p>
      </main>
    )
  }

  const question = quizResult.questions[currentQuestionIndex]
  const isFinished = currentQuestionIndex >= quizResult.questions.length

  if (isFinished) {
    return (
      <main className="h-screen flex flex-col items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="anim-pulse-gentle mb-4">
          <span className="material-symbols-outlined text-6xl" style={{ color: 'var(--color-primary-container)' }}>hourglass_top</span>
        </div>
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)' }}>{t.quiz_saving}</h2>
      </main>
    )
  }

  const handleOptionClick = (originalIndex: number) => {
    if (isRevealed || showExplanation) return
    if (originalIndex === question.correctIndex) {
      setFeedback({ type: 'success', message: t.quiz_feedback_correct })
      setIsRevealed(true)
      setShowExplanation(true)
      if (retryCount === 0) setCorrectAnswers(prev => prev + 1)
    } else {
      const newRetry = retryCount + 1
      setRetryCount(newRetry)
      if (newRetry >= 2) {
        setFeedback({ type: 'warning', message: t.quiz_feedback_review })
        setIsRevealed(true)
        setShowExplanation(true)
        setMissedQuestions(prev => [...prev, {
          question: question.question,
          correctAnswer: question.options[question.correctIndex],
          explanation: question.explanation
        }])
      } else {
        setFeedback({ type: 'warning', message: t.quiz_feedback_hint(question.hint) })
      }
    }
  }

  const progress = ((currentQuestionIndex + 1) / quizResult.questions.length) * 100

  /* ── Quiz UI (Stitch: quiz_focused_view) ── */
  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-6" style={{ background: 'var(--color-bg)' }}>

      {/* Decorative bg */}
      <div className="fixed bottom-0 right-0 -z-10 opacity-20 pointer-events-none p-12">
        <div className="w-64 h-64 rounded-full blur-[80px]" style={{ background: 'var(--color-primary-fixed)' }} />
      </div>

      <main className="w-full max-w-4xl">

        {/* Logo compact */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="material-symbols-outlined text-3xl filled" style={{ color: 'var(--color-primary)' }}>eco</span>
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>Smart Step</span>
        </div>

        {/* Progress */}
        <div className="mb-6 w-full">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
              {t.quiz_question_label(currentQuestionIndex + 1, quizResult.questions.length)}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--color-primary-container)' }} />
          </div>
        </div>

        {/* Quiz card */}
        <section className="rounded-2xl md:rounded-[2.5rem] p-5 md:p-12 shadow-lifted mb-6 border anim-fade-up"
          style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-surface-container-high)' }}>

          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl md:rounded-2xl shrink-0" style={{ background: 'var(--color-primary-fixed)' }}>
              <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ color: 'var(--color-primary)' }}>psychology</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold leading-snug flex-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              {question.question}
            </h2>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
            {shuffledOptions.map((opt, idx) => {
              const labels = ['A', 'B', 'C', 'D']
              const isCorrect = isRevealed && opt.originalIndex === question.correctIndex
              const isWrong = isRevealed && opt.originalIndex !== question.correctIndex

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt.originalIndex)}
                  disabled={isRevealed}
                  className={`group flex flex-col items-start text-left p-4 md:p-5 rounded-xl md:rounded-[1.5rem] transition-all border-2 ${
                    isCorrect ? 'anim-pulse-green' : ''
                  }`}
                  style={isCorrect
                    ? { background: 'rgba(143,169,152,0.12)', borderColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)' }
                    : isWrong
                    ? { background: '#fff8f0', borderColor: '#f0c070', color: '#8a6000', opacity: 0.8 }
                    : { background: 'var(--color-surface-container-low)', borderColor: 'transparent', color: 'var(--color-text)' }}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-bold text-xs md:text-sm" style={{ color: isCorrect ? 'var(--color-primary-container)' : isWrong ? '#8a6000' : 'var(--color-text-subtle)' }}>
                      {t.quiz_option_label(['A','B','C','D'][idx])}
                    </span>
                    {isCorrect && (
                      <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                        <span className="material-symbols-outlined text-xs md:text-sm filled">check</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm md:text-base leading-relaxed">{opt.text}</p>
                  {isCorrect && (
                    <div className="mt-3 flex items-center gap-1 md:gap-1.5" style={{ color: 'var(--color-primary)' }}>
                      <span className="material-symbols-outlined text-sm md:text-base">verified</span>
                      <span className="text-xs md:text-sm font-semibold">{t.quiz_correct_inline}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {feedback.message && (
            <div className="mt-6 p-4 rounded-xl md:rounded-2xl flex items-start gap-2.5 md:gap-3 anim-fade-up border"
              style={feedback.type === 'success'
                ? { background: 'var(--color-green-bg)', borderColor: 'var(--color-green-border)', color: 'var(--color-green)' }
                : { background: 'var(--color-amber-bg)', borderColor: 'var(--color-amber-border)', color: 'var(--color-amber)' }}>
              <span className="text-lg md:text-xl mt-0.5">{feedback.type === 'success' ? '✨' : '💡'}</span>
              <div>
                <p className="font-semibold text-sm md:text-base">{feedback.message}</p>
                {showExplanation && <p className="mt-1.5 text-xs md:text-sm leading-relaxed opacity-90">{question.explanation}</p>}
              </div>
            </div>
          )}
        </section>

        {/* Next button */}
        {showExplanation && (
          <div className="flex justify-center anim-fade-up px-4">
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 px-8 md:px-12 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg text-white shadow-lifted squishy-btn transition-all"
              style={{ background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(76,100,85,0.3)' }}>
              <span>{currentQuestionIndex === quizResult.questions.length - 1 ? t.quiz_btn_finish : t.quiz_btn_next}</span>
              <span className="material-symbols-outlined text-lg md:text-xl">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-10">
          <p className="text-xs" style={{ color: 'var(--color-text-subtle)', fontFamily: 'var(--font-heading)' }}>
            © 2024 Smart Step Learning Assistant • {t.footer_tagline}
          </p>
        </footer>
      </main>
    </div>
  )
}
