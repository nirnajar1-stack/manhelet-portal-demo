import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  Download,
  Gift,
  Heart,
  MapPin,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/card'
import { programs } from '@/data/mock'
import { visibleUnits } from '@/lib/access'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import type { ProgramItem } from '@/types'

type ProgramTab = 'all' | 'respite' | 'workshop' | 'benefit'

const tabs: { id: ProgramTab; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'respite', label: 'הפוגה ונופש' },
  { id: 'workshop', label: 'סדנאות ותמיכה רגשית' },
  { id: 'benefit', label: 'הטבות ומענקים' },
]

export function Programs() {
  const { currentUser } = useApp()
  const [tab, setTab] = useState<ProgramTab>('all')
  const [query, setQuery] = useState('')
  const [regStatus, setRegStatus] = useState('all')

  const units = visibleUnits(currentUser)
  const filtered = useMemo(() => {
    let list = [...programs]
    if (tab !== 'all') list = list.filter((p) => p.kind === tab)
    if (regStatus !== 'all') {
      list = list.filter((p) => p.registrationStatus === regStatus)
    }
    const q = query.trim()
    if (q) {
      list = list.filter(
        (p) => p.title.includes(q) || p.summary.includes(q) || p.location.includes(q),
      )
    }
    return list
  }, [tab, query, regStatus])

  const counts = {
    all: programs.length,
    respite: programs.filter((p) => p.kind === 'respite').length,
    workshop: programs.filter((p) => p.kind === 'workshop').length,
    benefit: programs.filter((p) => p.kind === 'benefit').length,
  }

  return (
    <div className="space-y-5 motion-fade-in">
      <div className="text-[12px] text-slate-gray">
        תיקי מת״ם › מרחב דרום › תוכניות, אירועים והטבות
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-ink-navy text-balance">
            תוכניות, אירועים והטבות
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-slate-gray">
            ניהול ונגישות להפוגות, פעילויות קהילתיות והטבות שיקום ליחידות במרחב
            — רישום יזום ומעקב מימוש זכויות.
          </p>
        </div>
        <Button size="sm">+ הקצאת הטבה / רישום לאירוע</Button>
      </div>

      <div
        className="flex gap-1 overflow-x-auto"
        role="tablist"
        aria-label="סוגי תוכניות"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'min-h-9 shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-200',
              tab === t.id
                ? 'bg-dusk-blue text-ink-navy'
                : 'bg-paper text-slate-gray shadow-soft hover:bg-soft-cyan',
            )}
          >
            {t.label} ({counts[t.id]})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש תוכנית…"
            className="max-w-xs"
          />
          <select
            value={regStatus}
            onChange={(e) => setRegStatus(e.target.value)}
            className="h-9 rounded-md border border-hairline bg-paper px-2 text-[12px]"
            aria-label="סטטוס רישום"
          >
            <option value="all">סטטוס רישום</option>
            <option value="open">פתוח לרישום</option>
            <option value="closing">נסגר בקרוב</option>
            <option value="active">זכאות פעילה</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <Download className="h-3.5 w-3.5" />
            ייצוא לאקסל
          </Button>
          <Button size="sm">+ רישום יזום למשפחה</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {filtered.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
          {filtered.length === 0 && (
            <Panel>
              <p className="text-[14px] text-slate-gray">לא נמצאו תוכניות לסינון.</p>
            </Panel>
          )}
        </div>

        <div className="space-y-3">
          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">מדד מימוש זכויות</h3>
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-signal-blue border-e-pebble border-b-pebble">
              <div className="text-center">
                <div className="text-[22px] font-bold text-ink-navy">82%</div>
                <div className="text-[10px] text-mist-gray">מימוש</div>
              </div>
            </div>
            <p className="mt-3 text-center text-[12px] text-slate-gray">
              {Math.min(units.length, 10)}/{Math.max(units.length, 12)} יחידות
              פעילות עם מימוש הטבה
            </p>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">
              משימות טיפול מהיר (3)
            </h3>
            <ul className="space-y-2">
              <li className="flex gap-2 rounded-md bg-danger-bg px-2.5 py-2 text-[12px]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                <span>
                  <strong>היום:</strong> סגירת רישום להפוגת סוף שבוע
                </span>
              </li>
              <li className="flex gap-2 rounded-md bg-warning-bg px-2.5 py-2 text-[12px]">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-text" />
                <span>
                  <strong>מחר:</strong> שליחת הצעה לסדנת צילום
                </span>
              </li>
              <li className="flex gap-2 rounded-md bg-pebble px-2.5 py-2 text-[12px]">
                <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-blue" />
                <span>פתיחת בקשת מענק ציוד ליחידה</span>
              </li>
            </ul>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">התאמות מיוחדות</h3>
            <ul className="space-y-2 text-[12px] text-slate-gray">
              <li className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-danger" />
                רגישויות מזון
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-signal-blue" />
                הסעה נגישה
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-success" />
                ליווי טיפולי צמוד
              </li>
            </ul>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-2 text-[14px] font-semibold">נהלים רלוונטיים</h3>
            <ul className="space-y-1.5 text-[12px]">
              <li>
                <Link to="/knowledge" className="font-medium text-signal-blue hover:underline">
                  הוראת שעה 2/ב — הפוגות
                </Link>
              </li>
              <li>
                <Link to="/knowledge" className="font-medium text-signal-blue hover:underline">
                  נוהל הקצאת הטבות שיקום
                </Link>
              </li>
            </ul>
            <Link
              to="/knowledge"
              className="mt-3 inline-flex text-[12px] font-semibold text-ink-navy hover:underline"
            >
              לכלל מרכז הידע ›
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function ProgramCard({ program }: { program: ProgramItem }) {
  const Icon =
    program.kind === 'respite'
      ? CalendarDays
      : program.kind === 'workshop'
        ? Camera
        : Gift

  const statusTone =
    program.registrationStatus === 'open'
      ? 'success'
      : program.registrationStatus === 'closing'
        ? 'warning'
        : 'info'

  const statusLabel =
    program.registrationStatus === 'open'
      ? 'פתוח לרישום'
      : program.registrationStatus === 'closing'
        ? 'נסגר בעוד ימים ספורים'
        : 'זכאות פעילה'

  return (
    <Panel className="!p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-badge-bg text-signal-blue">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-bold text-ink-navy">{program.title}</h2>
              <Badge tone={statusTone}>{statusLabel}</Badge>
              {program.kindLabel && <Badge tone="muted">{program.kindLabel}</Badge>}
            </div>
            <p className="mt-1 text-[13px] text-slate-gray">{program.summary}</p>
          </div>
        </div>
        {program.dateLabel && (
          <span className="shrink-0 rounded-md bg-pebble px-2.5 py-1 text-[12px] font-medium text-slate-gray">
            {program.dateLabel}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Meta label="קהל יעד" value={program.audience} />
        <Meta label="מיקום" value={program.location} />
        <Meta label="ליווי מקצועי" value={program.support} />
      </div>

      {typeof program.utilization === 'number' && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[12px]">
            <span className="text-slate-gray">ניצול מקומות</span>
            <span className="font-semibold">{program.utilization}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-pebble">
            <div
              className="h-full rounded-full bg-ink-navy"
              style={{ width: `${program.utilization}%` }}
            />
          </div>
        </div>
      )}

      {program.amountLabel && (
        <div className="mt-4 rounded-md bg-success-bg px-3 py-3">
          <div className="text-[20px] font-bold text-success">{program.amountLabel}</div>
          <p className="text-[12px] text-slate-gray">תקרת מענק ליחידת טיפול</p>
          <Button size="sm" className="mt-2">
            פתיחת בקשה חדשה ליחידה
          </Button>
        </div>
      )}

      {program.unitStatuses && program.unitStatuses.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-semibold text-slate-gray">
            יחידות רשומות / בטיפול
          </p>
          <ul className="space-y-1.5">
            {program.unitStatuses.map((u) => (
              <li
                key={u.familyName}
                className="flex items-center justify-between rounded-md bg-pebble/60 px-2.5 py-1.5 text-[12px]"
              >
                <span className="font-medium">משפחת {u.familyName}</span>
                <InterestPill status={u.status} />
              </li>
            ))}
          </ul>
          {program.note && (
            <p className="mt-2 text-[12px] font-medium text-danger">{program.note}</p>
          )}
        </div>
      )}

      {program.participants && program.participants.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-semibold text-slate-gray">משתתפים</p>
          <ul className="space-y-1.5">
            {program.participants.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-md border border-hairline px-2.5 py-1.5 text-[12px]"
              >
                <span>{p.name}</span>
                {p.action ? (
                  <Button size="sm" variant="soft" className="h-7">
                    {p.action}
                  </Button>
                ) : (
                  <Badge tone="muted">{p.status}</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-pebble/70 px-3 py-2">
      <div className="text-[11px] text-mist-gray">{label}</div>
      <div className="text-[13px] font-medium">{value}</div>
    </div>
  )
}

function InterestPill({
  status,
}: {
  status: 'interested' | 'hesitant' | 'declined'
}) {
  if (status === 'interested') return <Badge tone="success">מעוניינים</Badge>
  if (status === 'hesitant') return <Badge tone="warning">מהססים</Badge>
  return <Badge tone="muted">לא מעוניינים</Badge>
}
