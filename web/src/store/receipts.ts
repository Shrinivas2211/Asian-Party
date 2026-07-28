import { create } from 'zustand'

import {
  createReceipt,
  deleteReceipt,
  listReceipts,
  updateReceipt,
  type SaveExtras,
} from '../lib/receipts'
import type { ReceiptDraft, ReceiptWithItems } from '../types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface SaveOptions extends SaveExtras {
  /** 传了就是改这一条，不传就是新增 */
  id?: string
}

interface ReceiptStore {
  receipts: ReceiptWithItems[]
  status: Status
  error: string | null

  /** 拉全量列表。重复调用安全 —— 并发的调用会共用同一个请求。 */
  load: () => Promise<void>
  /** 返回后 receipts 已经是最新的，页面可以直接跳走。 */
  save: (draft: ReceiptDraft, options?: SaveOptions) => Promise<void>
  remove: (id: string) => Promise<void>
}

// 放在 store 外面：StrictMode 下 effect 会跑两次，两个页面也可能同时挂载。
// 用 promise 而不是 boolean，是为了让后来的调用能 await 到同一个结果。
let inFlight: Promise<void> | null = null

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  receipts: [],
  status: 'idle',
  error: null,

  load() {
    if (inFlight) return inFlight

    // 只有首次才显示骨架屏。保存后的刷新不该让整页闪一下。
    if (get().status === 'idle') set({ status: 'loading' })

    inFlight = (async () => {
      try {
        set({ receipts: await listReceipts(), status: 'ready', error: null })
      } catch (e) {
        set({ status: 'error', error: (e as Error).message })
      } finally {
        inFlight = null
      }
    })()

    return inFlight
  },

  async save(draft, options = {}) {
    const { id, ...extras } = options
    if (id) await updateReceipt(id, draft)
    else await createReceipt(draft, extras)
    await get().load()
  },

  async remove(id) {
    await deleteReceipt(id)
    // 本地先摘掉，返回列表时不会看到已删的那条还在
    set({ receipts: get().receipts.filter((r) => r.id !== id) })
    await get().load()
  },
}))
