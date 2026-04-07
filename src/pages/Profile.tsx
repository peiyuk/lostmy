import { useState } from 'react'
import { useStore } from '../store'
import { UserProfile } from '../types'
import { calcBMI, calcTDEE, activityLabel } from '../lib/calculations'

export default function Profile() {
  const { profile, setProfile, weightEntries, meals, exercises } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<UserProfile>>(profile || {})

  if (!profile) return null

  const bmi = calcBMI(profile.currentWeight, profile.height)
  const tdee = calcTDEE(profile)

  const totalDays = weightEntries.length
  const totalMealDays = new Set(meals.map((m) => m.date)).size
  const totalExerciseDays = new Set(exercises.map((e) => e.date)).size
  const totalWeightLost = weightEntries.length >= 2
    ? (weightEntries[0].weight - profile.currentWeight).toFixed(1)
    : '0'

  const handleSave = () => {
    if (!form.name || !form.height || !form.currentWeight || !form.targetWeight) return
    const updated: UserProfile = {
      ...profile,
      ...form,
      height: +form.height!,
      currentWeight: +form.currentWeight!,
      targetWeight: +form.targetWeight!,
      age: +form.age!,
    }
    const newTdee = calcTDEE(updated)
    updated.dailyCalorieGoal = Math.round(newTdee - 500)
    setProfile(updated)
    setEditing(false)
  }

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-gray-800 mb-5">個人資料</h1>

      {/* Profile header */}
      <div className="card mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">
            {profile.gender === 'female' ? '👩' : '👨'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-indigo-100 text-sm">
              {profile.age} 歲 · {profile.gender === 'female' ? '女' : '男'} · {profile.height} cm
            </p>
            <p className="text-indigo-200 text-xs mt-1">
              BMI {bmi.toFixed(1)} · 每日目標 {profile.dailyCalorieGoal} 大卡
            </p>
          </div>
          <button
            onClick={() => { setForm(profile); setEditing(true) }}
            className="text-white/80 text-sm bg-white/20 px-3 py-1.5 rounded-xl"
          >
            編輯
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{totalWeightLost} kg</p>
          <p className="text-xs text-gray-400">已減輕體重</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-500">{totalDays}</p>
          <p className="text-xs text-gray-400">體重紀錄天數</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-500">{totalMealDays}</p>
          <p className="text-xs text-gray-400">飲食紀錄天數</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-indigo-500">{totalExerciseDays}</p>
          <p className="text-xs text-gray-400">運動天數</p>
        </div>
      </div>

      {/* Detail info */}
      <div className="card mb-4">
        <h3 className="section-title text-base">身體數據</h3>
        <div className="space-y-3">
          {[
            { label: '目前體重', value: `${profile.currentWeight} kg` },
            { label: '目標體重', value: `${profile.targetWeight} kg` },
            { label: '需減少', value: `${(profile.currentWeight - profile.targetWeight).toFixed(1)} kg`, highlight: true },
            { label: '基礎代謝率 (BMR)', value: `${Math.round(calcBMI(profile.currentWeight, profile.height) * 100) / 100}` },
            { label: '每日總消耗 (TDEE)', value: `${Math.round(tdee)} 大卡` },
            { label: '每日熱量目標', value: `${profile.dailyCalorieGoal} 大卡` },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{item.label}</span>
              <span className={`font-semibold ${item.highlight ? 'text-primary-600' : 'text-gray-700'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity level */}
      <div className="card mb-4">
        <h3 className="section-title text-base">活動程度</h3>
        <p className="text-sm text-gray-700">{activityLabel(profile.activityLevel)}</p>
      </div>

      {/* Start date */}
      <div className="card mb-4">
        <h3 className="section-title text-base">開始日期</h3>
        <p className="text-sm text-gray-700">{profile.startDate}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          已堅持 {Math.round((Date.now() - new Date(profile.startDate).getTime()) / (1000 * 60 * 60 * 24))} 天 💪
        </p>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-gray-800">編輯個人資料</h3>
              <button onClick={() => setEditing(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>
            <div className="px-5 py-4 space-y-4 pb-8">
              <div>
                <label className="label">姓名</label>
                <input className="input-field" value={form.name || ''} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">年齡</label>
                  <input className="input-field" type="number" value={form.age || ''} onChange={(e) => update('age', e.target.value)} />
                </div>
                <div>
                  <label className="label">身高 (cm)</label>
                  <input className="input-field" type="number" value={form.height || ''} onChange={(e) => update('height', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">目前體重 (kg)</label>
                  <input className="input-field" type="number" step="0.1" value={form.currentWeight || ''} onChange={(e) => update('currentWeight', e.target.value)} />
                </div>
                <div>
                  <label className="label">目標體重 (kg)</label>
                  <input className="input-field" type="number" step="0.1" value={form.targetWeight || ''} onChange={(e) => update('targetWeight', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">活動程度</label>
                <select className="select-field" value={form.activityLevel || 'light'} onChange={(e) => update('activityLevel', e.target.value)}>
                  {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map((l) => (
                    <option key={l} value={l}>{activityLabel(l)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">每日熱量目標 (大卡)</label>
                <input className="input-field" type="number" value={form.dailyCalorieGoal || ''} onChange={(e) => update('dailyCalorieGoal', e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">系統建議：{Math.round(calcTDEE({ ...profile, ...form, height: +(form.height || profile.height), age: +(form.age || profile.age), currentWeight: +(form.currentWeight || profile.currentWeight) } as UserProfile) - 500)} 大卡</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setEditing(false)} className="btn-secondary">取消</button>
                <button onClick={handleSave} className="btn-primary">儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
