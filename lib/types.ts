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
