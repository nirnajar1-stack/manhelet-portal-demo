import { useEffect, useMemo, useState } from 'react'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Panel } from '@/components/ui/card'
import { fetchOrgNews } from '@/api/stubs'
import { cn } from '@/lib/utils'
import type { OrgNewsItem } from '@/types'

const kindLabel: Record<OrgNewsItem['kind'], string> = {
  news: 'חדשות',
  leadership: 'הודעת הנהלה',
  event: 'אירוע',
  initiative: 'יוזמה',
  people: 'היכרות',
  procedure: 'נוהל',
  tool: 'כלי',
}

const filters: Array<OrgNewsItem['kind'] | 'all'> = [
  'all',
  'leadership',
  'news',
  'event',
  'initiative',
  'people',
  'procedure',
  'tool',
]

export function OrgHome() {
  const [items, setItems] = useState<OrgNewsItem[]>([])
  const [filter, setFilter] = useState<(typeof filters)[number]>('all')

  useEffect(() => {
    void fetchOrgNews().then(setItems)
  }, [])

  const list = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.kind === filter)),
    [items, filter],
  )

  const pinned = items.find((i) => i.pinned)

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">בית המנהלת</h1>
        <p className="page-lede">
          חדשות, הודעות, אירועים, יוזמות, נהלים וכלים — הבית הארגוני.
        </p>
      </div>

      <AssumptionBanner>
        כל התוכן כאן הוא דמה ואינו משקף אירועים רגישים או פרטים אמיתיים.
      </AssumptionBanner>

      {pinned && (
        <Panel className="border-s-4 border-s-gold">
          <Badge tone="info">{kindLabel[pinned.kind]}</Badge>
          <h2 className="mt-2 text-[17px] font-semibold">{pinned.title}</h2>
          <p className="mt-1.5 max-w-2xl text-[13px] text-slate-gray">
            {pinned.summary}
          </p>
          <p className="mt-2 text-[11px] text-mist-gray">{pinned.date}</p>
        </Panel>
      )}

      <div
        className="flex gap-0.5 overflow-x-auto border-b border-hairline"
        role="tablist"
        aria-label="סינון תוכן ארגוני"
      >
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'filter-chip cursor-pointer border-b-2 rounded-none',
              filter === f
                ? 'border-gold text-ink-navy'
                : 'border-transparent text-slate-gray hover:text-ink-navy',
            )}
          >
            {f === 'all' ? 'הכל' : kindLabel[f]}
          </button>
        ))}
      </div>

      <div className="divide-y divide-hairline rounded-[10px] border border-hairline bg-paper">
        {list.map((item) => (
          <article key={item.id} className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <Badge tone="muted">{kindLabel[item.kind]}</Badge>
              <time className="text-[11px] text-mist-gray">{item.date}</time>
            </div>
            <h3 className="mt-1.5 text-[14px] font-semibold leading-snug">
              {item.title}
            </h3>
            <p className="mt-1 text-[13px] text-slate-gray">{item.summary}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
