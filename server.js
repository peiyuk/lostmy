import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(cors())

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildPrompt(type, data) {
  const { profile, recentWeights, todayMeals, todayExercises, allMeals, allExercises, question } = data

  const bmi = profile ? (profile.currentWeight / ((profile.height / 100) ** 2)).toFixed(1) : null
  const weightDiff = profile ? (profile.currentWeight - profile.targetWeight).toFixed(1) : null

  const profileSummary = profile
    ? `使用者資料：姓名 ${profile.name}，性別 ${profile.gender === 'male' ? '男' : '女'}，年齡 ${profile.age} 歲，身高 ${profile.height} cm，目前體重 ${profile.currentWeight} kg，目標體重 ${profile.targetWeight} kg，每日熱量目標 ${profile.dailyCalorieGoal} 大卡，BMI ${bmi}，距離目標還需減少 ${weightDiff} kg。`
    : '無使用者資料。'

  switch (type) {
    case 'weight_status': {
      return `你是一位專業的健康顧問。請用繁體中文，以友善、鼓勵的口吻分析以下體重狀況，給出具體建議。

${profileSummary}

最近 7 天體重紀錄：${recentWeights?.map(w => `${w.date}: ${w.weight}kg`).join(', ') || '暫無紀錄'}

請分析：
1. BMI 狀態評估（過輕/正常/過重/肥胖）
2. 體重趨勢分析（上升/下降/持平）
3. 達成目標的可行性評估
4. 3 個具體改善建議
5. 一句鼓勵的話

請用簡潔易懂的方式回答，適合手機閱讀，每段不超過 3 句。`
    }

    case 'diet_analysis': {
      const totalCal = todayMeals?.reduce((s, m) => s + m.totalCalories, 0) || 0
      const mealCount = todayMeals?.length || 0
      const mealDetail = todayMeals?.map(m =>
        `${m.type === 'breakfast' ? '早餐' : m.type === 'lunch' ? '午餐' : m.type === 'dinner' ? '晚餐' : '點心'}(${m.totalCalories}大卡): ${m.foods.map(f => f.name).join('、')}`
      ).join('\n') || '今日尚無飲食紀錄'

      return `你是一位專業營養師。請用繁體中文分析今日飲食狀況。

${profileSummary}

今日飲食紀錄：
${mealDetail}
今日總熱量：${totalCal} 大卡（目標 ${profile?.dailyCalorieGoal || 1500} 大卡）
餐次：${mealCount} 餐

請給出：
1. 今日飲食評分（0-100分）及理由
2. 熱量攝取評估（不足/適當/超標）
3. 飲食結構分析（是否均衡）
4. 明日飲食建議（具體食物推薦）
5. 一個容易做到的改善小技巧

請用 emoji 讓回答更生動，適合手機閱讀。`
    }

    case 'progress_prediction': {
      const weights = recentWeights || []
      const avgCalories = allMeals?.length > 0
        ? (allMeals.reduce((s, m) => s + m.totalCalories, 0) / Math.max(allMeals.length / 3, 1)).toFixed(0)
        : profile?.dailyCalorieGoal || 1500
      const exerciseDays = allExercises?.length || 0

      let weightTrend = '無足夠數據'
      if (weights.length >= 3) {
        const first = weights[0].weight
        const last = weights[weights.length - 1].weight
        const diff = (last - first).toFixed(1)
        weightTrend = `過去 ${weights.length} 天體重變化：${diff > 0 ? '+' : ''}${diff} kg`
      }

      return `你是一位專業的減重教練和數據分析師。請用繁體中文預測減肥進度。

${profileSummary}
${weightTrend}
平均每日熱量攝取：${avgCalories} 大卡
運動紀錄天數：${exerciseDays} 天

請提供：
1. 按目前趨勢，預計達標時間（具體日期或週數）
2. 目前減重速度評估（每週減多少 kg）
3. 是否在健康減重範圍（0.5-1kg/週）
4. 加速達標的 3 個具體建議
5. 最佳預計達標日期（樂觀/中等/保守 三種情境）

請用繁體中文，條理清晰，加入激勵性語言。`
    }

    case 'exercise_advice': {
      const exerciseLog = todayExercises?.map(e =>
        `${e.type} ${e.duration}分鐘 (${e.intensity === 'high' ? '高強度' : e.intensity === 'medium' ? '中強度' : '低強度'}，消耗 ${e.caloriesBurned} 大卡)`
      ).join('\n') || '今日尚無運動紀錄'

      return `你是一位專業健身教練。請用繁體中文分析今日運動狀況並給出建議。

${profileSummary}

今日運動紀錄：
${exerciseLog}

請提供：
1. 今日運動量評估（不足/適當/充足）
2. 運動搭配飲食的效果分析
3. 推薦明日運動計畫（具體運動、時間、強度）
4. 針對目標體重的最佳運動策略
5. 一個增加運動動力的小技巧

請加入 emoji，讓回答更有趣，適合手機閱讀。`
    }

    case 'custom': {
      const weightHistory = recentWeights?.map(w => `${w.date}: ${w.weight}kg`).join(', ') || '無'
      const totalCal = todayMeals?.reduce((s, m) => s + m.totalCalories, 0) || 0

      return `你是一位專業的健康顧問、營養師和健身教練的綜合體。請用繁體中文回答以下問題。

使用者背景資料：
${profileSummary}
最近體重：${weightHistory}
今日熱量攝取：${totalCal} 大卡

使用者問題：${question}

請給出專業、具體、易執行的建議。回答要友善、有鼓勵性，適合手機閱讀（每段不超過 3 句）。`
    }

    default:
      return `請用繁體中文回答健康相關問題：${question}`
  }
}

app.post('/api/analyze', async (req, res) => {
  const { type, data } = req.body

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    const prompt = buildPrompt(type, data)

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('Claude API error:', err?.message || err)
    const msg = err?.message?.includes('credit') ? '帳號餘額不足，請至 console.anthropic.com 儲值。'
      : err?.message?.includes('API key') ? 'API 金鑰無效，請重新確認 .env 設定。'
      : `錯誤：${err?.message || '請稍後再試'}`
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})

// AI 智能解析飲食
app.post('/api/parse-diet', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: '請提供飲食描述' })

  const prompt = `你是一位專業營養師。請解析以下飲食描述，回傳結構化 JSON 資料。

飲食描述：
"""
${text}
"""

請回傳以下 JSON 格式（只回傳 JSON，不要加任何說明或 markdown）：
{
  "meals": [
    {
      "type": "breakfast 或 lunch 或 dinner 或 snack",
      "foods": [
        {
          "name": "食物名稱（繁體中文）",
          "calories": 預估熱量整數,
          "protein": 蛋白質公克整數,
          "carbs": 碳水公克整數,
          "fat": 脂肪公克整數,
          "amount": 1,
          "unit": "份"
        }
      ]
    }
  ]
}

規則：
- 請合理估計每道食物的熱量，寧可高估不要低估
- 飲料含糖量要計算進去
- 如有多個餐次請分開列出
- 沒有明確說早中晚的，根據常識判斷（例如 oat latte 通常是早餐）
- 食物名稱統一用繁體中文`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = message.content.find(b => b.type === 'text')?.text || '{}'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    res.json(parsed)
  } catch (err) {
    console.error('parse-diet error:', err)
    res.status(500).json({ error: '解析失敗，請重試' })
  }
})

// AI 智能解析運動
app.post('/api/parse-exercise', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: '請提供運動描述' })

  const prompt = `你是一位專業健身教練。請解析以下運動/活動描述，回傳結構化 JSON 資料。

運動描述：
"""
${text}
"""

請回傳以下 JSON 格式（只回傳 JSON，不要加任何說明或 markdown）：
{
  "exercises": [
    {
      "type": "運動名稱（繁體中文，例如：步行、跑步、騎自行車等）",
      "duration": 持續時間分鐘整數,
      "intensity": "low 或 medium 或 high",
      "caloriesBurned": 消耗熱量整數,
      "notes": "備註（可空字串）"
    }
  ]
}

規則：
- Apple Watch 的 Move 卡路里 = 主動消耗，可直接使用
- Exercise minutes 就是運動分鐘數
- 步數 10000步 ≈ 40分鐘健走 ≈ 300大卡
- 如果有明確的卡路里數字，優先使用那個數字
- 沒有明確運動類型時，根據數據推測（有步數就算健走）`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = message.content.find(b => b.type === 'text')?.text || '{}'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    res.json(parsed)
  } catch (err) {
    console.error('parse-exercise error:', err)
    res.status(500).json({ error: '解析失敗，請重試' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY not set. AI features will not work.')
  }
})
