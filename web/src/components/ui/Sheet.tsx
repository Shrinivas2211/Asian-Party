import { useEffect, type ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/** 从底部滑出的操作面板。移动端比居中弹窗更顺手 —— 拇指够得到。 */
export function Sheet({ open, onClose, children }: SheetProps) {
  // 打开时锁住背景滚动，否则 iOS 上手指滑动会穿透到底层列表
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-md animate-[sheet-up_180ms_ease-out] p-3 pb-safe">
        <div className="overflow-hidden rounded-2xl bg-surface shadow-2xl">{children}</div>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-surface py-4 text-[17px] font-semibold text-fg active:opacity-60"
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(16px); opacity: 0 }
          to   { transform: translateY(0);    opacity: 1 }
        }
      `}</style>
    </div>
  )
}
