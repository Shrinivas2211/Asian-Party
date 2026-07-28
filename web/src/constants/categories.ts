import {
  Bus,
  Ellipsis,
  Gamepad2,
  House,
  Pill,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

import { mix, readableOn } from '../lib/color'
import type { CategorySlug, PaymentMethod } from '../types'

/** 图标压暗时混向的深色，和 --fg 同源 */
const INK = '#14213D'

/**
 * 分类以英文 slug 入库，中文名 / 图标 / 颜色只活在前端。
 * 以后改文案或换图标，不需要动任何历史数据。
 */
export interface CategoryMeta {
  slug: CategorySlug
  label: string
  icon: LucideIcon
  /** 图表色块、实心圆点的底色。因为要动态取值，用 inline style 而非 Tailwind 类名。 */
  color: string
  /** 压在 16% 浅底上的图标色。由 color 算出来，保证 ≥4.5 对比。 */
  ink: string
  /** 压在实色圆上的字形色，黑白里挑对比高的那个。 */
  glyph: string
}

// 绿 → 青 → 蓝 → navy 一个家族，外加一个暖色留给 Health。
// 同色系更像一套设计而不是一堆随机色块，但七个分类全挤在一个色相里会分不清，
// 所以靠明度拉开距离，并且让 Health 跳出色系 —— 医疗用暖色是通行的认知。
export const CATEGORIES: CategoryMeta[] = [
  { slug: 'food', label: 'Food', icon: UtensilsCrossed, color: '#2EBD86', ink: '', glyph: '' },
  { slug: 'transport', label: 'Transport', icon: Bus, color: '#1B7F6B', ink: '', glyph: '' },
  { slug: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#7FDCBB', ink: '', glyph: '' },
  { slug: 'entertainment', label: 'Leisure', icon: Gamepad2, color: '#4E8FC8', ink: '', glyph: '' },
  { slug: 'housing', label: 'Home', icon: House, color: '#1E2D4F', ink: '', glyph: '' },
  { slug: 'medical', label: 'Health', icon: Pill, color: '#E8837D', ink: '', glyph: '' },
  { slug: 'other', label: 'Other', icon: Ellipsis, color: '#A8B2C1', ink: '', glyph: '' },
]

// 分类色是可以随手改的数据，图标色跟着算，不靠人肉挑 —— 否则加一个浅色分类
// 就会悄悄多出一个看不清的图标。
for (const c of CATEGORIES) {
  c.ink = mix(c.color, INK, 0.6)
  c.glyph = readableOn(c.color, INK, '#FFFFFF')
}

const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]))

/** 查不到时回退到「其他」，避免历史数据或模型返回意外值时整页崩掉。 */
export function getCategory(slug: string | null | undefined): CategoryMeta {
  return (slug && CATEGORY_BY_SLUG.get(slug as CategorySlug)) || CATEGORY_BY_SLUG.get('other')!
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'debit_card', label: 'Debit card' },
  { value: 'other', label: 'Other' },
]

export function getPaymentLabel(value: string | null | undefined): string | null {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? null
}
