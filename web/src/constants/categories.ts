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

import type { CategorySlug, PaymentMethod } from '../types'

/**
 * 分类以英文 slug 入库，中文名 / 图标 / 颜色只活在前端。
 * 以后改文案或换图标，不需要动任何历史数据。
 */
export interface CategoryMeta {
  slug: CategorySlug
  label: string
  icon: LucideIcon
  /** 分类圆形图标的底色。因为要动态取值，用 inline style 而非 Tailwind 类名。 */
  color: string
}

export const CATEGORIES: CategoryMeta[] = [
  { slug: 'food', label: 'Food', icon: UtensilsCrossed, color: '#FF6B35' },
  { slug: 'transport', label: 'Transport', icon: Bus, color: '#0EA5E9' },
  { slug: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#EC4899' },
  { slug: 'entertainment', label: 'Leisure', icon: Gamepad2, color: '#A855F7' },
  { slug: 'housing', label: 'Home', icon: House, color: '#14B8A6' },
  { slug: 'medical', label: 'Health', icon: Pill, color: '#EF4444' },
  { slug: 'other', label: 'Other', icon: Ellipsis, color: '#78716C' },
]

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
