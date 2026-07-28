import { Outlet } from 'react-router-dom'

import { BottomNav } from './BottomNav'
import { Fab } from './Fab'

/**
 * 带底部 Tab 的主框架。
 * 表单类页面（记账 / 编辑 / 确认）走全屏路由，不套这一层。
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-bg">
      {/* 底部留出 nav 高度 + FAB 的空间，最后一条记录不会被挡住 */}
      <main className="mx-auto max-w-md pb-28">
        <Outlet />
      </main>
      <Fab />
      <BottomNav />
    </div>
  )
}
