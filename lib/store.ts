import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProcessResult, MicroStep, QuizResult } from './types'

interface LearningState {
  // Data materi yang sedang dipelajari
  result: ProcessResult | null
  quizResult: QuizResult | null
  
  // Progress belajar
  currentStepIndex: number
  completedSteps: string[] // Array of completed step IDs
  
  // Actions
  setResult: (result: ProcessResult) => void
  setQuizResult: (quizResult: QuizResult) => void
  setCurrentStep: (index: number) => void
  markStepCompleted: (stepId: string) => void
  resetSession: () => void
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      result: null,
      quizResult: null,
      currentStepIndex: 0,
      completedSteps: [],
      
      setResult: (result) => set({ 
        result, 
        quizResult: null, // Reset quiz when new material is loaded
        currentStepIndex: 0, 
        completedSteps: [] 
      }),

      setQuizResult: (quizResult) => set({ quizResult }),
      
      setCurrentStep: (index) => set({ currentStepIndex: index }),
      
      markStepCompleted: (stepId) => set((state) => ({
        completedSteps: state.completedSteps.includes(stepId) 
          ? state.completedSteps 
          : [...state.completedSteps, stepId]
      })),
      
      resetSession: () => set({
        result: null,
        quizResult: null,
        currentStepIndex: 0,
        completedSteps: []
      })
    }),
    {
      name: 'smart-step-storage', // name of the item in the storage (must be unique)
    }
  )
)
