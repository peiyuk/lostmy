import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { calcBMI, bmiStatus, calcDietScore, scoreLabel, todayStr } from '../lib/calculations'
import { WeightEntry } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile, weightEntries, meals, exercises, addWeightEntry, updateCurrentWeight } = useStore()
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')

  const today = todayStr()
  const todayMeals = meals.filter((m) => m.date === today)
  const todayExercises = exercises.filter((e) => e.date === today)
  const todayCalories = todayMeals.reduce((s, m) => s + m.totalCalories, 0)
  const todayBurned = todayExercises.reduce((s, e) => s + e.caloriesBurned, 0)
  const netCalories = todayCalories - todayBurned

  const bmi = profile ? calcBMI(profile.currentWeight, profile.height) : 0
  const status = bmiStatus(bmi)
  const score = profile
    ? calcDietScore(todayMeals, profile.dailyCalorieGoal, todayExercises)
    : 0
  const scoreInfo = scoreLabel(score)

  const weightToGoal = profile
    ? (profile.currentWeight - profile.targetWeight).toFixed(1)
    : '0'

  const progressPercent = profile
    ? Math.min(
        100,
        Math.max(
          0,
          ((profile.currentWeight - (weightEntries[0]?.weight ?? profile.currentWeight)) /
            ((weightEntries[0]?.weight ?? profile.currentWeight) - profile.targetWeight)) *
            100
        )
      )
    : 0

  const handleLogWeight = () => {
    if (!newWeight || !profile) return
    const w = parseFloat(newWeight)
    if (isNaN(w) || w <= 0) return
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: today,
      weight: w,
    }
    addWeightEntry(entry)
    updateCurrentWeight(w)
    setNewWeight('')
    setShowWeightModal(false)
  }

  const caloriePercent = profile
    ? Math.min(100, (todayCalories / profile.dailyCalorieGoal) * 100)
    : 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return '早安'
    if (h < 18) return '午安'
    return '晚安'
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {greeting()}，{profile?.name} 👋
          </h1>
          <p className="text-sm text-gray-400">{today.replace(/-/g, '/')}</p>
        </div>
        <button
          onClick={() => navigate('/ai')}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-3 py-2 rounded-xl font-semibold"
        >
          🤖 AI 分析
        </button>
      </div>

      {/* Weight Card */}
      <div className="card mb-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-100 text-sm">目前體重</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-bold">{profile?.currentWeight.toFixed(1)}</span>
              <span className="text-primary-200">kg</span>
            </div>
            <p className="text-primary-100 text-sm mt-1">
              BMI {bmi.toFixed(1)} · <span className="text-white">{status.label}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-xs">距目標</p>
            <p className="text-2xl font-bold mt-1">{weightToGoal}</p>
            <p className="text-primary-200 text-xs">kg</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-primary-100 mb-1">
            <span>減重進度</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-primary-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowWeightModal(true)}
          className="mt-3 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          ＋ 記錄今日體重
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-500">{todayCalories}</p>
          <p className="text-xs text-gray-400 mt-0.5">攝取熱量</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-500">{todayBurned}</p>
          <p className="text-xs text-gray-400 mt-0.5">消耗熱量</p>
        </div>
        <div className="card text-center">
          <p className={`text-2xl font-bold ${netCalories > (profile?.dailyCalorieGoal ?? 1500) ? 'text-red-500' : 'text-green-500'}`}>
            {netCalories}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">淨熱量</p>
        </div>
      </div>

      {/* Calorie Progress */}
      {profile && (
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">今日熱量</span>
            <span className="text-sm text-gray-500">
              {todayCalories} / {profile.dailyCalorieGoal} 大卡
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                caloriePercent > 110 ? 'bg-red-400' : caloriePercent > 90 ? 'bg-orange-400' : 'bg-primary-400'
              }`}
              style={{ width: `${Math.min(caloriePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {caloriePercent > 110
              ? '⚠️ 超過今日目標'
              : caloriePercent > 90
              ? '✅ 接近目標，注意不要超過'
              : `還可攝取 ${profile.dailyCalorieGoal - todayCalories} 大卡`}
          </p>
        </div>
      )}

      {/* Diet Score */}
      {todayMeals.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">今日飲食評分</p>
              <p className={`text-2xl font-bold mt-1 ${scoreInfo.color}`}>{score} 分</p>
              <p className={`text-sm font-medium ${scoreInfo.color}`}>{scoreInfo.label}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-primary-100 flex items-center justify-center">
              <span className="text-2xl">{score >= 75 ? '😊' : score >= 50 ? '😐' : '😅'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Today's Activity */}
      <div className="card mb-4">
        <h3 className="section-title text-base">今日活動</h3>
        {todayMeals.length === 0 && todayExercises.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-3">
            今日還沒有紀錄，快去記錄吧！
          </p>
        ) : (
          <div className="space-y-2">
            {todayMeals.slice(0, 2).map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {m.type === 'breakfast' ? '🌅' : m.type === 'lunch' ? '☀️' : m.type === 'dinner' ? '🌙' : '🍎'}{' '}
                  {m.type === 'breakfast' ? '早餐' : m.type === 'lunch' ? '午餐' : m.type === 'dinner' ? '晚餐' : '點心'}
                </span>
                <span className="text-orange-500 font-medium">{m.totalCalories} 大卡</span>
              </div>
            ))}
            {todayExercises.slice(0, 1).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">💪 {e.type} {e.duration} 分鐘</span>
                <span className="text-blue-500 font-medium">-{e.caloriesBurned} 大卡</span>
              </div>
            ))}
            {(todayMeals.length + todayExercises.length > 3) && (
              <p className="text-xs text-gray-400 text-center">+更多紀錄</p>
            )}
          </div>
        )}
      </div>

      {/* Target Date Countdown */}
      {profile.targetDate && (
        <div className="card mb-4 border-l-4 border-primary-400">
          {(() => {
            const daysLeft = Math.ceil((new Date(profile.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const weightLeft = (profile.currentWeight - profile.targetWeight).toFixed(1)
            const dailyDeficit = daysLeft > 0
              ? Math.round((+weightLeft * 7700) / daysLeft)
              : 0
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">🎯 目標日期 {profile.targetDate}</p>
                  <p className="text-2xl font-bold text-primary-600 mt-0.5">還有 {daysLeft} 天</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    每日需減少 {dailyDeficit} 大卡才能達標
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-700">{weightLeft}</p>
                  <p className="text-xs text-gray-400">kg 待減</p>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/diet')}
          className="card flex items-center gap-3 active:scale-95 transition-transform"
        >
          <span className="text-2xl">🥗</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-700">記錄飲食</p>
            <p className="text-xs text-gray-400">新增餐點</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/exercise')}
          className="card flex items-center gap-3 active:scale-95 transition-transform"
        >
          <span className="text-2xl">🏃</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-700">記錄運動</p>
            <p className="text-xs text-gray-400">新增運動</p>
          </div>
        </button>
      </div>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowWeightModal(false)}>
          <div className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">記錄今日體重</h3>
            <div className="flex items-center gap-3">
              <input
                className="input-field flex-1"
                type="number"
                step="0.1"
                placeholder="輸入體重 (kg)"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                autoFocus
              />
              <span className="text-gray-500">kg</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => setShowWeightModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleLogWeight} className="btn-primary">
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
