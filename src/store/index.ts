import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserProfile, WeightEntry, MealEntry, ExerciseEntry } from '../types'

interface AppState {
  profile: UserProfile | null
  weightEntries: WeightEntry[]
  meals: MealEntry[]
  exercises: ExerciseEntry[]

  setProfile: (profile: UserProfile) => void
  updateCurrentWeight: (weight: number) => void
  addWeightEntry: (entry: WeightEntry) => void
  removeWeightEntry: (id: string) => void
  addMeal: (meal: MealEntry) => void
  removeMeal: (id: string) => void
  addExercise: (exercise: ExerciseEntry) => void
  removeExercise: (id: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      weightEntries: [],
      meals: [],
      exercises: [],

      setProfile: (profile) => set({ profile }),

      updateCurrentWeight: (weight) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, currentWeight: weight } : state.profile,
        })),

      addWeightEntry: (entry) =>
        set((state) => ({
          weightEntries: [
            ...state.weightEntries.filter((e) => e.date !== entry.date),
            entry,
          ].sort((a, b) => a.date.localeCompare(b.date)),
        })),

      removeWeightEntry: (id) =>
        set((state) => ({
          weightEntries: state.weightEntries.filter((e) => e.id !== id),
        })),

      addMeal: (meal) =>
        set((state) => ({ meals: [...state.meals, meal] })),

      removeMeal: (id) =>
        set((state) => ({ meals: state.meals.filter((m) => m.id !== id) })),

      addExercise: (exercise) =>
        set((state) => ({ exercises: [...state.exercises, exercise] })),

      removeExercise: (id) =>
        set((state) => ({ exercises: state.exercises.filter((e) => e.id !== id) })),
    }),
    { name: 'lostmy-storage' }
  )
)
