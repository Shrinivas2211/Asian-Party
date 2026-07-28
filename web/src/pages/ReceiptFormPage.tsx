import { ChevronLeft, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ReceiptForm } from '../components/ReceiptForm'
import { Sheet } from '../components/ui/Sheet'
import { draftError, draftFromReceipt, emptyDraft, getReceipt } from '../lib/receipts'
import { useReceiptStore } from '../store/receipts'
import type { ReceiptDraft, ReceiptWithItems } from '../types'

/**
 * 记一笔 / 改一笔。
 *
 * `/new` 是新建，`/receipt/:id` 是编辑 —— 两者字段完全一样，没必要拆成两个页面。
 * 拍照识别后的确认走 ScanPage，那边多一步上传原图，但表单本体是同一个组件。
 */
export function ReceiptFormPage() {
  const { id } = useParams<{ id: string }>()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const save = useReceiptStore((s) => s.save)
  const remove = useReceiptStore((s) => s.remove)

  const [draft, setDraft] = useState<ReceiptDraft | null>(editing ? null : emptyDraft())
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!id) return

    const apply = (r: ReceiptWithItems) => {
      setDraft(draftFromReceipt(r))
      setImagePath(r.image_path)
    }

    // 从列表点进来时数据已经在 store 里了，直接用，省一次往返。
    // 用 getState() 而不是订阅 receipts —— 订阅的话保存后 store 刷新会把
    // 用户正在编辑的内容冲掉。
    const cached = useReceiptStore.getState().receipts.find((r) => r.id === id)
    if (cached) {
      apply(cached)
      return
    }

    // 直接访问 URL / 刷新页面的情况
    let cancelled = false
    getReceipt(id)
      .then((r) => !cancelled && apply(r))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [id])

  const patch = (fields: Partial<ReceiptDraft>) => setDraft((d) => (d ? { ...d, ...fields } : d))

  async function onSave() {
    if (!draft || busy) return

    const problem = draftError(draft)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await save(draft, { id })
      // 新建完跳到列表，让人立刻看到这笔；编辑完退回原来的位置
      if (editing) navigate(-1)
      else navigate('/list', { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!id) return
    setConfirmingDelete(false)
    setBusy(true)
    try {
      await remove(id)
      navigate('/list', { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg pt-safe">
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-line bg-bg/85 px-2 py-3 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full text-accent active:bg-surface-2"
        >
          <ChevronLeft size={26} />
        </button>
        <h1 className="flex-1 text-[17px] font-semibold text-fg">
          {editing ? 'Edit expense' : 'New expense'}
        </h1>
        <button
          onClick={onSave}
          disabled={busy || !draft}
          className="rounded-full px-4 py-1.5 text-[17px] font-semibold text-accent active:opacity-60 disabled:opacity-40"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </header>

      {!draft ? (
        <p className="px-4 py-16 text-center text-[15px] text-muted">{error ?? 'Loading…'}</p>
      ) : (
        <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4 pb-12">
          <ReceiptForm draft={draft} onChange={patch} imagePath={imagePath} />

          {error && (
            <p className="px-1 text-[13px] text-danger" role="alert">
              {error}
            </p>
          )}

          {editing && (
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-2xl bg-surface py-4 text-[17px] text-danger active:opacity-60 disabled:opacity-40"
            >
              <Trash2 size={18} />
              Delete expense
            </button>
          )}
        </div>
      )}

      <Sheet open={confirmingDelete} onClose={() => setConfirmingDelete(false)}>
        <p className="px-5 pt-4 pb-3 text-center text-[13px] text-muted">
          This can't be undone. Items are deleted too.
        </p>
        <button
          onClick={onDelete}
          className="w-full border-t border-line py-4 text-[17px] font-semibold text-danger active:bg-surface-2"
        >
          Delete
        </button>
      </Sheet>
    </div>
  )
}
