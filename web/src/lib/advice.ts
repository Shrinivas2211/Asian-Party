/**
 * 从账目里推出「值得你知道的事」。
 *
 * 全部由确定性规则算出，不经过模型 —— 关于别人钱的结论必须是可复现、可核对的。
 * 模型编一个「你餐饮涨了 43%」出来，比不给建议糟糕得多。
 *
 * 每条规则要么给出一个有数字支撑的结论，要么什么都不给。数据不够时宁可沉默，
 * 也不要凑一句正确的废话。
 */

import { monthOf, monthlyTrend, shiftMonth, summarizeMonth } from './analytics'
import { BASE_CURRENCY, formatAmount, formatMonth, formatPercent, todayISO } from './format'
import type { ReceiptWithItems } from '../types'

export type InsightTone = 'warning' | 'positive' | 'neutral'

export interface Insight {
  id: string
  tone: InsightTone
  /** 一句话结论 */
  title: string
  /** 支撑结论的数字。用户要能照着这句话去账本里核对。 */
  detail: string
  /** 建议做什么。没有真正可做的事就别写 —— 空洞的建议会稀释有用的那几条。 */
  action?: string
}

/** 一次最多显示几条。再多就没人看了，反而把最重要的那条淹掉。 */
const MAX_INSIGHTS = 4

const round2 = (n: number) => Math.round(n * 100) / 100

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function baseRows(receipts: ReceiptWithItems[], month: string) {
  return receipts.filter((r) => monthOf(r.date) === month && r.currency === BASE_CURRENCY)
}

// ---------------------------------------------------------------------------
// 规则
// ---------------------------------------------------------------------------

/**
 * 按当前速度，这个月会花到多少。
 *
 * 只对当月有意义 —— 已经过完的月份没有「还剩几天」可言。
 */
function projection(receipts: ReceiptWithItems[], month: string): Insight | null {
  if (month !== monthOf(todayISO())) return null

  const rows = baseRows(receipts, month)
  const elapsed = Number(todayISO().slice(8, 10))
  const total = round2(rows.reduce((s, r) => s + r.total_amount, 0))

  // 月初头几天的日均没有参考价值，样本太少会给出荒唐的年化
  if (rows.length < 3 || elapsed < 5 || total <= 0) return null

  const days = daysInMonth(month)
  const remaining = days - elapsed
  if (remaining <= 0) return null

  const projected = round2((total / elapsed) * days)
  const previous = summarizeMonth(receipts, month).previousTotal

  if (previous === null) {
    return {
      id: 'projection',
      tone: 'neutral',
      title: `On track for about ${formatAmount(projected)} this month`,
      detail: `${formatAmount(round2(total / elapsed))} a day over ${elapsed} days so far`,
    }
  }

  const ratio = (projected - previous) / previous
  // ±8% 以内算持平 —— 预测本来就是外推，别把噪声说成趋势
  if (Math.abs(ratio) < 0.08) {
    return {
      id: 'projection',
      tone: 'positive',
      title: `On pace to match last month`,
      detail: `Heading for about ${formatAmount(projected)} vs ${formatAmount(previous)} in ${formatMonth(shiftMonth(month, -1))}`,
    }
  }

  if (ratio > 0) {
    // 要追平上月，剩下的日子每天还能花多少
    const budgetLeft = round2(previous - total)
    return {
      id: 'projection',
      tone: 'warning',
      title: `On track to overspend by ${formatPercent(ratio)}`,
      detail: `Heading for about ${formatAmount(projected)} vs ${formatAmount(previous)} last month`,
      action:
        budgetLeft > 0
          ? `Stay under ${formatAmount(round2(budgetLeft / remaining))} a day for the remaining ${remaining} days to match last month.`
          : `You have already passed last month's total with ${remaining} days to go.`,
    }
  }

  return {
    id: 'projection',
    tone: 'positive',
    title: `Spending ${formatPercent(Math.abs(ratio))} less than last month`,
    detail: `Heading for about ${formatAmount(projected)} vs ${formatAmount(previous)} in ${formatMonth(shiftMonth(month, -1))}`,
  }
}

/** 哪个分类涨得最多。看绝对值而不是百分比 —— 5 块涨到 10 块是 +100%，但不值得说。 */
function categorySurge(receipts: ReceiptWithItems[], month: string): Insight | null {
  const now = summarizeMonth(receipts, month)
  const prev = summarizeMonth(receipts, shiftMonth(month, -1))
  if (!now.categories.length || !prev.categories.length) return null

  const prevBySlug = new Map(prev.categories.map((c) => [c.slug, c.total]))

  let top: { label: string; delta: number; from: number; to: number } | null = null
  for (const c of now.categories) {
    const from = prevBySlug.get(c.slug) ?? 0
    const delta = round2(c.total - from)
    if (delta > (top?.delta ?? 0)) top = { label: c.label, delta, from, to: c.total }
  }

  // 涨幅要同时够大（占本月 10% 以上）才值得提，否则每个月都能挑出一条
  if (!top || top.delta <= 0 || top.delta < now.total * 0.1) return null

  return {
    id: 'category-surge',
    tone: 'warning',
    title:
      top.from > 0
        ? `${top.label} is up ${formatPercent(top.delta / top.from)} this month`
        : `${top.label} is new this month`,
    detail:
      top.from > 0
        ? `${formatAmount(top.to)} vs ${formatAmount(top.from)} last month, ${formatAmount(top.delta)} more`
        : `${formatAmount(top.to)}, nothing in this category last month`,
  }
}

/**
 * 每月都出现的商家 —— 订阅、房租、水电这类。
 *
 * 这是最值得看的一类支出：它们不请自来，而且一年累计起来很唬人。
 */
function recurring(receipts: ReceiptWithItems[], month: string): Insight | null {
  const WINDOW = 4
  const months = Array.from({ length: WINDOW }, (_, i) => shiftMonth(month, -i))

  const byMerchant = new Map<string, Map<string, number>>()
  for (const m of months) {
    for (const r of baseRows(receipts, m)) {
      const name = r.merchant?.trim()
      if (!name) continue
      const perMonth = byMerchant.get(name) ?? new Map<string, number>()
      perMonth.set(m, (perMonth.get(m) ?? 0) + r.total_amount)
      byMerchant.set(name, perMonth)
    }
  }

  const found: { name: string; typical: number }[] = []
  for (const [name, perMonth] of byMerchant) {
    // 四个月里至少出现三个月才算「每月都有」
    if (perMonth.size < 3) continue

    const amounts = [...perMonth.values()]
    const typical = median(amounts)
    if (typical <= 0) continue

    // 金额必须几乎一模一样。这是订阅和「每月都去的超市」之间唯一可靠的分界：
    // 房租水电订阅费每期同一个数，买菜每次都不一样。
    // 放宽到 ±25% 时，Trader Joe's 和 Chipotle 会被认成订阅，然后配上一句
    // 「不用也会自动续费」—— 那不是不准，是误导。
    if (amounts.some((a) => Math.abs(a - typical) > typical * 0.06)) continue

    found.push({ name, typical: round2(typical) })
  }

  if (!found.length) return null

  found.sort((a, b) => b.typical - a.typical)
  const monthly = round2(found.reduce((s, f) => s + f.typical, 0))
  const names = found.slice(0, 3).map((f) => f.name)

  return {
    id: 'recurring',
    tone: 'neutral',
    title: `${found.length} fixed ${found.length === 1 ? 'payment' : 'payments'} cost about ${formatAmount(monthly)} a month`,
    detail: `${names.join(', ')}${found.length > names.length ? ` and ${found.length - names.length} more` : ''} — the same amount each month, about ${formatAmount(round2(monthly * 12))} a year`,
    action: 'Fixed costs are the easiest thing to cut once, then forget about.',
  }
}

/** 一笔特别大的开销。中位数比平均数稳 —— 平均数会被这笔大的自己拉高。 */
function outlier(receipts: ReceiptWithItems[], month: string): Insight | null {
  const rows = baseRows(receipts, month)
  if (rows.length < 4) return null

  const amounts = rows.map((r) => r.total_amount)
  const mid = median(amounts)
  if (mid <= 0) return null

  const biggest = rows.reduce((a, b) => (b.total_amount > a.total_amount ? b : a))
  const times = biggest.total_amount / mid
  if (times < 3) return null

  return {
    id: 'outlier',
    tone: 'neutral',
    title: `One expense was ${times.toFixed(1)}× your typical spend`,
    detail: `${formatAmount(biggest.total_amount)}${biggest.merchant ? ` at ${biggest.merchant}` : ''} — your typical expense this month is ${formatAmount(round2(mid))}`,
  }
}

/** 一堆小额加起来的钱。单看每笔都不心疼，加起来才吓人。 */
function deathByThousandCuts(receipts: ReceiptWithItems[], month: string): Insight | null {
  const summary = summarizeMonth(receipts, month)
  const rows = baseRows(receipts, month)

  for (const c of summary.categories) {
    const inCategory = rows.filter((r) => r.category === c.slug)
    if (inCategory.length < 5) continue
    const average = c.total / c.count
    // 「小额」相对本月中位数而言
    if (average > median(rows.map((r) => r.total_amount))) continue

    return {
      id: 'small-adds-up',
      tone: 'neutral',
      title: `${c.count} small ${c.label} expenses added up to ${formatAmount(c.total)}`,
      detail: `Averaging ${formatAmount(round2(average))} each — ${formatPercent(c.share)} of the month`,
    }
  }
  return null
}

/** 连续几个月都在降 —— 值得说一句好话。 */
function improving(receipts: ReceiptWithItems[], month: string): Insight | null {
  const trend = monthlyTrend(receipts, month, 3)
  if (trend.some((p) => p.total <= 0)) return null
  const [a, b, c] = trend
  if (!(a.total > b.total && b.total > c.total)) return null

  return {
    id: 'improving',
    tone: 'positive',
    title: 'Third month in a row spending less',
    detail: trend.map((p) => formatAmount(p.total)).join(' → '),
  }
}

// ---------------------------------------------------------------------------

/** 规则按重要性排，取前几条。 */
export function buildInsights(receipts: ReceiptWithItems[], month: string): Insight[] {
  const rules = [projection, categorySurge, recurring, improving, outlier, deathByThousandCuts]
  return rules
    .map((rule) => rule(receipts, month))
    .filter((i): i is Insight => i !== null)
    .slice(0, MAX_INSIGHTS)
}
