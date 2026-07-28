/**
 * 汇总、分类占比、月度趋势。
 *
 * 全是纯函数，输入就是 store 里那份 receipts 数组 —— 不再查库。记账这个量级
 * （个人一年几百条）在内存里算比多跑一趟网络快得多，也省掉一套缓存失效逻辑。
 *
 * 所有合计只累加本位币。不做汇率折算，混币相加是假数字；其余币种单独列出来提醒。
 */

import { getCategory } from '../constants/categories'
import { BASE_CURRENCY, todayISO } from './format'
import type { CategorySlug, ReceiptWithItems } from '../types'

/** 金额按分累加会攒出 0.1+0.2 那种尾巴，对外一律收到两位小数。 */
const round2 = (n: number) => Math.round(n * 100) / 100

/** '2026-07-28' → '2026-07' */
export function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

/**
 * 月份加减。'2026-01' 减 1 → '2025-12'。
 *
 * 不用 Date 做月份运算 —— `setMonth(-1)` 在 1 月 31 日这种日子上会跳到 3 月。
 * 换算成「总月数」再拆回来没有这个问题。
 */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const totalMonths = y * 12 + (m - 1) + delta
  const year = Math.floor(totalMonths / 12)
  const monthIndex = totalMonths - year * 12
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  // 下个月的第 0 天 = 这个月最后一天
  return new Date(y, m, 0).getDate()
}

export interface CategoryTotal {
  slug: CategorySlug
  label: string
  color: string
  total: number
  count: number
  /** 占本月合计的比例，0–1。合计为 0 时给 0，不会是 NaN。 */
  share: number
}

export interface MonthSummary {
  month: string
  total: number
  /** 本月记录数，含未计入合计的外币那几笔 */
  count: number
  categories: CategoryTotal[]
  /** 本月出现过、但没进 total 的币种 */
  foreignCurrencies: string[]
  /** 上月合计。上月一条本位币记录都没有时为 null。 */
  previousTotal: number | null
  /** 环比变化。上月为 null 或 0 时为 null —— 除以 0 得不出有意义的百分比。 */
  changeRatio: number | null
  /** 日均。当月按已过天数算，往月按整月天数算，否则月初的日均会虚高。 */
  dailyAverage: number
  topMerchant: { name: string; total: number } | null
}

function sum(receipts: ReceiptWithItems[]): number {
  return receipts.reduce((acc, r) => acc + r.total_amount, 0)
}

function baseCurrencyIn(receipts: ReceiptWithItems[], month: string): ReceiptWithItems[] {
  return receipts.filter((r) => monthOf(r.date) === month && r.currency === BASE_CURRENCY)
}

export function summarizeMonth(
  receipts: ReceiptWithItems[],
  month: string = monthOf(todayISO()),
): MonthSummary {
  const inMonth = receipts.filter((r) => monthOf(r.date) === month)
  const base = inMonth.filter((r) => r.currency === BASE_CURRENCY)
  const total = round2(sum(base))

  const byCategory = new Map<CategorySlug, { total: number; count: number }>()
  for (const r of base) {
    // 按 getCategory 解析后的 slug 聚合，而不是库里的原始值 —— 万一存进过
    // 未知分类，它们会一起归到 other，而不是冒出好几条都叫 Other 的记录。
    const { slug } = getCategory(r.category)
    const entry = byCategory.get(slug) ?? { total: 0, count: 0 }
    entry.total += r.total_amount
    entry.count += 1
    byCategory.set(slug, entry)
  }

  const categories: CategoryTotal[] = [...byCategory.entries()]
    .map(([slug, v]) => {
      const meta = getCategory(slug)
      return {
        slug,
        label: meta.label,
        color: meta.color,
        total: round2(v.total),
        count: v.count,
        share: total > 0 ? v.total / total : 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  const previousRows = baseCurrencyIn(receipts, shiftMonth(month, -1))
  const previousTotal = previousRows.length ? round2(sum(previousRows)) : null

  const today = todayISO()
  const elapsedDays =
    month === monthOf(today) ? Number(today.slice(8, 10)) : daysInMonth(month)

  const byMerchant = new Map<string, number>()
  for (const r of base) {
    const name = r.merchant?.trim()
    if (!name) continue
    byMerchant.set(name, (byMerchant.get(name) ?? 0) + r.total_amount)
  }
  const top = [...byMerchant.entries()].sort((a, b) => b[1] - a[1])[0]

  return {
    month,
    total,
    count: inMonth.length,
    categories,
    foreignCurrencies: [
      ...new Set(inMonth.filter((r) => r.currency !== BASE_CURRENCY).map((r) => r.currency)),
    ].sort(),
    previousTotal,
    changeRatio:
      previousTotal !== null && previousTotal > 0 ? (total - previousTotal) / previousTotal : null,
    dailyAverage: elapsedDays > 0 ? round2(total / elapsedDays) : 0,
    topMerchant: top ? { name: top[0], total: round2(top[1]) } : null,
  }
}

export interface TrendPoint {
  month: string
  total: number
}

/** 截至 endMonth 的最近 count 个月，从旧到新。没有记录的月份补 0，趋势才连得起来。 */
export function monthlyTrend(
  receipts: ReceiptWithItems[],
  endMonth: string = monthOf(todayISO()),
  count = 6,
): TrendPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const month = shiftMonth(endMonth, i - count + 1)
    return { month, total: round2(sum(baseCurrencyIn(receipts, month))) }
  })
}

/** 有记录的月份，从新到旧。月份切换器用它决定「上一月 / 下一月」还能不能点。 */
export function monthsWithData(receipts: ReceiptWithItems[]): string[] {
  return [...new Set(receipts.map((r) => monthOf(r.date)))].sort().reverse()
}
