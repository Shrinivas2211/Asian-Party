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
      <button
        aria-label="Add expense"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/30 transition-transform active:scale-90"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
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
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
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
