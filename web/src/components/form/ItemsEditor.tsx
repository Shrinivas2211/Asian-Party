import { Plus, X } from 'lucide-react'

import type { DraftItem } from '../../types'

interface Props {
  items: DraftItem[]
  onChange: (items: DraftItem[]) => void
}

const EMPTY: DraftItem = { item_name: '', unit_price: '', quantity: '' }

/**
 * 小票明细。手动记账时基本用不上，但 M3 识别出来的逐条商品要在这里改，
 * 所以两个场景共用一个组件。
 */
export function ItemsEditor({ items, onChange }: Props) {
  const patch = (index: number, field: keyof DraftItem, value: string) =>
    onChange(items.map((it, i) => (i === index ? { ...it, [field]: value } : it)))

  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      {items.map((item, i) => (
        // 明细行没有 id，删中间一行时用 index 做 key 会让后面的行错位地复用
        // DOM 节点（输入焦点会跳）。这里行数少、改动不频繁，接受这个代价。
        <div key={i} className="flex items-center gap-2 border-t border-line px-3 py-2 first:border-t-0">
          <input
            placeholder="Item"
            value={item.item_name}
            onChange={(e) => patch(i, 'item_name', e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted"
          />
          <input
            inputMode="decimal"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => patch(i, 'quantity', e.target.value)}
            className="tabular w-12 shrink-0 bg-transparent text-right text-[14px] text-muted outline-none placeholder:text-muted/60"
          />
          <input
            inputMode="decimal"
            placeholder="Price"
            value={item.unit_price}
            onChange={(e) => patch(i, 'unit_price', e.target.value)}
            className="tabular w-16 shrink-0 bg-transparent text-right text-[15px] text-fg outline-none placeholder:text-muted/60"
          />
          <button
            type="button"
            aria-label="Remove item"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, EMPTY])}
        className="flex w-full items-center gap-2 border-t border-line px-4 py-3 text-[15px] text-accent active:bg-surface-2 first:border-t-0"
      >
        <Plus size={18} />
        Add item
      </button>
    </div>
  )
}
