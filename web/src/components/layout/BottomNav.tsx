import { ChartColumn, House, ReceiptText } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Home', icon: House },
  { to: '/list', label: 'History', icon: ReceiptText },
  { to: '/insights', label: 'Insights', icon: ChartColumn },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-xl pb-safe">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="relative flex flex-1 flex-col items-center">
            {({ isActive }) => (
              <span
                className={`flex w-full flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] transition-colors ${
                  isActive ? 'text-fg' : 'text-muted'
                }`}
              >
                {/* 参考设计里选中项头顶有一小道指示条 */}
                <span
                  className={`absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-accent-vivid transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
