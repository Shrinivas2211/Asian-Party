import { ReceiptText } from 'lucide-react'
import { useEffect } from 'react'

import { PageBody, PageHeader } from '../components/layout/PageHeader'
import { ReceiptRow } from '../components/ReceiptRow'
import { formatAmount, formatDateGroup } from '../lib/format'
import { useReceiptStore } from '../store/receipts'
import type { ReceiptWithItems } from '../types'

interface DayGroup {
  date: string
  items: ReceiptWithItems[]
}

/** 列表已按 date 倒序排好，顺着扫一遍就能切出每天一组。 */
function groupByDate(receipts: ReceiptWithItems[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const r of receipts) {
    const last = groups.at(-1)
    if (last?.date === r.date) last.items.push(r)
    else groups.push({ date: r.date, items: [r] })
  }
  return groups
}

/** 当天各笔币种一致才给合计 —— 不做汇率折算，混币加起来是个假数字。 */
function dayTotal(items: ReceiptWithItems[]): string | null {
  const { currency } = items[0]
  if (items.some((r) => r.currency !== currency)) return null
  return formatAmount(
    items.reduce((sum, r) => sum + r.total_amount, 0),
    currency,
  )
}

export function ListPage() {
  const { receipts, status, error, load } = useReceiptStore()

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <PageHeader title="History" />

      <PageBody>
        {status === 'loading' && (
          <p className="card px-6 py-16 text-center text-[15px] text-muted">Loading…</p>
        )}

        {status === 'error' && (
          <p className="card px-6 py-10 text-center text-[14px] leading-relaxed text-danger">
            {error}
          </p>
        )}

        {status === 'ready' && receipts.length === 0 && (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <ReceiptText size={36} className="text-muted" strokeWidth={1.5} />
            <p className="text-[15px] text-muted">No expenses yet</p>
            <p className="text-[13px] text-muted">Tap + to add your first one</p>
          </div>
        )}

        {groupByDate(receipts).map((group) => {
          const total = dayTotal(group.items)
          return (
            <section key={group.date}>
              <div className="mb-1.5 flex items-baseline justify-between px-1">
                <h2 className="text-[13px] font-medium text-muted">
                  {formatDateGroup(group.date)}
                </h2>
                {total && <span className="tabular text-[13px] text-muted">{total}</span>}
              </div>
              <div className="card overflow-hidden">
                {group.items.map((r) => (
                  <ReceiptRow key={r.id} receipt={r} />
                ))}
              </div>
            </section>
          )
        })}
      </PageBody>
    </>
  )
}
