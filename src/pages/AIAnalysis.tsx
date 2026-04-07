import { useState, useRef } from 'react'
import { useStore } from '../store'
import { streamAnalysis } from '../api/claude'
import LoadingDots from '../components/LoadingDots'
import { todayStr } from '../lib/calculations'

type AnalysisType = 'weight_status' | 'diet_analysis' | 'progress_prediction' | 'exercise_advice' | 'custom'

const QUICK_OPTIONS: { type: AnalysisType; label: string; emoji: string; desc: string }[] = [
  { type: 'weight_status', label: '體重狀態分析', emoji: '⚖️', desc: 'BMI 分析 + 個人化建議' },
  { type: 'diet_analysis', label: '今日飲食分析', emoji: '🥗', desc: '飲食評分 + 明日菜單建議' },
  { type: 'progress_prediction', label: '減肥進度預測', emoji: '📊', desc: '達標日期 + 加速策略' },
  { type: 'exercise_advice', label: '運動建議', emoji: '💪', desc: '今日運動分析 + 明日計畫' },
]

export default function AIAnalysis() {
  const { profile, weightEntries, meals, exercises } = useStore()
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeType, setActiveType] = useState<AnalysisType | null>(null)
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const today = todayStr()
  const recentWeights = weightEntries.slice(-7)
  const todayMeals = meals.filter((m) => m.date === today)
  const todayExercises = exercises.filter((e) => e.date === today)

  const analyze = async (type: AnalysisType, q?: string) => {
    if (!profile) return
    setResult('')
    setError('')
    setLoading(true)
    setActiveType(type)

    const data = {
      profile,
      recentWeights,
      todayMeals,
      todayExercises,
      allMeals: meals.slice(-60),
      allExercises: exercises.slice(-30),
      question: q || question,
    }

    await streamAnalysis(
      { type, data: data as Record<string, unknown> },
      (chunk) => {
        setResult((prev) => prev + chunk)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50)
      },
      () => setLoading(false),
      (msg) => {
        setError(msg)
        setLoading(false)
      }
    )
  }

  const handleCustomQuestion = () => {
    if (!question.trim()) return
    analyze('custom')
  }

  if (!profile) return null

  return (
    <div className="page-container">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">AI 智能分析</h1>
        <p className="text-sm text-gray-400 mt-0.5">由 Claude AI 提供個人化健康建議</p>
      </div>

      {/* Quick analyze */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => analyze(opt.type)}
            disabled={loading}
            className={`card text-left transition-all active:scale-95 ${
              activeType === opt.type && !loading ? 'border-primary-300 bg-primary-50' : ''
            } ${loading ? 'opacity-50' : ''}`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <p className="text-sm font-semibold text-gray-800 mt-2">{opt.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Custom question */}
      <div className="card mb-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">🎤 問 AI 任何問題</p>
        <div className="flex gap-2">
          <input
            className="input-field flex-1 text-sm"
            placeholder="例如：我應該怎麼打破停滯期？"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomQuestion()}
            disabled={loading}
          />
          <button
            onClick={handleCustomQuestion}
            disabled={loading || !question.trim()}
            className="bg-purple-500 text-white px-4 rounded-xl disabled:opacity-40 font-medium"
          >
            問
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {['如何突破減肥停滯期？', '哪些食物最助減肥？', '什麼時間運動最好？'].map((q) => (
            <button
              key={q}
              onClick={() => { setQuestion(q); setTimeout(() => analyze('custom', q), 0) }}
              disabled={loading}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {(loading || result || error) && (
        <div className="card" ref={resultRef}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <span className="text-sm font-semibold text-gray-700">Claude AI 分析結果</span>
            {loading && <span className="text-xs text-gray-400">分析中...</span>}
          </div>

          {error ? (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-red-400 text-xs mt-1">
                請確認 .env 檔案中已設定 ANTHROPIC_API_KEY，並重新啟動伺服器。
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result}
              {loading && <LoadingDots />}
            </div>
          )}
        </div>
      )}

      {/* No activity reminder */}
      {!loading && !result && !error && (
        <div className="card text-center py-6">
          <p className="text-4xl mb-3">🤖</p>
          <p className="text-gray-600 font-medium">選擇分析類型</p>
          <p className="text-gray-400 text-sm mt-1">
            Claude AI 將根據你的實際數據
            <br />提供個人化健康建議
          </p>
          {todayMeals.length === 0 && (
            <p className="text-amber-600 text-xs mt-3 bg-amber-50 px-3 py-2 rounded-xl">
              💡 記錄今日飲食後，可獲得更精準的飲食分析
            </p>
          )}
        </div>
      )}
    </div>
  )
}
