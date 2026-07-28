import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { ConnectionStatus } from '../components/ConnectionStatus'
import { ReceiptRow } from '../components/ReceiptRow'
import { currencySymbol, currentMonthName } from '../lib/format'
import { summarizeMonth } from '../lib/receipts'
import { useReceiptStore } from '../store/receipts'

const RECENT_COUNT = 5

export function HomePage() {
  const { receipts, status, error, load } = useReceiptStore()

  useEffect(() => {
    void load()
  }, [load])

  const month = currentMonthName()
  const summary = summarizeMonth(receipts)
  const recent = receipts.slice(0, RECENT_COUNT)

  return (
    <div className="px-4 pt-safe">
      <header className="px-1 pt-6 pb-5">
        <h1 className="text-[28px] font-bold tracking-tight text-fg">{month} spending</h1>
      </header>

      <section className="mb-6 rounded-2xl bg-surface px-5 py-6">
        <div className="flex items-baseline gap-1 text-fg">
          <span className="tabular text-[22px] font-medium text-muted">{currencySymbol()}</span>
          <span className="tabular text-[44px] leading-none font-semibold tracking-tight">
            {summary.total.toFixed(2)}
          </span>
        </div>

        <p className="mt-2 text-[13px] text-muted">
          {status === 'error'
            ? error
            : summary.count === 0
              ? 'Nothing yet this month — tap + to add your first'
              : `${summary.count} ${summary.count === 1 ? 'expense' : 'expenses'} this month`}
        </p>

        {summary.foreignCurrencies.length > 0 && (
          // 不做汇率折算，外币不能混进上面那个数字里，但也不能装作不存在
          <p className="mt-1 text-[13px] text-muted">
            {summary.foreignCurrencies.join(' / ')} entries are not included in this total
          </p>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-[13px] font-medium text-muted">Recent</h2>
            <Link to="/list" className="text-[13px] text-accent active:opacity-60">
              See all
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl bg-surface">
            {recent.map((r) => (
              <ReceiptRow key={r.id} receipt={r} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-medium text-muted">Connection</h2>
        <ConnectionStatus />
      </section>
    </div>
  )
}
