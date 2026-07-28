/** FastAPI 后端客户端。后端只负责调模型识别小票，记账数据一律走 supabase.ts。 */

import type { CategorySlug, PaymentMethod } from '../types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

/**
 * FastAPI 的 HTTPException 以 { detail: "..." } 返回，尽量把那句中文透给用户 ——
 * 「图片超过 10 MB」比「后端返回 413」有用得多。
 */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body?.detail === 'string') return body.detail
  } catch {
    // 网关直接返回的 502 / 504 响应体不是 JSON，忽略，走下面的兜底
  }
  return `Backend returned ${res.status}`
}

export interface HealthResponse {
  status: string
  /** 服务端填没填 key。不代表 key 有效 —— 那要等真的调一次才知道。 */
  ai_configured: boolean
  ai_model: string
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`)
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

// ---------------------------------------------------------------------------
// 小票识别
// ---------------------------------------------------------------------------

/** 与 api/app/schemas.py 的 RecognizedItem 对应 */
export interface RecognizedItem {
  item_name: string
  unit_price: number | null
  quantity: number | null
}

/** 与 api/app/schemas.py 的 RecognizedReceipt 对应。null = 没认出来，留给用户填。 */
export interface RecognizedReceipt {
  merchant: string | null
  date: string | null
  total_amount: number | null
  currency: string | null
  /** 后端用 enum 约束过，一定是合法 slug */
  category: CategorySlug
  payment_method: PaymentMethod | null
  items: RecognizedItem[]
}

export async function recognizeReceipt(
  file: File,
  signal?: AbortSignal,
): Promise<RecognizedReceipt> {
  const body = new FormData()
  body.append('file', file)

  // 不要手动设 Content-Type：multipart 的 boundary 只有浏览器算得出来
  const res = await fetch(`${BASE_URL}/api/recognize`, { method: 'POST', body, signal })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}
