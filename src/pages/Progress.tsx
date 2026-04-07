import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts'
import { useStore } from '../store'
import { calcWeeklyRate, predictWeeksToGoal } from '../lib/calculations'
import { format, subDays, parseISO } from 'date-fns'

export default function Progress() {
  const navigate = useNavigate()
  const { profile, weightEntries, meals, exercises } = useStore()

  // Last 30 days weight data
  const weightData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 30 }, (_, i) => {
      const d = format(subDays(today, 29 - i), 'yyyy-MM-dd')
      const entry = weightEntries.find((e) => e.date === d)
      return {
        date: format(subDays(today, 29 - i), 'MM/dd'),
        weight: entry?.weight ?? null,
      }
    }).filter((d) => d.weight !== null)
  }, [weightEntries])

  // Last 14 days calorie data
  const calorieData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(today, 13 - i), 'yyyy-MM-dd')
      const dayMeals = meals.filter((m) => m.date === d)
      const total = dayMeals.reduce((s, m) => s + m.totalCalories, 0)
      return {
        date: format(subDays(today, 13 - i), 'MM/dd'),
        calories: total || 0,
        goal: profile?.dailyCalorieGoal || 1500,
      }
    })
  }, [meals, profile])

  // Last 14 days exercise data
  const exerciseData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(today, 13 - i), 'yyyy-MM-dd')
      const dayEx = exercises.filter((e) => e.date === d)
      const mins = dayEx.reduce((s, e) => s + e.duration, 0)
      return {
        date: format(subDays(today, 13 - i), 'MM/dd'),
        minutes: mins,
      }
    })
  }, [exercises])

  const weeklyRate = calcWeeklyRate(weightEntries.slice(-14))
  const weeksToGoal = profile && weeklyRate && weeklyRate < 0
    ? predictWeeksToGoal(profile.currentWeight, profile.targetWeight, weeklyRate)
    : null

  const totalWeightLost = useMemo(() => {
    if (weightEntries.length < 2) return 0
    const first = weightEntries[0].weight
    const last = weightEntries[weightEntries.length - 1].weight
    return (first - last).toFixed(1)
  }, [weightEntries])

  const avgDailyCal = useMemo(() => {
    if (meals.length === 0) return 0
    const uniqueDays = new Set(meals.map((m) => m.date)).size
    const total = meals.reduce((s, m) => s + m.totalCalories, 0)
    return Math.round(total / Math.max(uniqueDays, 1))
  }, [meals])

  const totalExerciseDays = useMemo(() => {
    return new Set(exercises.map((e) => e.date)).size
  }, [exercises])

  if (!profile) return null

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">減肥進度</h1>
        <button
          onClick={() => navigate('/ai')}
          className="text-sm bg-purple-100 text-purple-600 px-3 py-1.5 rounded-xl font-medium"
        >
          🤖 AI 預測
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card">
          <p className="text-2xl font-bold text-primary-600">{totalWeightLost} kg</p>
          <p className="text-xs text-gray-400 mt-0.5">已減少體重</p>
        </div>
        <div className="card">
          <p className={`text-2xl font-bold ${weeklyRate && weeklyRate < 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {weeklyRate ? `${weeklyRate > 0 ? '+' : ''}${weeklyRate.toFixed(2)}` : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">kg/週（近期趨勢）</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-orange-500">{avgDailyCal}</p>
          <p className="text-xs text-gray-400 mt-0.5">大卡/天（平均攝取）</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-blue-500">{totalExerciseDays}</p>
          <p className="text-xs text-gray-400 mt-0.5">天有運動</p>
        </div>
      </div>

      {/* Prediction */}
      {weeksToGoal !== null && (
        <div className="card mb-5 bg-gradient-to-r from-primary-500 to-teal-400 text-white border-0">
          <p className="text-primary-100 text-sm">按目前進度</p>
          <p className="text-3xl font-bold mt-1">{weeksToGoal} 週</p>
          <p className="text-primary-100 text-sm">可達成目標體重</p>
          <p className="text-white/80 text-xs mt-2">
            每週減 {Math.abs(weeklyRate!).toFixed(2)} kg
            {Math.abs(weeklyRate!) >= 0.5 && Math.abs(weeklyRate!) <= 1
              ? ' ✅ 健康速度'
              : Math.abs(weeklyRate!) > 1
              ? ' ⚠️ 稍快，注意健康'
              : ' 💪 可加快一點'}
          </p>
        </div>
      )}

      {/* Weight chart */}
      <div className="card mb-4">
        <h3 className="section-title text-base">體重趨勢</h3>
        {weightData.length < 2 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            至少記錄 2 天體重才能顯示趨勢圖
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weightData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(val: number) => [`${val} kg`, '體重']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#22c55e"
                strokeWidth={2.5}
                fill="url(#weightGrad)"
                dot={{ fill: '#22c55e', r: 4 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Calorie chart */}
      <div className="card mb-4">
        <h3 className="section-title text-base">每日熱量（近 14 天）</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={calorieData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={1} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip
              formatter={(val: number, name: string) => [
                `${val} 大卡`,
                name === 'calories' ? '攝取' : '目標',
              ]}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="calories" fill="#fb923c" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="goal" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Exercise chart */}
      <div className="card mb-4">
        <h3 className="section-title text-base">每日運動（近 14 天）</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={exerciseData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={1} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip
              formatter={(val: number) => [`${val} 分鐘`, '運動時間']}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="minutes" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Goal progress */}
      <div className="card">
        <h3 className="section-title text-base">目標進度</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">起始體重</span>
              <span className="font-medium">{weightEntries[0]?.weight ?? profile.currentWeight} kg</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">目前體重</span>
              <span className="font-medium text-primary-600">{profile.currentWeight} kg</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">目標體重</span>
              <span className="font-medium text-green-600">{profile.targetWeight} kg</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0,
                    ((weightEntries[0]?.weight ?? profile.currentWeight) - profile.currentWeight) /
                    ((weightEntries[0]?.weight ?? profile.currentWeight) - profile.targetWeight) * 100
                  ))}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
