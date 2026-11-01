import { useEffect, useMemo, useState } from 'react'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Panel } from '@/components/ui/card'
import { fetchOrgNews } from '@/api/stubs'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold md:text-[38px] md:leading-[1.21]">
          בית המנהלת
        </h1>
        <p className="mt-2 text-[16px] text-slate-gray">
          חדשות, הודעות, אירועים, יוזמות, נהלים וכלים — הבית הארגוני.
        </p>
      </div>

      <AssumptionBanner>
        כל התוכן כאן הוא דמה ואינו משקף אירועים רגישים או פרטים אמיתיים.
      </AssumptionBanner>

      {pinned && (
        <Panel elevated className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -end-8 top-0 h-32 w-32 rounded-full bg-sky-cyan/15 blur-2xl"
            aria-hidden
          />
          <Badge tone="info">{kindLabel[pinned.kind]}</Badge>
          <h2 className="mt-3 text-[22px] font-bold">{pinned.title}</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-slate-gray">
            {pinned.summary}
          </p>
          <p className="mt-3 text-[12px] text-mist-gray">{pinned.date}</p>
        </Panel>
      )}

      <div className="flex gap-1 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
              filter === f
                ? 'bg-badge-bg text-signal-blue'
                : 'text-slate-gray hover:bg-pebble'
            }`}
          >
            {f === 'all' ? 'הכל' : kindLabel[f]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-hairline bg-paper p-5 shadow-soft"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge tone="muted">{kindLabel[item.kind]}</Badge>
              <time className="text-[12px] text-mist-gray">{item.date}</time>
            </div>
            <h3 className="mt-3 text-[16px] font-semibold leading-snug">
              {item.title}
            </h3>
            <p className="mt-2 text-[14px] text-slate-gray">{item.summary}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
