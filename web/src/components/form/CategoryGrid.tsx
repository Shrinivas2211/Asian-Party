import { CATEGORIES } from '../../constants/categories'
import type { CategorySlug } from '../../types'

interface Props {
  value: CategorySlug | null
  onChange: (slug: CategorySlug) => void
}

/** 分类选择。七个而已，全铺开比藏进下拉菜单少一次点击。 */
export function CategoryGrid({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-y-4 rounded-2xl bg-surface px-3 py-5">
      {CATEGORIES.map(({ slug, label, icon: Icon, color }) => {
        const selected = value === slug
        return (
          <button
            key={slug}
            type="button"
            onClick={() => onChange(slug)}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`flex size-12 items-center justify-center rounded-full text-white transition-transform active:scale-90 ${
                selected ? 'ring-2 ring-fg/70 ring-offset-2 ring-offset-surface' : ''
              }`}
              // 颜色来自数据，只能走 inline style
              style={{ backgroundColor: color, opacity: selected || !value ? 1 : 0.45 }}
            >
              <Icon size={22} />
            </span>
            <span className={`text-[12px] ${selected ? 'text-fg' : 'text-muted'}`}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
