import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { ConnectionStatus } from '../components/ConnectionStatus'
import { PageBody, PageHeader } from '../components/layout/PageHeader'
import { ReceiptRow } from '../components/ReceiptRow'
import { summarizeMonth } from '../lib/analytics'
import { currentMonthName, formatAmount, formatPercent } from '../lib/format'
import { useReceiptStore } from '../store/receipts'

const RECENT_COUNT = 4

export function HomePage() {
  const { receipts, status, error, load } = useReceiptStore()

  useEffect(() => {
    void load()
  }, [load])

  const summary = summarizeMonth(receipts)
  const recent = receipts.slice(0, RECENT_COUNT)

  return (
    <>
      <PageHeader title="Expenses" />

      <PageBody>
        {/* 压在深色条下缘的主卡片 */}
        <section className="card px-5 py-6 text-center">
          <span className="block text-[13px] font-medium text-muted">
            {currentMonthName()} spending
          </span>
          <span className="tabular mt-1.5 block text-[38px] leading-none font-bold tracking-tight text-fg">
            {formatAmount(summary.total)}
          </span>

          {/* 参考设计这里是预算进度条。这个 app 还没有「预算」这个概念，编一个
              数字出来是假的，所以换成同样位置的环比 —— 那是真实算出来的。 */}
          <div className="mt-4 border-t border-line pt-3">
            {status === 'error' ? (
              <p className="text-[13px] leading-relaxed text-danger">{error}</p>
            ) : (
              <MonthComparison summary={summary} />
            )}
          </div>

          {summary.foreignCurrencies.length > 0 && (
            <p className="mt-2 text-[12px] text-muted">
              {summary.foreignCurrencies.join(' / ')} entries are not included
            </p>
          )}
        </section>

        {recent.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-[17px] font-semibold text-fg">Recent</h2>
              <Link
                to="/list"
                className="rounded-full bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent active:opacity-60"
              >
                See all
              </Link>
            </div>
            <div className="card overflow-hidden">
              {recent.map((r) => (
                <ReceiptRow key={r.id} receipt={r} showDate />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-medium text-muted">Connection</h2>
          <ConnectionStatus />
        </section>
      </PageBody>
    </>
  )
}

function MonthComparison({ summary }: { summary: ReturnType<typeof summarizeMonth> }) {
  if (summary.count === 0) {
    return <p className="text-[13px] text-muted">Nothing yet this month — tap + to add your first</p>
  }

  const label = `${summary.count} ${summary.count === 1 ? 'expense' : 'expenses'}`

  if (summary.changeRatio === null) {
    return <p className="text-[13px] text-muted">{label} so far</p>
  }

  const flat = summary.changeRatio === 0
  const up = summary.changeRatio > 0
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown

  return (
    <p className="flex items-center justify-center gap-1.5 text-[13px] text-muted">
      <Icon size={14} className={flat ? 'text-muted' : up ? 'text-danger' : 'text-success'} />
      <span className={`tabular font-medium ${flat ? 'text-muted' : up ? 'text-danger' : 'text-success'}`}>
        {formatPercent(Math.abs(summary.changeRatio))}
      </span>
      vs last month · {label}
    </p>
  )
}
