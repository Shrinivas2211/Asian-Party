import { Link } from 'react-router-dom'

import { getCategory, getPaymentLabel } from '../constants/categories'
import { formatAmount, formatDate } from '../lib/format'
import type { ReceiptWithItems } from '../types'

interface Props {
  receipt: ReceiptWithItems
  /** 列表页已经按日期分了组，那里不用再重复日期；首页「最近」需要。 */
  showDate?: boolean
}

/** 列表里的一条记录。点进去就是编辑页。 */
export function ReceiptRow({ receipt, showDate = false }: Props) {
  const category = getCategory(receipt.category)
  const Icon = category.icon

  // 有商家名时主标题给商家，分类退到副标题；没商家就用分类当标题
  const subtitle = [
    showDate ? formatDate(receipt.date) : null,
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
      className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0 active:bg-surface-2"
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        // 参考设计里图标是「浅色底 + 同色图标」，不是实心色块 —— 一列排下来
        // 安静得多，金额才是该抢眼的东西。
        style={{
          backgroundColor: `color-mix(in srgb, ${category.color} 16%, transparent)`,
          color: category.ink,
        }}
      >
        <Icon size={19} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-fg">
          {receipt.merchant || category.label}
        </span>
        {subtitle && <span className="block truncate text-[12px] text-muted">{subtitle}</span>}
      </span>

      <span className="tabular shrink-0 text-[16px] font-semibold text-fg">
        {formatAmount(receipt.total_amount, receipt.currency)}
      </span>
    </Link>
  )
}
