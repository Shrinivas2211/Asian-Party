import { House, ReceiptText } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Home', icon: House },
  { to: '/list', label: 'History', icon: ReceiptText },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/85 backdrop-blur-xl pb-safe">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <Icon size={24} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
