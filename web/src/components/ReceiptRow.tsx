import { Link } from 'react-router-dom'

import { getCategory, getPaymentLabel } from '../constants/categories'
import { formatAmount } from '../lib/format'
import type { ReceiptWithItems } from '../types'

/** 列表里的一条记录。点进去就是编辑页。 */
export function ReceiptRow({ receipt }: { receipt: ReceiptWithItems }) {
  const category = getCategory(receipt.category)
  const Icon = category.icon

  // 有商家名时主标题给商家，分类退到副标题；没商家就用分类当标题
  const subtitle = [
    receipt.merchant ? category.label : null,
    getPaymentLabel(receipt.payment_method),
    receipt.note,
    receipt.receipt_items.length
      ? `${receipt.receipt_items.length} ${receipt.receipt_items.length === 1 ? 'item' : 'items'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      to={`/receipt/${receipt.id}`}
      className="flex items-center gap-3 border-t border-line px-4 py-3 active:bg-surface-2 first:border-t-0"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: category.color }}
      >
        <Icon size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] text-fg">
          {receipt.merchant || category.label}
        </span>
        {subtitle && <span className="block truncate text-[13px] text-muted">{subtitle}</span>}
      </span>

      <span className="tabular shrink-0 text-[16px] font-medium text-fg">
        {formatAmount(receipt.total_amount, receipt.currency)}
      </span>
    </Link>
  )
}
