import type { TrendPoint } from '../../lib/analytics'
import { formatAmount, formatMonthShort } from '../../lib/format'

interface Props {
  points: TrendPoint[]
  /** 当前选中的月份，高亮显示 */
  selected: string
  onSelect: (month: string) => void
}

/** 月度趋势。点柱子可以直接跳到那个月。 */
export function TrendBars({ points, selected, onSelect }: Props) {
  // 全为 0 时不能拿它当分母
  const max = Math.max(...points.map((p) => p.total), 0)

  return (
    <div className="card px-3 py-4">
      <div className="flex h-32 items-end gap-1.5">
        {points.map((p) => {
          const active = p.month === selected
          return (
            <button
              key={p.month}
              type="button"
              onClick={() => onSelect(p.month)}
              className="flex h-full flex-1 flex-col justify-end gap-1.5 active:opacity-60"
              // 柱子本身没有文字，屏幕阅读器需要这句
              aria-label={`${formatMonthShort(p.month)} ${formatAmount(p.total)}`}
            >
              <span
                className={`tabular text-center text-[10px] ${active ? 'text-fg' : 'text-muted'}`}
              >
                {p.total > 0 ? Math.round(p.total) : ''}
              </span>
              <span
                className={`w-full rounded-t transition-[height] duration-300 ${
                  active ? 'bg-accent-vivid' : 'bg-surface-2'
                }`}
                style={{
                  // 有金额的月份至少留 3% 高度，否则小额月份会是一条看不见的线，
                  // 跟「这个月没记录」分不清
                  height: max > 0 && p.total > 0 ? `${Math.max((p.total / max) * 100, 3)}%` : '2px',
                }}
              />
              <span className={`text-center text-[11px] ${active ? 'text-fg' : 'text-muted'}`}>
                {formatMonthShort(p.month)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
