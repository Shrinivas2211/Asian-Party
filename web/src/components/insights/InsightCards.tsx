import { CircleCheck, Info, TriangleAlert } from 'lucide-react'

import type { Insight, InsightTone } from '../../lib/advice'

const TONE: Record<InsightTone, { icon: typeof Info; className: string }> = {
  warning: { icon: TriangleAlert, className: 'text-danger' },
  positive: { icon: CircleCheck, className: 'text-success' },
  neutral: { icon: Info, className: 'text-accent' },
}

/**
 * 「值得你知道的事」。
 *
 * 每条都带着算它出来的数字 —— 用户要能拿这句话回账本里核对。没有数字支撑的
 * 建议就是废话，所以规则那边宁可什么都不返回。
 */
export function InsightCards({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null

  return (
    <div className="flex flex-col gap-3">
      {insights.map((insight) => {
        const { icon: Icon, className } = TONE[insight.tone]
        return (
          <div key={insight.id} className="card flex gap-3 px-4 py-4">
            <Icon size={19} className={`mt-0.5 shrink-0 ${className}`} />
            <div className="min-w-0">
              <p className="text-[15px] leading-snug font-semibold text-fg">{insight.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{insight.detail}</p>
              {insight.action && (
                <p className="mt-2 text-[13px] leading-relaxed font-medium text-fg">
                  {insight.action}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
