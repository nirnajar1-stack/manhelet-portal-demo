import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TaskList } from '@/components/tasks/TaskList'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Panel } from '@/components/ui/card'
import { visibleTasks, visibleUnits } from '@/lib/access'
import { cn, formatRelativeHe } from '@/lib/utils'
import { useApp } from '@/state/AppContext'

type Mode = 'ops' | 'coord'

export function MoleculeHome() {
  const { currentUser, tasks, refreshTasks, setRole } = useApp()
  const [mode, setMode] = useState<Mode>('ops')

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  useEffect(() => {
    if (currentUser.role !== 'molecule') {
      setRole('molecule')
    }
  }, [currentUser.role, setRole])

  const myTasks = useMemo(
    () => visibleTasks(currentUser, tasks),
    [tasks, currentUser],
  )

  const waitingOnMe = myTasks.filter((t) =>
    t.waitingOnIds.includes(currentUser.id),
  )
  const open = myTasks.filter(
    (t) => t.status !== 'done' && t.status !== 'closed',
  )

  const relatedUnits = useMemo(
    () => visibleUnits(currentUser),
    [currentUser],
  )

  const blockers = myTasks.filter(
    (t) => t.needsAttention || t.status === 'waiting',
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold md:text-[38px] md:leading-[1.21]">
          סביבת מולקולה
        </h1>
        <p className="mt-2 text-[16px] text-slate-gray">
          שלום {currentUser.name.split(' ')[0]} · {currentUser.org} — טיפול שוטף
          ותכלול באותה סביבה.
        </p>
      </div>

      <AssumptionBanner>
        מולקולה אינה משנה סטטוס ואינה סוגרת משימות; אין גישה להודעות פנימיות גם
        בתצוגת «הכול».
      </AssumptionBanner>

      <div
        className="inline-flex rounded-md border border-hairline bg-paper p-1"
        role="tablist"
        aria-label="מצב עבודה"
      >
        {(
          [
            { id: 'ops', label: 'טיפול שוטף' },
            { id: 'coord', label: 'תכלול ומעקב' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'rounded-sm px-4 py-2 text-[14px] font-semibold',
              mode === m.id
                ? 'bg-signal-blue text-paper'
                : 'text-slate-gray hover:bg-pebble',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Metric label="ממתינות לי" value={waitingOnMe.length} />
        <Metric label="פתוחות אצלי" value={open.length} />
        <Metric label="יחידות קשורות" value={relatedUnits.length} />
      </div>

      {mode === 'ops' ? (
        <Panel className="!p-0 overflow-hidden">
          <div className="border-b border-hairline px-4 py-4 sm:px-6">
            <h2 className="text-[20px] font-semibold">משימות לטיפול</h2>
            <p className="mt-1 text-[13px] text-slate-gray">
              רכיבים משותפים עם מת״ם · ללא פעולות סטטוס · לפי שיוך יחידות
            </p>
          </div>
          <TaskList
            tasks={waitingOnMe.length ? waitingOnMe : open.slice(0, 8)}
            empty="אין משימות שממתינות למענה שלך כרגע"
          />
          <div className="border-t border-hairline px-4 py-3">
            <Link
              to="/tasks"
              className="text-[14px] font-semibold text-signal-blue hover:underline"
            >
              לכל המשימות
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="!p-0 overflow-hidden">
            <div className="border-b border-hairline px-4 py-4">
              <h2 className="text-[18px] font-semibold">חסמים ומעקב</h2>
            </div>
            <ul className="divide-y divide-hairline">
              {blockers.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/tasks/${t.id}`}
                    className="block px-4 py-3 hover:bg-pebble/70"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="muted">{t.number}</Badge>
                      <Badge tone="warning">{t.domain}</Badge>
                      {t.needsAttention && (
                        <Badge tone="danger">דורש טיפול</Badge>
                      )}
                    </div>
                    <div className="mt-1 font-semibold">{t.title}</div>
                    <div className="text-[12px] text-mist-gray">
                      {formatRelativeHe(t.updatedAt)}
                    </div>
                  </Link>
                </li>
              ))}
              {blockers.length === 0 && (
                <li className="px-4 py-8 text-center text-[14px] text-slate-gray">
                  אין חסמים פתוחים
                </li>
              )}
            </ul>
          </Panel>

          <Panel className="!p-0 overflow-hidden">
            <div className="border-b border-hairline px-4 py-4">
              <h2 className="text-[18px] font-semibold">יחידות במעקב</h2>
            </div>
            <ul className="divide-y divide-hairline">
              {relatedUnits.map((u) => (
                <li key={u.id}>
                  <Link
                    to={`/units/${u.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-pebble/70"
                  >
                    <span className="font-semibold">משפחת {u.familyName}</span>
                    <span className="text-[12px] text-slate-gray">
                      {u.openTasks} פתוחות
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-paper px-3 py-3 sm:px-4 sm:py-4">
      <div className="text-[22px] font-bold tabular-nums sm:text-[28px]">
        {value}
      </div>
      <div className="text-[12px] font-medium text-slate-gray sm:text-[14px]">
        {label}
      </div>
    </div>
  )
}
