interface AnalyzeRequest {
  type: 'weight_status' | 'diet_analysis' | 'progress_prediction' | 'exercise_advice' | 'custom'
  data: Record<string, unknown>
}

export async function streamAnalysis(
  request: AnalyzeRequest,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  try {
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!resp.ok) {
      onError('伺服器連線失敗，請確認 API 金鑰已設定。')
      return
    }

    const reader = resp.body?.getReader()
    if (!reader) {
      onError('無法讀取回應串流。')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') {
          onDone()
          return
        }
        try {
          const parsed = JSON.parse(payload)
          if (parsed.error) {
            onError(parsed.error)
            return
          }
          if (parsed.text) {
            onChunk(parsed.text)
          }
        } catch {
          // ignore malformed lines
        }
      }
    }

    onDone()
  } catch (err) {
    onError('網路連線錯誤，請確認伺服器正在執行。')
  }
}
