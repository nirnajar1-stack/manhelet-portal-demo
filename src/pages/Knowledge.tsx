import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  Download,
  FileText,
  Gavel,
  HeartPulse,
  Home,
  Search,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/card'
import { fetchKnowledge } from '@/api/stubs'
import { orgNews } from '@/data/mock'
import { cn } from '@/lib/utils'
import type { KnowledgeItem } from '@/types'

const libraries = [
  {
    id: 'econ',
    title: 'מעטפת כלכלית',
    desc: 'מענקים ומחיה',
    icon: Wallet,
    docs: ['נוהל מענקי קיום', 'טבלת זכאויות'],
  },
  {
    id: 'housing',
    title: 'דיור',
    desc: 'מגורים ואירוח זמני',
    icon: Home,
    docs: ['סיוע דיור זמני', 'הארכת סבסוד'],
  },
  {
    id: 'health',
    title: 'רפואה',
    desc: 'בריאות גוף ונפש',
    icon: HeartPulse,
    docs: ['מסלולי טיפול', 'תיאום קופות'],
  },
  {
    id: 'work',
    title: 'תעסוקה',
    desc: 'שיקום והשכלה גבוהה',
    icon: BriefcaseBusiness,
    docs: ['ליווי תעסוקתי', 'מלגות לימודים'],
  },
  {
    id: 'exceptions',
    title: 'ועדות חריגים',
    desc: 'מקרים מיוחדים וסמכויות',
    icon: Gavel,
    docs: ['נוהל ועדה מואצת', 'טופס חריג'],
  },
]

const fieldTools = [
  { title: 'טופס בקשת חריג', kind: 'PDF', icon: FileText },
  { title: 'מחשבון זכאות דיור', kind: 'כלי', icon: Calculator },
  { title: 'תבנית סיכום ביקור', kind: 'DOC', icon: FileText },
  { title: 'רשימת בדיקה לוועדה', kind: 'PDF', icon: BookOpen },
]

const quickTags = [
  'סיוע בדיור',
  'מענק הסתגלות ראשוני',
  'ועדת חריגים',
  'ליווי תעסוקתי',
  'טיפול נפשי',
]

export function Knowledge() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    void fetchKnowledge().then(setItems)
  }, [])

  const featured = items[0]
  const policyUpdates = orgNews
    .filter((o) => o.kind === 'procedure' || o.kind === 'news' || o.kind === 'leadership')
    .slice(0, 4)

  const filteredLibs = useMemo(() => {
    if (!query.trim()) return libraries
    return libraries.filter(
      (l) =>
        l.title.includes(query) ||
        l.desc.includes(query) ||
        l.docs.some((d) => d.includes(query)),
    )
  }, [query])

  return (
    <div className="space-y-5 motion-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-ink-navy text-balance">
            מרכז ידע ונהלים
          </h1>
          <p className="mt-1 text-[13px] text-slate-gray">
            חיפוש בהוראות שעה, תקנות ונוהלי סיוע לעבודת המת״ם.
          </p>
        </div>
        <Badge tone="success">נהלים בתוקף מלא</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Panel className="!p-5">
            <h2 className="mb-3 text-[16px] font-semibold">
              חיפוש בהוראות שעה, תקנות ונוהלי סיוע
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-gray" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="חיפוש נוהל, תחום או מילת מפתח…"
                  className="pe-10"
                  aria-label="חיפוש נהלים"
                />
              </div>
              <Button>איתור נוהל</Button>
            </div>
            <div className="chip-row mt-3" role="list" aria-label="תגיות חיפוש מהיר">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  role="listitem"
                  aria-pressed={query === tag}
                  onClick={() => setQuery(tag)}
                  className={cn(
                    'min-h-9 cursor-pointer rounded-full border border-hairline bg-soft-cyan px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-slate-gray transition-colors duration-200 hover:border-dusk-blue/50 hover:text-ink-navy',
                    query === tag &&
                      'border-gold bg-gold-wash text-ink-navy',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="!p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="info">נוהל מומלץ</Badge>
              <span className="text-[12px] text-mist-gray">עדכון 2025</span>
            </div>
            <h2 className="text-[18px] font-bold text-ink-navy">
              {featured?.title ?? 'עדכון נוהל סיוע בדיור זמני — 2025'}
            </h2>
            <p className="mt-2 text-[14px] text-slate-gray">
              {featured?.summary ??
                'סיכום השינויים העיקריים בנוהל הסיוע בדיור זמני ליחידות טיפול.'}
            </p>
            <div className="mt-3 rounded-md bg-badge-bg/70 px-3 py-3 text-[13px]">
              <ul className="space-y-1.5 text-ink-navy">
                <li>✓ הארכת תקופת סבסוד ל־6 חודשים במקרים מאושרים</li>
                <li>✓ מסלול מואץ לוועדת חריגים דיור</li>
                <li>✓ דרישת תיעוד מקוצר מול מולקולת הדיור</li>
              </ul>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm">פתיחת הנוהל המלא</Button>
              <Button size="sm" variant="outline">
                <Download className="h-3.5 w-3.5" />
                הורדת PDF רשמי
              </Button>
            </div>
          </Panel>

          <div>
            <h2 className="mb-3 text-[16px] font-semibold">
              ספריות נהלים לפי תחומי סיוע
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredLibs.map((lib) => (
                <Panel key={lib.id} className="!p-4">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-badge-bg text-signal-blue">
                    <lib.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-[14px] font-semibold">{lib.title}</h3>
                  <p className="mt-0.5 text-[12px] text-slate-gray">{lib.desc}</p>
                  <ul className="mt-3 space-y-1">
                    {lib.docs.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-1.5 text-[12px] text-signal-blue"
                      >
                        <FileText className="h-3 w-3 text-danger" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </Panel>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-[16px] font-semibold">
              טפסים, קבצי עבודה ומחשבוני שטח
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fieldTools.map((t) => (
                <Panel key={t.title} className="!p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <t.icon className="h-4 w-4 text-ink-navy" />
                    <Badge tone="muted">{t.kind}</Badge>
                  </div>
                  <p className="text-[13px] font-semibold leading-snug">{t.title}</p>
                  <button
                    type="button"
                    className="mt-2 text-[12px] font-semibold text-signal-blue hover:underline"
                  >
                    הורדה
                  </button>
                </Panel>
              ))}
            </div>
          </div>

          {items.length > 0 && (
            <Panel className="!p-4">
              <h2 className="mb-3 text-[14px] font-semibold">פריטי ידע מהמערכת</h2>
              <ul className="divide-y divide-hairline">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div>
                      <div className="text-[13px] font-semibold">{item.title}</div>
                      <p className="text-[12px] text-slate-gray">{item.summary}</p>
                    </div>
                    <Badge tone="muted">{item.category}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="space-y-3">
          <Panel className="!p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold">עוזר ידע AI למת״ם</h3>
              <Badge tone="info">RAG</Badge>
            </div>
            <div className="rounded-md bg-pebble px-3 py-2 text-[12px] text-slate-gray">
              «מה התנאים להארכת סבסוד דיור זמני?»
            </div>
            <div className="mt-2 rounded-md border border-hairline bg-badge-bg/40 px-3 py-2 text-[12px] leading-relaxed">
              לפי נוהל סיוע דיור, הארכה עד 6 חודשים מותנית באישור ועדת חריגים
              ובתיעוד צורך משפחתי.
              <div className="mt-2 text-[11px] font-medium text-signal-blue">
                מקור: סעיף 4.2 בנוהל סיוע דיור (2025)
              </div>
            </div>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">
              מוקד מענה וליווי מקצועי
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'עדי טל ארז', role: 'רכזת ידע מרחבית' },
                { name: 'דנה שפירא', role: 'ייעוץ נהלים' },
              ].map((p) => (
                <li key={p.name} className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold">{p.name}</div>
                    <div className="text-[11px] text-mist-gray">{p.role}</div>
                  </div>
                  <div className="flex gap-2 text-signal-blue">
                    <span className="text-[11px] font-medium">שיחה</span>
                    <span className="text-[11px] font-medium">מייל</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">
              עדכוני מדיניות מהשבוע החולף
            </h3>
            <ul className="space-y-3">
              {policyUpdates.map((u) => (
                <li key={u.id} className="border-b border-hairline pb-2 last:border-0 last:pb-0">
                  <div className="text-[11px] text-mist-gray">{u.date}</div>
                  <div className="text-[13px] font-semibold leading-snug">
                    {u.title}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-gray">{u.summary}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
