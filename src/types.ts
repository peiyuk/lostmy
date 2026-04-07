export interface UserProfile {
  name: string
  gender: 'male' | 'female'
  age: number
  height: number // cm
  currentWeight: number // kg
  targetWeight: number // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  dailyCalorieGoal: number
  startDate: string
  targetDate?: string
}

export interface WeightEntry {
  id: string
  date: string // YYYY-MM-DD
  weight: number
  notes?: string
}

export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  amount: number
  unit: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealEntry {
  id: string
  date: string
  type: MealType
  foods: FoodItem[]
  totalCalories: number
  notes?: string
}

export type ExerciseIntensity = 'low' | 'medium' | 'high'

export interface ExerciseEntry {
  id: string
  date: string
  type: string
  duration: number // minutes
  intensity: ExerciseIntensity
  caloriesBurned: number
  notes?: string
}

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '點心',
}

export const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

export const INTENSITY_LABELS: Record<ExerciseIntensity, string> = {
  low: '低強度',
  medium: '中強度',
  high: '高強度',
}

export const COMMON_EXERCISES = [
  { name: '跑步', calPerMin: 10, emoji: '🏃' },
  { name: '游泳', calPerMin: 9, emoji: '🏊' },
  { name: '騎自行車', calPerMin: 7, emoji: '🚴' },
  { name: '健走', calPerMin: 4, emoji: '🚶' },
  { name: '重量訓練', calPerMin: 6, emoji: '🏋️' },
  { name: '瑜伽', calPerMin: 3, emoji: '🧘' },
  { name: 'HIIT', calPerMin: 12, emoji: '⚡' },
  { name: '跳繩', calPerMin: 11, emoji: '🪢' },
  { name: '有氧舞蹈', calPerMin: 7, emoji: '💃' },
  { name: '爬樓梯', calPerMin: 8, emoji: '🪜' },
]

export const COMMON_FOODS = [
  { name: '白飯 (1碗)', calories: 280, protein: 5, carbs: 62, fat: 0.5, amount: 200, unit: 'g' },
  { name: '地瓜 (1個)', calories: 130, protein: 2, carbs: 31, fat: 0.1, amount: 150, unit: 'g' },
  { name: '雞胸肉 (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6, amount: 100, unit: 'g' },
  { name: '雞蛋 (1顆)', calories: 70, protein: 6, carbs: 0.5, fat: 5, amount: 60, unit: 'g' },
  { name: '豆腐 (1塊)', calories: 80, protein: 8, carbs: 2, fat: 4, amount: 150, unit: 'g' },
  { name: '鮭魚 (100g)', calories: 208, protein: 20, carbs: 0, fat: 13, amount: 100, unit: 'g' },
  { name: '花椰菜 (1份)', calories: 55, protein: 4, carbs: 11, fat: 0.6, amount: 200, unit: 'g' },
  { name: '菠菜 (1份)', calories: 23, protein: 3, carbs: 3.6, fat: 0.4, amount: 100, unit: 'g' },
  { name: '蘋果 (1顆)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, amount: 182, unit: 'g' },
  { name: '香蕉 (1根)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, amount: 118, unit: 'g' },
  { name: '牛奶 (1杯)', calories: 148, protein: 8, carbs: 12, fat: 8, amount: 240, unit: 'ml' },
  { name: '優格 (1杯)', calories: 100, protein: 17, carbs: 6, fat: 0.7, amount: 170, unit: 'g' },
  { name: '燕麥片 (1份)', calories: 150, protein: 5, carbs: 27, fat: 3, amount: 40, unit: 'g' },
  { name: '全麥吐司 (1片)', calories: 69, protein: 3.6, carbs: 11.6, fat: 1, amount: 28, unit: 'g' },
  { name: '便當 (普通)', calories: 650, protein: 25, carbs: 85, fat: 20, amount: 400, unit: 'g' },
  { name: '拉麵 (1碗)', calories: 500, protein: 18, carbs: 65, fat: 18, amount: 500, unit: 'g' },
  { name: '珍珠奶茶 (大)', calories: 450, protein: 3, carbs: 80, fat: 12, amount: 700, unit: 'ml' },
  { name: '可樂 (1罐)', calories: 139, protein: 0, carbs: 39, fat: 0, amount: 330, unit: 'ml' },
]
