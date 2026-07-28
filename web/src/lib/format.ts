/** 本位币。所有金额默认按它显示；识别出的外币记录会带自己的 currency。 */
export const BASE_CURRENCY = 'GBP'

const LOCALE = 'en-GB'

export function formatAmount(amount: number, currency: string = BASE_CURRENCY): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** 只要符号，用在大号金额数字旁边 */
export function currencySymbol(currency: string = BASE_CURRENCY): string {
  const parts = new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).formatToParts(0)
  return parts.find((p) => p.type === 'currency')?.value ?? currency
}

/** 今天，YYYY-MM-DD。用本地时区，不能用 toISOString（那是 UTC，跨时区会差一天）。 */
export function todayISO(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

/** 2026-07-28 → 28 Jul；跨年的显示成 28 Jul 2025 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  // 逐段构造本地日期。不能用 new Date(iso) —— 那按 UTC 解析，
  // 负时区会整体差一天。
  const date = new Date(y, m - 1, d)
  const thisYear = new Date().getFullYear()

  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    ...(y === thisYear ? {} : { year: 'numeric' }),
  }).format(date)
}

/** 首页标题用：July */
export function currentMonthName(): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long' }).format(new Date())
}

/** 列表分组标题用：今天 / 昨天 / 7月28日 */
export function formatDateGroup(iso: string): string {
  const today = todayISO()
  if (iso === today) return 'Today'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const offsetMs = yesterday.getTimezoneOffset() * 60_000
  const yesterdayISO = new Date(yesterday.getTime() - offsetMs).toISOString().slice(0, 10)
  if (iso === yesterdayISO) return 'Yesterday'

  return formatDate(iso)
}
