import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { InsightsPage } from './pages/InsightsPage'
import { ListPage } from './pages/ListPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ReceiptFormPage } from './pages/ReceiptFormPage'
import { ScanPage } from './pages/ScanPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 带底部 Tab 的页面 */}
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Route>

        {/* 全屏表单页，不显示 Tab 栏 */}
        <Route path="/new" element={<ReceiptFormPage />} />
        <Route path="/receipt/:id" element={<ReceiptFormPage />} />
        <Route path="/scan" element={<ScanPage />} />

        <Route
          path="*"
          element={<PlaceholderPage title="Page not found" note="There's nothing at this address" />}
        />
      </Routes>
    </BrowserRouter>
  )
}
