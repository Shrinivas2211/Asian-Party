import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** .env.local 是否填好了。没填时不抛错，让首页的状态点把问题指出来。 */
export const isSupabaseConfigured = Boolean(url && anonKey)

// 用 || 而不是 ??：.env.local 里写 `VITE_SUPABASE_URL=` 会得到空字符串而不是
// undefined，?? 拦不住，createClient 会在模块加载时直接抛错、整个 app 白屏。
// 这里退回到占位值，让 isSupabaseConfigured 去把「没配置」这件事讲清楚。
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      // MVP 单用户阶段不做登录，不需要在 localStorage 里维护 session
      persistSession: false,
    },
  },
)

/**
 * 一次请求同时验证四件事：URL 对不对、anon key 有没有效、receipts 表建了没、
 * RLS 策略允不允许 anon 读。任一环节没配好都会在这里暴露。
 */
export async function pingSupabase(): Promise<{ ok: boolean; detail: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, detail: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in web/.env.local' }
  }

  // 不能用 { head: true } —— 那走的是 HTTP HEAD，按定义不带响应体，
  // PostgREST 的错误 JSON 根本发不过来，supabase-js 于是给出 error: null，
  // 表不存在也会报成功。必须用 GET 才能拿到真实错误。
  const { count, error } = await supabase
    .from('receipts')
    .select('id', { count: 'exact' })
    .limit(1)

  if (error) return { ok: false, detail: error.message }
  return { ok: true, detail: `receipts table readable · ${count ?? 0} rows` }
}
