import type { CategoryTotal } from '../../lib/analytics'
import { formatAmount, formatPercent } from '../../lib/format'

/**
 * 环形图 + 图例。
 *
 * 用 conic-gradient 画，不引图表库 —— 一个 CSS 属性就够，矢量清晰、自适应，
 * 且不给 bundle 增加一百多 KB。
 */
export function CategoryDonut({
  categories,
  total,
}: {
  categories: CategoryTotal[]
  total: number
}) {
  let cursor = 0
  const stops = categories.map((c, i) => {
    const from = cursor
    cursor += c.share * 100
    // 最后一段钉死在 100%：占比是浮点数，累加下来常差那么零点几，
    // 不钉的话圆环收口处会留一道发丝缝。
    const to = i === categories.length - 1 ? 100 : cursor
    return `${c.color} ${from}% ${to}%`
  })

  return (
    <div className="card px-5 py-6">
      <div
        className="relative mx-auto size-44 rounded-full"
        // 占比来自数据，只能 inline。最后一段收到 100% 补掉浮点误差留下的缝。
        style={{
          background: stops.length
            ? `conic-gradient(${stops.join(', ')})`
            : 'var(--color-surface-2)',
        }}
      >
        <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="tabular text-[19px] font-semibold tracking-tight text-fg">
            {formatAmount(total)}
          </span>
          <span className="text-[11px] text-muted">total</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {categories.map((c) => (
          <div key={c.slug} className="flex items-center gap-3">
            <span
              className="size-3.5 shrink-0 rounded"
              style={{ backgroundColor: c.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium text-fg">{c.label}</span>
              <span className="block text-[12px] text-muted">{formatPercent(c.share)}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="tabular block text-[15px] font-medium text-fg">
                {formatAmount(c.total)}
              </span>
              <span className="block text-[12px] text-muted">
                {c.count} {c.count === 1 ? 'expense' : 'expenses'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
