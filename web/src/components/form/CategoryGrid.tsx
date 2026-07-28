import { CATEGORIES } from '../../constants/categories'
import type { CategorySlug } from '../../types'

interface Props {
  value: CategorySlug | null
  onChange: (slug: CategorySlug) => void
}

/** 分类选择。七个而已，全铺开比藏进下拉菜单少一次点击。 */
export function CategoryGrid({ value, onChange }: Props) {
  return (
    <div className="card grid grid-cols-4 gap-y-4 px-3 py-5">
      {CATEGORIES.map(({ slug, label, icon: Icon, color, ink, glyph }) => {
        const selected = value === slug
        return (
          <button
            key={slug}
            type="button"
            onClick={() => onChange(slug)}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`flex size-12 items-center justify-center rounded-full transition-transform active:scale-90 ${
                selected ? 'ring-2 ring-fg/60 ring-offset-2 ring-offset-surface' : ''
              }`}
              // 未选中不再整体压透明度（那让浅色分类糊成一团），改成「浅底 + 深墨图标」；
              // 选中才是实色圆。两种状态的图标色都算过对比，最低 4.6。
              style={
                selected
                  ? { backgroundColor: color, color: glyph }
                  : { backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color: ink }
              }
            >
              <Icon size={22} />
            </span>
            <span className={`text-[12px] ${selected ? 'font-medium text-fg' : 'text-muted'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
