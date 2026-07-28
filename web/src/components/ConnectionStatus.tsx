import { useEffect, useState } from 'react'

import { getHealth } from '../lib/api'
import { pingSupabase } from '../lib/supabase'

type State = 'checking' | 'ok' | 'fail'

interface Check {
  label: string
  state: State
  detail: string
}

const DOT: Record<State, string> = {
  checking: 'bg-muted animate-pulse',
  ok: 'bg-success',
  fail: 'bg-danger',
}

/**
 * 开发期的连通性面板：一眼看出后端和 Supabase 通没通。
 * 功能都跑通之后可以从首页移除。
 */
export function ConnectionStatus() {
  const [checks, setChecks] = useState<Check[]>([
    { label: 'API', state: 'checking', detail: 'Checking…' },
    { label: 'Supabase', state: 'checking', detail: 'Checking…' },
  ])

  useEffect(() => {
    let cancelled = false

    const update = (index: number, patch: Omit<Check, 'label'>) => {
      if (cancelled) return
      setChecks((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
    }

    getHealth()
      .then((h) =>
        update(0, {
          state: 'ok',
          detail: h.ai_configured
            ? `Ready · ${h.ai_model}`
            : 'Connected, but OPENAI_API_KEY is empty in api/.env',
        }),
      )
      .catch((e: Error) =>
        update(0, { state: 'fail', detail: `${e.message} — is the backend running?` }),
      )

    pingSupabase()
      .then((r) => update(1, { state: r.ok ? 'ok' : 'fail', detail: r.detail }))
      .catch((e: Error) => update(1, { state: 'fail', detail: e.message }))

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="card p-1">
      {checks.map((c, i) => (
        <div
          key={c.label}
          className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line' : ''}`}
        >
          <span className={`size-2.5 shrink-0 rounded-full ${DOT[c.state]}`} />
          <span className="w-20 shrink-0 text-[15px] text-fg">{c.label}</span>
          {/* 不能 truncate —— 失败时这行字就是排查线索，必须完整看到 */}
          <span className="min-w-0 flex-1 text-right text-[13px] leading-snug break-words text-muted">
            {c.detail}
          </span>
        </div>
      ))}
    </div>
  )
}
