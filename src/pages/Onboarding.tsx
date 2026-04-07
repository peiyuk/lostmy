import { useState } from 'react'
import { useStore } from '../store'
import { UserProfile } from '../types'
import { calcTDEE, activityLabel } from '../lib/calculations'

const steps = ['基本資料', '身體數據', '目標設定', '完成']

export default function Onboarding() {
  const setProfile = useStore((s) => s.setProfile)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    gender: 'female' as 'male' | 'female',
    age: '',
    height: '',
    currentWeight: '',
    targetWeight: '',
    activityLevel: 'light' as UserProfile['activityLevel'],
  })

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0 && form.age !== '' && +form.age > 0
    if (step === 1) return form.height !== '' && form.currentWeight !== '' && +form.height > 0 && +form.currentWeight > 0
    if (step === 2) return form.targetWeight !== '' && +form.targetWeight > 0
    return true
  }

  const handleFinish = () => {
    const profile: UserProfile = {
      name: form.name.trim(),
      gender: form.gender,
      age: +form.age,
      height: +form.height,
      currentWeight: +form.currentWeight,
      targetWeight: +form.targetWeight,
      activityLevel: form.activityLevel,
      dailyCalorieGoal: 0,
      startDate: new Date().toISOString().slice(0, 10),
    }
    const tdee = calcTDEE(profile)
    profile.dailyCalorieGoal = Math.round(tdee - 500)
    setProfile(profile)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-500 to-primary-600">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 text-white">
        <div className="text-4xl mb-2">🌱</div>
        <h1 className="text-2xl font-bold">歡迎使用 LostMy</h1>
        <p className="text-primary-100 text-sm mt-1">讓 AI 陪你一起達成目標體重！</p>
      </div>

      {/* Step indicator */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all ${i <= step ? 'bg-white' : 'bg-primary-400'}`}
            />
          ))}
        </div>
        <p className="text-primary-100 text-xs mt-2">{steps[step]}</p>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">你好！我是誰？</h2>
            <div>
              <label className="label">你的名字</label>
              <input
                className="input-field"
                placeholder="請輸入姓名或暱稱"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">性別</label>
              <div className="grid grid-cols-2 gap-3">
                {(['female', 'male'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => update('gender', g)}
                    className={`py-4 rounded-2xl border-2 text-center transition-all ${
                      form.gender === g
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <div className="text-3xl mb-1">{g === 'female' ? '👩' : '👨'}</div>
                    <div className="text-sm font-medium">{g === 'female' ? '女生' : '男生'}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">年齡</label>
              <input
                className="input-field"
                type="number"
                placeholder="歲"
                value={form.age}
                onChange={(e) => update('age', e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">身體數據</h2>
            <div>
              <label className="label">身高 (cm)</label>
              <input
                className="input-field"
                type="number"
                placeholder="例如：165"
                value={form.height}
                onChange={(e) => update('height', e.target.value)}
              />
            </div>
            <div>
              <label className="label">目前體重 (kg)</label>
              <input
                className="input-field"
                type="number"
                step="0.1"
                placeholder="例如：65.5"
                value={form.currentWeight}
                onChange={(e) => update('currentWeight', e.target.value)}
              />
            </div>
            <div>
              <label className="label">日常活動量</label>
              <select
                className="select-field"
                value={form.activityLevel}
                onChange={(e) => update('activityLevel', e.target.value)}
              >
                {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map((l) => (
                  <option key={l} value={l}>{activityLabel(l)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">設定目標</h2>
            <div>
              <label className="label">目標體重 (kg)</label>
              <input
                className="input-field"
                type="number"
                step="0.1"
                placeholder="例如：55.0"
                value={form.targetWeight}
                onChange={(e) => update('targetWeight', e.target.value)}
              />
            </div>
            {form.currentWeight && form.targetWeight && (
              <div className="bg-primary-50 rounded-2xl p-4">
                <p className="text-primary-700 text-sm font-medium">
                  需減少 {(+form.currentWeight - +form.targetWeight).toFixed(1)} kg
                </p>
                <p className="text-primary-600 text-xs mt-1">
                  以健康速度（每週 0.5kg）約需{' '}
                  {Math.ceil((+form.currentWeight - +form.targetWeight) / 0.5)} 週
                </p>
              </div>
            )}
            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-amber-700 text-xs">
                💡 系統會根據你的身體數據自動計算每日熱量目標（TDEE - 500大卡），幫助你健康穩定地減重。
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-5">
            <div className="text-6xl py-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800">準備好了！</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {form.name}，讓我們開始你的減肥旅程吧！
              <br />記錄每天的飲食和運動，AI 會幫你分析進度！
            </p>
            <div className="bg-primary-50 rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">目標體重</span>
                <span className="font-semibold text-primary-600">{form.targetWeight} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">需減少</span>
                <span className="font-semibold text-primary-600">
                  {(+form.currentWeight - +form.targetWeight).toFixed(1)} kg
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <button
            onClick={() => (step < steps.length - 1 ? setStep(step + 1) : handleFinish())}
            disabled={!canNext()}
            className={`btn-primary ${!canNext() ? 'opacity-40' : ''}`}
          >
            {step === steps.length - 1 ? '開始使用 🚀' : '下一步'}
          </button>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary">
              返回
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
