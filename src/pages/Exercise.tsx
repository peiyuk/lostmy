import { useState } from 'react'
import { useStore } from '../store'
import { ExerciseEntry, ExerciseIntensity, INTENSITY_LABELS, COMMON_EXERCISES } from '../types'
import { todayStr } from '../lib/calculations'

export default function Exercise() {
  const { exercises, addExercise, removeExercise } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [viewDate, setViewDate] = useState(todayStr())
  const [form, setForm] = useState({
    type: '',
    customType: '',
    duration: '',
    intensity: 'medium' as ExerciseIntensity,
    caloriesBurned: '',
    notes: '',
  })
  const [useCustom, setUseCustom] = useState(false)

  const today = todayStr()
  const dateExercises = exercises.filter((e) => e.date === viewDate)
  const totalBurned = dateExercises.reduce((s, e) => s + e.caloriesBurned, 0)
  const totalMinutes = dateExercises.reduce((s, e) => s + e.duration, 0)

  const selectedExercise = COMMON_EXERCISES.find((e) => e.name === form.type)
  const estimatedCal = selectedExercise && form.duration
    ? Math.round(selectedExercise.calPerMin * +form.duration * (form.intensity === 'high' ? 1.3 : form.intensity === 'low' ? 0.7 : 1))
    : 0

  const handleSelectExercise = (name: string) => {
    setForm((f) => ({ ...f, type: name }))
    setUseCustom(false)
  }

  const handleSave = () => {
    const typeName = useCustom ? form.customType : form.type
    if (!typeName || !form.duration) return

    const cal = form.caloriesBurned
      ? +form.caloriesBurned
      : estimatedCal || Math.round(+form.duration * 6)

    const entry: ExerciseEntry = {
      id: Date.now().toString(),
      date: viewDate,
      type: typeName,
      duration: +form.duration,
      intensity: form.intensity,
      caloriesBurned: cal,
      notes: form.notes,
    }
    addExercise(entry)
    setForm({ type: '', customType: '', duration: '', intensity: 'medium', caloriesBurned: '', notes: '' })
    setShowModal(false)
  }

  const canSave = (useCustom ? form.customType : form.type) && form.duration

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">運動紀錄</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) })}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          >‹</button>
          <span className="text-sm text-gray-500 self-center">
            {viewDate === today ? '今天' : viewDate.slice(5).replace('-', '/')}
          </span>
          <button
            onClick={() => setViewDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })}
            disabled={viewDate >= today}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 disabled:opacity-30"
          >›</button>
        </div>
      </div>

      {/* Summary card */}
      <div className="card mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
        <div className="flex justify-between">
          <div>
            <p className="text-blue-100 text-sm">消耗熱量</p>
            <p className="text-3xl font-bold">{totalBurned}</p>
            <p className="text-blue-100 text-xs">大卡</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">運動時間</p>
            <p className="text-3xl font-bold">{totalMinutes}</p>
            <p className="text-blue-100 text-xs">分鐘</p>
          </div>
        </div>
        {totalMinutes > 0 && (
          <div className="mt-3 bg-white/20 rounded-xl px-3 py-2 text-sm">
            {totalMinutes >= 30 ? '🏆 達成今日運動目標！' : `還差 ${30 - totalMinutes} 分鐘達成目標`}
          </div>
        )}
      </div>

      {/* Exercise list */}
      {dateExercises.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">🏃</p>
          <p className="text-gray-500 text-sm">今日還沒有運動紀錄</p>
          <p className="text-gray-400 text-xs mt-1">每天 30 分鐘，健康每一天！</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {dateExercises.map((e) => {
            const ex = COMMON_EXERCISES.find((c) => c.name === e.type)
            return (
              <div key={e.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
                      {ex?.emoji || '🏃'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{e.type}</p>
                      <p className="text-sm text-gray-400">
                        {e.duration} 分鐘 · {INTENSITY_LABELS[e.intensity]}
                      </p>
                      {e.notes && <p className="text-xs text-gray-400">{e.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-500">-{e.caloriesBurned}</p>
                      <p className="text-xs text-gray-400">大卡</p>
                    </div>
                    <button onClick={() => removeExercise(e.id)} className="text-gray-300 text-xl">×</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button onClick={() => setShowModal(true)} className="btn-primary">
        ＋ 新增運動
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-gray-800">💪 新增運動</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>

            <div className="px-5 py-4 space-y-4 pb-8">
              {/* Exercise type selection */}
              <div>
                <p className="label">選擇運動項目</p>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_EXERCISES.map((ex) => (
                    <button
                      key={ex.name}
                      onClick={() => handleSelectExercise(ex.name)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                        form.type === ex.name && !useCustom
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-gray-100 text-gray-600'
                      }`}
                    >
                      <span>{ex.emoji}</span>
                      <span>{ex.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => { setUseCustom(true); setForm(f => ({ ...f, type: '' })) }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                      useCustom ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600'
                    }`}
                  >
                    <span>✏️</span>
                    <span>自訂</span>
                  </button>
                </div>
              </div>

              {useCustom && (
                <input
                  className="input-field"
                  placeholder="輸入運動名稱"
                  value={form.customType}
                  onChange={(e) => setForm(f => ({ ...f, customType: e.target.value }))}
                />
              )}

              {/* Duration */}
              <div>
                <label className="label">運動時間（分鐘）</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="例如：30"
                  value={form.duration}
                  onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))}
                />
              </div>

              {/* Intensity */}
              <div>
                <label className="label">運動強度</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as ExerciseIntensity[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setForm(f => ({ ...f, intensity: level }))}
                      className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.intensity === level
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      {level === 'low' ? '🚶 ' : level === 'medium' ? '🏃 ' : '⚡ '}
                      {INTENSITY_LABELS[level]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calorie estimate */}
              {estimatedCal > 0 && !form.caloriesBurned && (
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                  <p className="text-blue-700 text-sm">預估消耗：<strong>{estimatedCal} 大卡</strong></p>
                  <p className="text-blue-500 text-xs mt-0.5">可在下方自行填寫實際數值</p>
                </div>
              )}

              {/* Custom calories */}
              <div>
                <label className="label">實際消耗熱量（選填，留空使用預估值）</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder={estimatedCal > 0 ? `預估 ${estimatedCal} 大卡` : '輸入消耗大卡'}
                  value={form.caloriesBurned}
                  onChange={(e) => setForm(f => ({ ...f, caloriesBurned: e.target.value }))}
                />
              </div>

              {/* Notes */}
              <input
                className="input-field"
                placeholder="備註（選填）"
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              />

              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`btn-primary ${!canSave ? 'opacity-40' : ''}`}
              >
                儲存運動
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
