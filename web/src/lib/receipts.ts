/**
 * receipts / receipt_items 的读写。
 *
 * 记账数据一律前端直连 Supabase（RLS 是防线），FastAPI 只管调模型识别小票。
 */

import { supabase } from './supabase'
import { BASE_CURRENCY, todayISO } from './format'
import type { RecognizedReceipt } from './api'
import type { DraftItem, ReceiptDraft, ReceiptWithItems } from '../types'

const WITH_ITEMS = '*, receipt_items(*)'
const BUCKET = 'receipts'

// ---------------------------------------------------------------------------
// 草稿 ↔ 数据行
// ---------------------------------------------------------------------------

export function emptyDraft(): ReceiptDraft {
  return {
    merchant: '',
    date: todayISO(),
    amountText: '',
    currency: BASE_CURRENCY,
    category: null,
    paymentMethod: null,
    note: '',
    items: [],
  }
}

export function draftFromReceipt(r: ReceiptWithItems): ReceiptDraft {
  return {
    merchant: r.merchant ?? '',
    date: r.date,
    amountText: r.total_amount.toFixed(2),
    currency: r.currency,
    category: r.category,
    paymentMethod: r.payment_method,
    note: r.note ?? '',
    items: r.receipt_items.map((i) => ({
      item_name: i.item_name,
      unit_price: i.unit_price?.toString() ?? '',
      quantity: i.quantity?.toString() ?? '',
    })),
  }
}

/**
 * 识别结果 → 表单草稿。
 *
 * 认不出来的字段留空让用户自己填，只有 date 例外 —— 空日期没法提交，
 * 默认今天比逼着用户点日历强。
 */
export function draftFromRecognition(r: RecognizedReceipt): ReceiptDraft {
  return {
    merchant: r.merchant ?? '',
    date: r.date ?? todayISO(),
    amountText: r.total_amount?.toFixed(2) ?? '',
    currency: r.currency ?? BASE_CURRENCY,
    category: r.category,
    paymentMethod: r.payment_method,
    note: '',
    items: r.items.map((i) => ({
      item_name: i.item_name,
      unit_price: i.unit_price?.toString() ?? '',
      quantity: i.quantity?.toString() ?? '',
    })),
  }
}

/** "12.5" → 12.5，"12." / "" / "abc" → null。存库前统一 round 到两位小数。 */
export function parseAmount(text: string): number | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100) / 100
}

/** 能存吗？返回 null 表示可以，否则是直接给用户看的中文提示。 */
export function draftError(d: ReceiptDraft): string | null {
  const amount = parseAmount(d.amountText)
  if (amount === null) return 'Enter an amount'
  // 对齐 schema 里的 check (total_amount > 0)，别等数据库报错
  if (amount <= 0) return 'Amount must be greater than 0'
  if (!d.category) return 'Pick a category'
  if (!d.date) return 'Pick a date'
  return null
}

/** 新建时的附加字段。编辑已有记录时不传，免得把 image_path 冲掉。 */
export interface SaveExtras {
  imagePath?: string | null
  isManual?: boolean
}

function toRow(d: ReceiptDraft, extras: SaveExtras) {
  return {
    merchant: d.merchant.trim() || null,
    date: d.date,
    total_amount: parseAmount(d.amountText)!,
    currency: d.currency,
    category: d.category!,
    payment_method: d.paymentMethod,
    note: d.note.trim() || null,
    ...(extras.imagePath !== undefined && { image_path: extras.imagePath }),
    ...(extras.isManual !== undefined && { is_manual: extras.isManual }),
  }
}

function toItemRows(receiptId: string, items: DraftItem[]) {
  return items
    .map((i) => ({ ...i, item_name: i.item_name.trim() }))
    .filter((i) => i.item_name) // 空行是用户点了「添加」又没填，直接丢掉
    .map((i) => ({
      receipt_id: receiptId,
      item_name: i.item_name,
      unit_price: parseAmount(i.unit_price),
      quantity: parseAmount(i.quantity),
    }))
}

async function insertItems(receiptId: string, items: DraftItem[]) {
  const rows = toItemRows(receiptId, items)
  if (!rows.length) return
  const { error } = await supabase.from('receipt_items').insert(rows)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listReceipts(): Promise<ReceiptWithItems[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select(WITH_ITEMS)
    // 同一天记的几笔按录入顺序倒序，最新记的在最上面
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ReceiptWithItems[]
}

export async function getReceipt(id: string): Promise<ReceiptWithItems> {
  const { data, error } = await supabase.from('receipts').select(WITH_ITEMS).eq('id', id).single()
  if (error) throw new Error(error.message)
  return data as ReceiptWithItems
}

export async function createReceipt(d: ReceiptDraft, extras: SaveExtras = {}): Promise<string> {
  const { data, error } = await supabase
    .from('receipts')
    .insert(toRow(d, { isManual: true, ...extras }))
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await insertItems(data.id, d.items)
  return data.id
}

export async function updateReceipt(id: string, d: ReceiptDraft): Promise<void> {
  const { error } = await supabase.from('receipts').update(toRow(d, {})).eq('id', id)
  if (error) throw new Error(error.message)

  // 明细行没有能跟表单一一对上的稳定 id，整体替换比 diff 省事得多，
  // 一张小票也就几十行。
  const { error: delError } = await supabase.from('receipt_items').delete().eq('receipt_id', id)
  if (delError) throw new Error(delError.message)

  await insertItems(id, d.items)
}

export async function deleteReceipt(id: string): Promise<void> {
  // receipt_items 有 on delete cascade，不用手动清
  const { error } = await supabase.from('receipts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// 小票原图（Storage）
// ---------------------------------------------------------------------------

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

/** 签名 URL 的有效期。展示用，过期了下次进页面会重新签。 */
const SIGNED_URL_TTL = 60 * 60

/**
 * 文件名用的随机串。
 *
 * 不能直接用 crypto.randomUUID() —— 它标了 [SecureContext]，手机连局域网
 * 走 http://192.168.x.x 调试时是 undefined，一拍照就 TypeError。
 * getRandomValues 没有这个限制，而这里只需要「不重名」，不需要 UUID 格式。
 */
function randomFileId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 和 bucket 的 file_size_limit 对齐（见 supabase/schema.sql 第 5 节）。 */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/**
 * supabase-js 把 fetch 的网络层失败原样透出来 —— Safari 说 "Load failed"，
 * Chrome 说 "Failed to fetch"。这两句话对用户没有任何指导意义，换成能照做的，
 * 原文留在括号里方便排查。
 */
function uploadErrorMessage(message: string): string {
  return /load failed|failed to fetch|networkerror|network request failed/i.test(message)
    ? `Photo upload failed — check your connection and try again (${message})`
    : `Photo upload failed: ${message}`
}

async function tryUpload(path: string, file: File, upsert: boolean): Promise<string | null> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    // file.type 为空时（某些相册来源）给个默认值，否则会被 bucket 的
    // allowed_mime_types 拒掉
    contentType: file.type || 'image/jpeg',
    upsert,
  })
  return error?.message ?? null
}

/**
 * 上传小票原图，返回 **对象路径**（不是 URL —— 私有 bucket 的签名 URL 会过期，
 * 存进库里没多久就失效了）。按年月分目录，纯粹是为了以后翻文件方便。
 */
export async function uploadReceiptImage(file: File): Promise<string> {
  // 超限的请求发出去多半是被中途掐断，报错会变成语焉不详的 "Load failed"。
  // 在本地就拦住，用户至少知道该怎么办。
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `This photo is ${(file.size / 1024 / 1024).toFixed(1)} MB and the limit is 10 MB — try a smaller one.`,
    )
  }

  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const extension = EXTENSION_BY_TYPE[file.type] ?? 'jpg'
  const path = `${now.getFullYear()}/${month}/${randomFileId()}.${extension}`

  const firstError = await tryUpload(path, file, false)
  if (!firstError) return path

  // 网络抖一下重来一次就好。必须 upsert —— 第一次有可能其实传成功了、只是
  // 响应没回来，那这个路径已经被占，不 upsert 会撞 409 Duplicate。
  await new Promise((resolve) => setTimeout(resolve, 800))
  const retryError = await tryUpload(path, file, true)
  if (!retryError) return path

  throw new Error(uploadErrorMessage(retryError))
}

/** 私有 bucket，展示时现算一个临时 URL。 */
export async function signedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
  if (error) throw new Error(error.message)
  return data.signedUrl
}
