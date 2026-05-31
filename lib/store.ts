import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProcessResult, MicroStep, QuizResult, DifficultyLevel } from './types'
import type { Lang } from './i18n'

export type PomodoroMode = 'study' | 'break' | 'idle'

interface LearningState {
  // Bahasa UI
  lang: Lang
  setLang: (lang: Lang) => void

  // Data materi yang sedang dipelajari
  result: ProcessResult | null
  quizResult: QuizResult | null
  
  // Progress belajar & Adaptive Difficulty
  currentStepIndex: number
  completedSteps: string[] // Array of completed step IDs
  difficulty: DifficultyLevel
  latestScore: number | null
  
  // Pomodoro
  pomodoroMode: PomodoroMode
  pomodoroEndTime: number | null
  studyDurationMinutes: number
  breakDurationMinutes: number
  isPomodoroRunning: boolean
  
  // Actions
  setResult: (result: ProcessResult) => void
  setQuizResult: (quizResult: QuizResult) => void
  setCurrentStep: (index: number) => void
  setDifficulty: (level: DifficultyLevel) => void
  setLatestScore: (score: number) => void
  markStepCompleted: (stepId: string) => void
  resetSession: () => void

  // Pomodoro Actions
  startPomodoro: (mode: 'study' | 'break') => void
  pausePomodoro: () => void
  stopPomodoro: () => void
  updatePomodoroDurations: (studyMin: number, breakMin: number) => void
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      lang: 'id' as Lang,
      setLang: (lang: Lang) => set({ lang }),

      result: null,
      quizResult: null,
      currentStepIndex: 0,
      completedSteps: [],
      difficulty: 'normal',
      latestScore: null,
      
      pomodoroMode: 'idle',
      pomodoroEndTime: null,
      studyDurationMinutes: 25,
      breakDurationMinutes: 5,
      isPomodoroRunning: false,
      
      setResult: (result) => set({ 
        result, 
        quizResult: null, // Reset quiz when new material is loaded
        currentStepIndex: 0, 
        completedSteps: [],
        latestScore: null
      }),

      setQuizResult: (quizResult) => set({ quizResult }),
      
      setCurrentStep: (index) => set({ currentStepIndex: index }),
      
      setDifficulty: (level) => set({ difficulty: level }),
      
      setLatestScore: (score) => set({ latestScore: score }),
      
      markStepCompleted: (stepId) => set((state) => ({
        completedSteps: state.completedSteps.includes(stepId) 
          ? state.completedSteps 
          : [...state.completedSteps, stepId]
      })),
      
      resetSession: () => set({
        result: null,
        quizResult: null,
        currentStepIndex: 0,
        completedSteps: [],
        latestScore: null
      }),

      startPomodoro: (mode) => set((state) => {
        const duration = mode === 'study' ? state.studyDurationMinutes : state.breakDurationMinutes
        return {
          pomodoroMode: mode,
          isPomodoroRunning: true,
          pomodoroEndTime: Date.now() + duration * 60 * 1000
        }
      }),
      
      pausePomodoro: () => set({ isPomodoroRunning: false, pomodoroEndTime: null }), // Simplification for MVP
      
      stopPomodoro: () => set({
        pomodoroMode: 'idle',
        isPomodoroRunning: false,
        pomodoroEndTime: null
      }),

      updatePomodoroDurations: (studyMin, breakMin) => set({
        studyDurationMinutes: studyMin,
        breakDurationMinutes: breakMin
      })
    }),
    {
      name: 'smart-step-storage', // name of the item in the storage (must be unique)
    }
  )
)
