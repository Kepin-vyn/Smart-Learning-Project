export interface MicroStep {
  id: string
  stepNumber: number
  title: string
  content: string
}

export interface ProcessResult {
  steps: MicroStep[]
  totalSteps: number
  language: string
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  ok: boolean
}

export type DifficultyLevel = 'easy' | 'normal' | 'hard'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  hint: string
  explanation: string
}

export interface QuizResult {
  questions: QuizQuestion[]
  difficulty?: DifficultyLevel
}

export interface SessionRecord {
  id: string
  date: string // ISO 8601
  topic: string // first few words of the input material
  score: number // 0-100
  totalSteps: number
  difficulty: DifficultyLevel
  missedQuestions: Array<{ question: string; correctAnswer: string; explanation: string }>
  status: 'lulus' | 'perlu-review'
}

