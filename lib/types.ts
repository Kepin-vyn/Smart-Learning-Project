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

