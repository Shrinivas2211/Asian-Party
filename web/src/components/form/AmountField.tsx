import { currencySymbol } from '../../lib/format'

/**
 * 只留数字和一个小数点，小数最多两位 —— 对齐 numeric(12,2)。
 * 在 onChange 里改而不是靠校验，用户永远敲不出非法金额。
 */
function sanitize(raw: string): string {
  const [intPart, ...rest] = raw.replace(/[^\d.]/g, '').split('.')
  const head = intPart.slice(0, 9)
  return rest.length ? `${head}.${rest.join('').slice(0, 2)}` : head
}

interface Props {
  value: string
  currency: string
  onChange: (value: string) => void
}

/** 记账页最上面那个大号金额输入。自动聚焦 —— 打开表单第一件事永远是填金额。 */
export function AmountField({ value, currency, onChange }: Props) {
  return (
    <label className="flex items-baseline justify-center gap-1.5 rounded-2xl bg-surface px-5 py-8">
      <span className="tabular text-[26px] font-medium text-muted">{currencySymbol(currency)}</span>
      <input
        // 手机上拉数字键盘；type="number" 会带上没用的加减箭头，还挡不住 "1e5"
        inputMode="decimal"
        autoFocus
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(sanitize(e.target.value))}
        className="tabular w-full min-w-0 max-w-[7ch] bg-transparent text-[48px] leading-none font-semibold tracking-tight text-fg outline-none placeholder:text-muted/40"
      />
    </label>
  )
}
