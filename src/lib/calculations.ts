import { UserProfile, MealEntry, ExerciseEntry } from '../types'

export function calcBMI(weight: number, heightCm: number): number {
  return weight / (heightCm / 100) ** 2
}

export function bmiStatus(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: '體重過輕', color: 'text-blue-500' }
  if (bmi < 24) return { label: '體重正常', color: 'text-green-500' }
  if (bmi < 27) return { label: '體重過重', color: 'text-yellow-500' }
  if (bmi < 30) return { label: '輕度肥胖', color: 'text-orange-500' }
  return { label: '中重度肥胖', color: 'text-red-500' }
}

export function calcBMR(profile: UserProfile): number {
  // Mifflin-St Jeor
  if (profile.gender === 'male') {
    return 10 * profile.currentWeight + 6.25 * profile.height - 5 * profile.age + 5
  }
  return 10 * profile.currentWeight + 6.25 * profile.height - 5 * profile.age - 161
}

export function calcTDEE(profile: UserProfile): number {
  const bmr = calcBMR(profile)
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }
  return bmr * multipliers[profile.activityLevel]
}

export function calcDietScore(
  meals: MealEntry[],
  calorieGoal: number,
  exercises: ExerciseEntry[]
): number {
  let score = 0
  const totalCal = meals.reduce((s, m) => s + m.totalCalories, 0)

  // Calorie compliance (40 pts)
  if (totalCal > 0) {
    const ratio = totalCal / calorieGoal
    if (ratio >= 0.85 && ratio <= 1.15) score += 40
    else if (ratio >= 0.7 && ratio <= 1.3) score += 25
    else if (ratio >= 0.5 && ratio <= 1.5) score += 15
  }

  // Meal count (35 pts) - 3 main meals is ideal
  const mealTypes = new Set(meals.map((m) => m.type))
  if (mealTypes.has('breakfast')) score += 10
  if (mealTypes.has('lunch')) score += 10
  if (mealTypes.has('dinner')) score += 10
  if (mealTypes.has('snack') && totalCal < calorieGoal * 1.1) score += 5

  // Exercise bonus (25 pts)
  const totalExerciseMin = exercises.reduce((s, e) => s + e.duration, 0)
  if (totalExerciseMin >= 30) score += 25
  else if (totalExerciseMin >= 15) score += 15
  else if (totalExerciseMin > 0) score += 8

  return Math.min(score, 100)
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: '優秀 🌟', color: 'text-green-600' }
  if (score >= 75) return { label: '良好 👍', color: 'text-green-500' }
  if (score >= 60) return { label: '尚可 😊', color: 'text-yellow-500' }
  if (score >= 40) return { label: '需改善 😅', color: 'text-orange-500' }
  return { label: '加油 💪', color: 'text-red-500' }
}

export function predictWeeksToGoal(
  currentWeight: number,
  targetWeight: number,
  weeklyRate: number // kg per week (negative = losing)
): number | null {
  if (weeklyRate >= 0) return null
  const diff = currentWeight - targetWeight
  if (diff <= 0) return 0
  return Math.ceil(diff / Math.abs(weeklyRate))
}

export function calcWeeklyRate(weightEntries: { date: string; weight: number }[]): number | null {
  if (weightEntries.length < 2) return null
  const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const daysDiff =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)
  if (daysDiff === 0) return null
  const totalChange = last.weight - first.weight
  return (totalChange / daysDiff) * 7
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function activityLabel(level: UserProfile['activityLevel']): string {
  const labels = {
    sedentary: '久坐不動',
    light: '輕度活動（每週 1-3 天）',
    moderate: '中度活動（每週 3-5 天）',
    active: '高度活動（每週 6-7 天）',
    very_active: '非常活躍（體力工作）',
  }
  return labels[level]
}
