import type { ReactNode } from 'react'

interface Props {
  title: string
  /** 标题右侧的槽位，放筛选器之类的 */
  right?: ReactNode
}

/**
 * 深色头部条。
 *
 * 下边留了一段多余的内边距，页面用负 margin 把第一张卡片提上来压在交界处 ——
 * 这是参考设计里那种「卡片浮在深色条边缘」的层次感。
 *
 * 这条不跟随明暗模式翻转：它是品牌色，翻成浅色就不是这个设计了。
 */
export function PageHeader({ title, right }: Props) {
  return (
    <header className="bg-brand pt-safe">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 pt-5 pb-20">
        <h1 className="text-[26px] font-bold tracking-tight text-brand-fg">{title}</h1>
        {right}
      </div>
    </header>
  )
}

/** 压在头部条下缘的内容区。和 PageHeader 的 pb-20 配对使用。 */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="mx-auto -mt-12 flex max-w-md flex-col gap-5 px-4">{children}</div>
}
