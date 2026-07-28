import { Camera, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Sheet } from '../ui/Sheet'

const ACTIONS = [
  { to: '/scan', label: 'Scan receipt', hint: "Snap a photo, we'll fill it in", icon: Camera },
  { to: '/new', label: 'Enter manually', hint: 'Type the amount and category', icon: Pencil },
]

/** 右下角常驻的记账入口。记账是高频操作，这个按钮在每一页都要够得到。 */
export function Fab() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {/* 参考设计把这颗钮放在 tab 栏正中 —— 它那儿有四个 tab、中间留了空位。
          我们只有三个 tab，居中就只能浮在内容之上，实测会压住统计页环形图中心的
          金额。挪到右下角：这是 FAB 的常规位置，且不与任何居中元素相撞。 */}
      <button
        aria-label="Add expense"
        onClick={() => setOpen(true)}
        className="fixed right-5 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/40 transition-transform active:scale-90"
        style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)}>
        {ACTIONS.map(({ to, label, hint, icon: Icon }, i) => (
          <button
            key={to}
            onClick={() => {
              setOpen(false)
              navigate(to)
            }}
            className={`flex w-full items-center gap-4 px-5 py-4 text-left active:bg-surface-2 ${
              i > 0 ? 'border-t border-line' : ''
            }`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon size={20} />
            </span>
            <span>
              <span className="block text-[17px] font-medium text-fg">{label}</span>
              <span className="block text-[13px] text-muted">{hint}</span>
            </span>
          </button>
        ))}
      </Sheet>
    </>
  )
}
