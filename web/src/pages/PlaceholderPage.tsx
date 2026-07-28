import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/** M0 占位页。M1 / M3 会用真实页面替换掉它。 */
export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-bg pt-safe">
      <header className="flex items-center gap-1 px-2 py-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full text-accent active:bg-surface-2"
        >
          <ChevronLeft size={26} />
        </button>
        <h1 className="text-[17px] font-semibold text-fg">{title}</h1>
      </header>

      <p className="mx-4 rounded-2xl bg-surface px-5 py-10 text-center text-[15px] text-muted">
        {note}
      </p>
    </div>
  )
}
