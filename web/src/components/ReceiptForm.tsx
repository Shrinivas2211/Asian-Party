import { AmountField } from './form/AmountField'
import { CategoryGrid } from './form/CategoryGrid'
import { FormRow, RowInput, RowSelect } from './form/FormRow'
import { ItemsEditor } from './form/ItemsEditor'
import { ReceiptImage } from './ReceiptImage'
import { PAYMENT_METHODS } from '../constants/categories'
import type { PaymentMethod, ReceiptDraft } from '../types'

interface Props {
  draft: ReceiptDraft
  onChange: (fields: Partial<ReceiptDraft>) => void
  /** 已入库记录的原图路径 */
  imagePath?: string | null
  /** 刚拍完、还没上传的原图 */
  imageFile?: File | null
}

/**
 * 一笔账的所有字段。手动记账、编辑、拍照确认三个场景共用。
 *
 * 只管字段，不管标题栏 / 保存 / 删除 —— 那几样每个场景都不一样，留给页面。
 * 外层需要自己提供 flex 纵向容器。
 */
export function ReceiptForm({ draft, onChange, imagePath, imageFile }: Props) {
  return (
    <>
      <ReceiptImage path={imagePath} file={imageFile} />

      <AmountField
        value={draft.amountText}
        currency={draft.currency}
        onChange={(amountText) => onChange({ amountText })}
      />

      <CategoryGrid value={draft.category} onChange={(category) => onChange({ category })} />

      <div className="card overflow-hidden">
        <FormRow label="Date">
          <RowInput
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </FormRow>
        <FormRow label="Merchant">
          <RowInput
            placeholder="Optional"
            value={draft.merchant}
            onChange={(e) => onChange({ merchant: e.target.value })}
          />
        </FormRow>
        <FormRow label="Payment">
          <RowSelect
            value={draft.paymentMethod ?? ''}
            onChange={(e) =>
              onChange({ paymentMethod: (e.target.value || null) as PaymentMethod | null })
            }
          >
            <option value="">None</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </RowSelect>
        </FormRow>
        <FormRow label="Note">
          <RowInput
            placeholder="Optional"
            value={draft.note}
            onChange={(e) => onChange({ note: e.target.value })}
          />
        </FormRow>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[13px] font-medium text-muted">Items (optional)</h2>
        <ItemsEditor items={draft.items} onChange={(items) => onChange({ items })} />
      </div>
    </>
  )
}
