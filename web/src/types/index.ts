/** 与数据库列一一对应的类型。改表结构时这里要同步改。 */

export type CategorySlug =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'housing'
  | 'medical'
  | 'other'

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'other'

/** receipts 表的一行 */
export interface Receipt {
  id: string
  user_id: string | null
  merchant: string | null
  /** ISO date，例如 2026-07-28 */
  date: string
  total_amount: number
  currency: string
  category: CategorySlug
  payment_method: PaymentMethod | null
  /** Storage 对象路径，不是 URL。手动记账为 null。 */
  image_path: string | null
  is_manual: boolean
  note: string | null
  created_at: string
  updated_at: string
}

/** receipt_items 表的一行 */
export interface ReceiptItem {
  id: string
  receipt_id: string
  item_name: string
  unit_price: number | null
  quantity: number | null
}

/** 列表页带出明细的形态 */
export interface ReceiptWithItems extends Receipt {
  receipt_items: ReceiptItem[]
}

/**
 * 表单里正在编辑的一笔账。
 *
 * 手动记账、识别后确认、编辑已有记录三个场景共用同一个表单组件，
 * 所以这里的字段全部允许「还没填」的中间态 —— 金额用 string 是因为
 * 用户输到一半可能是 "12." 这种还不能 parse 成 number 的状态。
 */
export interface ReceiptDraft {
  merchant: string
  date: string
  /** 原始输入文本，保存时才转 number */
  amountText: string
  currency: string
  category: CategorySlug | null
  paymentMethod: PaymentMethod | null
  note: string
  items: DraftItem[]
}

export interface DraftItem {
  item_name: string
  unit_price: string
  quantity: string
}
