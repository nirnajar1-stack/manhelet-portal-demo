import { useEffect, useState } from 'react'
import { BookOpen, Wrench } from 'lucide-react'
import { Panel } from '@/components/ui/card'
import { fetchKnowledge } from '@/api/stubs'
import type { KnowledgeItem } from '@/types'

export function Knowledge() {
  const [items, setItems] = useState<KnowledgeItem[]>([])

  useEffect(() => {
    void fetchKnowledge().then(setItems)
  }, [])

  const procedures = items.filter((i) => i.category === 'נהלים')
  const tools = items.filter((i) => i.category === 'כלים')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">ידע וכלים</h1>
        <p className="mt-1 text-[14px] text-slate-gray">
          נהלים מקצועיים וכלים יומיומיים לעבודת המת״ם.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-signal-blue" />
            <h2 className="text-[18px] font-semibold">נהלים</h2>
          </div>
          <ul className="space-y-3">
            {procedures.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-hairline px-3 py-3 hover:bg-pebble/50"
              >
                <div className="font-semibold">{p.title}</div>
                <p className="mt-1 text-[13px] text-slate-gray">{p.summary}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-signal-blue" />
            <h2 className="text-[18px] font-semibold">כלים</h2>
          </div>
          <ul className="space-y-3">
            {tools.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-hairline px-3 py-3 hover:bg-pebble/50"
              >
                <div className="font-semibold">{p.title}</div>
                <p className="mt-1 text-[13px] text-slate-gray">{p.summary}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
