import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  to?: string
}

interface Props {
  items: Crumb[]
  className?: string
}

export function RehabBreadcrumbs({ items, className }: Props) {
  return (
    <nav aria-label="ניווט היררכי" className={cn('text-[13px] text-slate-gray', className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-mist-gray" aria-hidden>
                  ›
                </span>
              )}
              {item.to && !last ? (
                <Link to={item.to} className="hover:text-ink-navy hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(last && 'font-medium text-ink-navy')}
                  aria-current={last ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
