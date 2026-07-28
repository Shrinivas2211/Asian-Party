import { ChartColumn, ChevronLeft, ChevronRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CategoryDonut } from '../components/insights/CategoryDonut'
import { InsightCards } from '../components/insights/InsightCards'
import { TrendBars } from '../components/insights/TrendBars'
import { PageBody, PageHeader } from '../components/layout/PageHeader'
import { monthOf, monthlyTrend, monthsWithData, shiftMonth, summarizeMonth } from '../lib/analytics'
import { buildInsights } from '../lib/advice'
import { formatAmount, formatMonth, formatPercent, todayISO } from '../lib/format'
import { useReceiptStore } from '../store/receipts'

const TREND_MONTHS = 6

export function InsightsPage() {
  const { receipts, status, error, load } = useReceiptStore()
  const [month, setMonth] = useState(() => monthOf(todayISO()))

  useEffect(() => {
    void load()
  }, [load])

  const summary = summarizeMonth(receipts, month)
  const trend = monthlyTrend(receipts, month, TREND_MONTHS)
  const months = monthsWithData(receipts)
  const insights = buildInsights(receipts, month)

  // 往前翻到最早有记录的那个月为止；往后不越过本月 —— 空月份翻不完，没意义
  const earliest = months.at(-1)
  const canGoBack = Boolean(earliest && month > earliest)
  const canGoForward = month < monthOf(todayISO())

  return (
    <>
      <PageHeader
        title="Insights"
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth(shiftMonth(month, -1))}
              disabled={!canGoBack}
              aria-label="Previous month"
              className="flex size-8 items-center justify-center rounded-full text-brand-fg active:bg-white/10 disabled:opacity-25"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-[6.5rem] text-center text-[13px] font-medium text-brand-muted">
              {formatMonth(month)}
            </span>
            <button
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={!canGoForward}
              aria-label="Next month"
              className="flex size-8 items-center justify-center rounded-full text-brand-fg active:bg-white/10 disabled:opacity-25"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        }
      />

      <PageBody>
        {status === 'error' ? (
          <p className="card px-6 py-10 text-center text-[14px] leading-relaxed text-danger">
            {error}
          </p>
        ) : (
          <>
            <section className="card px-5 py-6 text-center">
              <span className="tabular block text-[38px] leading-none font-bold tracking-tight text-fg">
                {formatAmount(summary.total)}
              </span>
              <ChangeLine
                changeRatio={summary.changeRatio}
                previousTotal={summary.previousTotal}
                previousMonth={shiftMonth(month, -1)}
              />

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
                <Stat label="Expenses" value={String(summary.count)} />
                <Stat label="Per day" value={formatAmount(summary.dailyAverage)} />
                <Stat label="Top" value={summary.topMerchant?.name ?? '—'} />
              </div>

              {summary.foreignCurrencies.length > 0 && (
                <p className="mt-3 text-[12px] text-muted">
                  {summary.foreignCurrencies.join(' / ')} entries are not included — no conversion is
                  applied
                </p>
              )}
            </section>

            {insights.length > 0 && (
              <section>
                <h2 className="mb-2 px-1 text-[17px] font-semibold text-fg">What to look at</h2>
                <InsightCards insights={insights} />
              </section>
            )}

            {summary.categories.length > 0 ? (
              <section>
                <h2 className="mb-2 px-1 text-[17px] font-semibold text-fg">By category</h2>
                <CategoryDonut categories={summary.categories} total={summary.total} />
              </section>
            ) : (
              <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
                <ChartColumn size={32} className="text-muted" strokeWidth={1.5} />
                <p className="text-[15px] text-muted">
                  Nothing to break down for {formatMonth(month)}
                </p>
              </div>
            )}

            <section>
              <h2 className="mb-2 px-1 text-[17px] font-semibold text-fg">
                Last {TREND_MONTHS} months
              </h2>
              <TrendBars points={trend} selected={month} onSelect={setMonth} />
            </section>
          </>
        )}
      </PageBody>
    </>
  )
}

/** 「比上个月多花了 12%」那一行。上月没数据时说清楚，而不是显示 0%。 */
function ChangeLine({
  changeRatio,
  previousTotal,
  previousMonth,
}: {
  changeRatio: number | null
  previousTotal: number | null
  previousMonth: string
}) {
  if (changeRatio === null || previousTotal === null) {
    return (
      <p className="mt-2 text-[13px] text-muted">
        No spending recorded in {formatMonth(previousMonth)}
      </p>
    )
  }

  const flat = changeRatio === 0
  const up = changeRatio > 0
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown
  // 多花不是「错误」、少花也不是「成功」，所以文字保持中性，只用箭头和颜色提示方向
  const tone = flat ? 'text-muted' : up ? 'text-danger' : 'text-success'

  return (
    <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-muted">
      <Icon size={14} className={tone} />
      <span className={`tabular font-medium ${tone}`}>{formatPercent(Math.abs(changeRatio))}</span>
      vs {formatMonth(previousMonth)}
    </p>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block truncate text-[15px] font-semibold text-fg">{value}</span>
      <span className="mt-0.5 block truncate text-[11px] text-muted">{label}</span>
    </div>
  )
}
