import type { ReactNode } from 'react'

/** 设置项那种「左标签右控件」的一行。多行拼在一个 bg-surface 卡片里。 */
export function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
      <span className="w-16 shrink-0 text-[15px] text-fg">{label}</span>
      <span className="flex min-w-0 flex-1 justify-end">{children}</span>
    </label>
  )
}

/** FormRow 里的文本框。右对齐，和原生 iOS 设置页一致。 */
export function RowInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full min-w-0 bg-transparent text-right text-[15px] text-fg outline-none placeholder:text-muted"
    />
  )
}

/** FormRow 里的下拉。用原生 select —— 手机上系统选择器比自己撸的滚轮好用。 */
export function RowSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="min-w-0 bg-transparent text-right text-[15px] text-fg outline-none"
    />
  )
}
