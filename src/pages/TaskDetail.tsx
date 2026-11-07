import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Mail,
  Phone,
  Printer,
  Users,
} from 'lucide-react'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import {
  getMember,
  getUnit,
  getUser,
  priorityLabel,
  statusLabel,
} from '@/data/mock'
import {
  CLOSE_DOCUMENTATION_MIN_CHARS,
  applyChatterViewFilter,
  canCloseTask,
  canPostInternalChatter,
  canViewInternalChatter,
  canViewTask,
} from '@/lib/access'
import { formatRelativeHe, cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import type { ChatterMessage, ChatterVisibility, Task, TaskStatus } from '@/types'

export function TaskDetail() {
  const { taskId } = useParams()
  const {
    getTask,
    loadChatter,
    addChatter,
    changeStatus,
    toggleNeedsAttention,
    closeTask,
    currentUser,
    refreshTasks,
  } = useApp()
  const [task, setTask] = useState<Task | null>(null)
  const [messages, setMessages] = useState<ChatterMessage[]>([])
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<ChatterVisibility>('shared')
  const [techOpen, setTechOpen] = useState(false)
  const [chatterFilter, setChatterFilter] = useState<'all' | ChatterVisibility>(
    'all',
  )
  const [closeOpen, setCloseOpen] = useState(false)
  const [closeDoc, setCloseDoc] = useState('')
  const [closeError, setCloseError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    if (!taskId) return
    void (async () => {
      const t = await getTask(taskId)
      if (!t || !canViewTask(currentUser, t)) {
        setTask(null)
        setForbidden(true)
        setMessages([])
        return
      }
      setForbidden(false)
      setTask(t)
      setMessages(await loadChatter(t.id))
    })()
  }, [taskId, getTask, loadChatter, currentUser])

  const canSeeInternal = canViewInternalChatter(currentUser)
  const isMatam = currentUser.role === 'matam'

  const viewTabs = useMemo(() => {
    const tabs: { id: 'all' | ChatterVisibility; label: string }[] = [
      { id: 'all', label: 'הכול' },
      { id: 'shared', label: 'משותפת' },
    ]
    if (canSeeInternal) tabs.push({ id: 'internal', label: 'פנימית' })
    return tabs
  }, [canSeeInternal])

  const visibleMessages = applyChatterViewFilter(messages, chatterFilter)

  if (forbidden) {
    return (
      <Panel>
        <p className="text-[14px] text-slate-gray">
          אין הרשאה לצפות במשימה זו לפי שיוך יחידות הטיפול.
        </p>
        <Link to="/tasks" className="mt-3 inline-flex text-signal-blue hover:underline">
          חזרה למרכז המשימות
        </Link>
      </Panel>
    )
  }

  if (!task) {
    return (
      <p className="text-[14px] text-slate-gray">טוען משימה… או שלא נמצאה.</p>
    )
  }

  const unit = getUnit(task.unitId)
  const member = getMember(task.unitId, task.memberId)
  const owner = getUser(task.ownerId)
  const creator = getUser(task.creatorId)
  const participants = task.participantIds.map(getUser).filter(Boolean)
  const waiting = task.waitingOnIds.map(getUser).filter(Boolean)

  const created = new Date(task.createdAt)
  const due = task.dueDate ? new Date(task.dueDate) : null
  const nowMs = new Date(task.updatedAt).getTime()
  const daysOpen = Math.max(
    1,
    Math.round((nowMs - created.getTime()) / 86400000),
  )
  const slaTargetDays = 7
  const progress = Math.min(100, Math.round((daysOpen / slaTargetDays) * 100))

  async function onReply() {
    if (!body.trim() || !task) return
    await addChatter(task.id, body.trim(), visibility)
    setBody('')
    setMessages(await loadChatter(task.id))
    const t = await getTask(task.id)
    setTask(t ?? null)
  }

  async function onStatus(status: TaskStatus) {
    if (!task) return
    await changeStatus(task.id, status)
    await refreshTasks()
    const t = await getTask(task.id)
    setTask(t ?? null)
  }

  async function onToggleAttention() {
    if (!task) return
    await toggleNeedsAttention(task.id, !task.needsAttention)
    const t = await getTask(task.id)
    setTask(t ?? null)
  }

  async function onConfirmClose() {
    if (!task) return
    if (closeDoc.trim().length < CLOSE_DOCUMENTATION_MIN_CHARS) {
      setCloseError(
        `נדרש תיעוד של לפחות ${CLOSE_DOCUMENTATION_MIN_CHARS} תווים`,
      )
      return
    }
    setCloseError(null)
    const ok = await closeTask(task.id, closeDoc)
    if (ok) {
      setCloseOpen(false)
      setCloseDoc('')
      setMessages(await loadChatter(task.id))
      const t = await getTask(task.id)
      setTask(t ?? null)
    }
  }

  return (
    <div className="space-y-4 motion-fade-in">
      <div className="text-[12px] text-slate-gray">
        <Link to="/tasks" className="hover:text-ink-navy hover:underline">
          מרכז המשימות
        </Link>
        <span className="mx-1">/</span>
        <Link to={`/units/${task.unitId}`} className="hover:text-ink-navy">
          יחידת טיפול {unit?.familyName}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-ink-navy">
          {task.number} — {task.title}
        </span>
      </div>

      <Panel className="!p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-bold text-mist-gray">
                #{task.number}
              </span>
              <Badge
                tone={
                  task.status === 'waiting'
                    ? 'warning'
                    : task.status === 'done' || task.status === 'closed'
                      ? 'success'
                      : 'info'
                }
              >
                {statusLabel[task.status]}
                {waiting[0] ? ` — ${waiting[0]!.org ?? waiting[0]!.name}` : ''}
              </Badge>
              {task.needsAttention && <Badge tone="danger">דורש טיפול</Badge>}
              <Badge tone="danger">{priorityLabel[task.priority]}</Badge>
            </div>
            <h1 className="mt-2 text-[22px] font-bold leading-snug text-ink-navy md:text-[24px]">
              {task.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-gray">
              <span>
                קהילה:{' '}
                <Link
                  to={`/units/${task.unitId}`}
                  className="font-semibold text-signal-blue hover:underline"
                >
                  משפחת {unit?.familyName}
                  {unit ? ` · ${unit.region}` : ''}
                </Link>
              </span>
              <span>
                אחראי: <strong className="text-ink-navy">{owner?.name}</strong>
              </span>
              <span>
                מולקולה:{' '}
                <strong className="text-ink-navy">
                  {waiting[0]?.name ?? participants[0]?.name ?? '—'}
                </strong>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-mist-gray">
              <span>נוצר: {task.createdAt.slice(0, 10)}</span>
              <span>
                יעד: {task.dueDate ?? '—'}
                {due
                  ? ` (${Math.ceil((due.getTime() - nowMs) / 86400000)} ימים)`
                  : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isMatam ? (
              <>
                <Button size="sm" onClick={() => onStatus('in_progress')}>
                  עדכון סטטוס
                </Button>
                <Button size="sm" variant="outline">
                  העברת אחריות
                </Button>
                {canCloseTask(currentUser) && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => setCloseOpen(true)}
                  >
                    סגירת משימה
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void onToggleAttention()}
                  aria-label="הדפסה / דורש טיפול"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <AssumptionBanner>
                כמולקולה ניתן להגיב — ללא שינוי סטטוס או סגירה.
              </AssumptionBanner>
            )}
          </div>
        </div>

        {closeOpen && (
          <div className="mt-4 space-y-3 rounded-lg border border-hairline bg-cloud p-4">
            <h3 className="text-[15px] font-semibold">סגירת משימה עם תיעוד</h3>
            <p className="text-[13px] text-slate-gray">
              נדרש תיעוד Chatter של לפחות {CLOSE_DOCUMENTATION_MIN_CHARS} תווים
              לפני סגירה.
            </p>
            <Textarea
              value={closeDoc}
              onChange={(e) => {
                setCloseDoc(e.target.value)
                setCloseError(null)
              }}
              placeholder="תארו את סיכום הטיפול והסיבה לסגירה…"
              aria-label="תיעוד סגירה"
            />
            <p className="text-[12px] text-mist-gray">
              {closeDoc.trim().length}/{CLOSE_DOCUMENTATION_MIN_CHARS} תווים
              מינימום
            </p>
            {closeError && (
              <p className="text-[13px] text-danger" role="alert">
                {closeError}
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void onConfirmClose()}>
                אישור סגירה
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCloseOpen(false)
                  setCloseError(null)
                }}
              >
                ביטול
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Panel>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold">פרטי המשימה ורקע</h2>
              <Badge tone="muted">
                {task.domain} › {task.subDomain}
              </Badge>
            </div>
            <p className="text-[14px] leading-relaxed text-slate-gray">
              {task.description}
            </p>
            <div className="mt-4 rounded-md border border-hairline bg-pebble/50 p-3">
              <p className="mb-2 text-[12px] font-semibold text-slate-gray">
                קבצים מצורפים
              </p>
              <ul className="space-y-2">
                <li className="flex items-center justify-between text-[13px]">
                  <span className="font-medium">מכתב בקשה.pdf</span>
                  <Button size="sm" variant="soft">
                    הורדה
                  </Button>
                </li>
                <li className="flex items-center justify-between text-[13px]">
                  <span className="font-medium">אישור גורם מקצועי.pdf</span>
                  <Button size="sm" variant="soft">
                    הורדה
                  </Button>
                </li>
              </ul>
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[16px] font-semibold">
                  תקשורת משותפת עם מולקולות
                </h2>
                <Badge tone="muted">{visibleMessages.length}</Badge>
                {canSeeInternal && (
                  <Badge tone="warning">
                    <Lock className="me-1 inline h-3 w-3" />
                    כולל פנימי
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {viewTabs.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setChatterFilter(f.id)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[12px] font-medium',
                      chatterFilter === f.id
                        ? 'bg-dusk-blue text-ink-navy'
                        : 'text-slate-gray hover:bg-soft-cyan',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {!canSeeInternal && (
              <AssumptionBanner className="mb-4">
                מולקולה רואה רק הודעות משותפות. תצוגת «הכול» מסננת תצוגה בלבד.
              </AssumptionBanner>
            )}
            {canSeeInternal && (
              <AssumptionBanner className="mb-4">
                הפרדת Chatter (משותפת / פנימית) דורשת בדיקה מול Salesforce לפני
                ייצור.
              </AssumptionBanner>
            )}

            <div className="mb-4 space-y-2 rounded-lg border border-hairline bg-cloud/60 p-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('shared')}
                  className={cn(
                    'rounded-md px-2 py-1 text-[12px] font-medium',
                    visibility === 'shared'
                      ? 'bg-badge-bg text-signal-blue'
                      : 'text-slate-gray',
                  )}
                >
                  משותפת
                </button>
                {canPostInternalChatter(currentUser) && (
                  <button
                    type="button"
                    onClick={() => setVisibility('internal')}
                    className={cn(
                      'rounded-md px-2 py-1 text-[12px] font-medium',
                      visibility === 'internal'
                        ? 'bg-warning-bg text-warning-text'
                        : 'text-slate-gray',
                    )}
                  >
                    פנימית
                  </button>
                )}
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="כתבו עדכון לשיתוף עם המולקולה…"
                aria-label="תגובה חדשה"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {participants.slice(0, 2).map((p) => (
                    <Badge key={p!.id} tone="info">
                      {p!.org ?? p!.name}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={() => void onReply()}
                  disabled={!body.trim()}
                >
                  פרסום תגובה
                </Button>
              </div>
            </div>

            <ul className="space-y-3">
              {visibleMessages.map((m) => {
                const author = getUser(m.authorId)
                return (
                  <li
                    key={m.id}
                    className="rounded-lg border border-hairline bg-paper p-3"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pebble text-[11px] font-bold">
                        {author?.avatarInitials ?? '?'}
                      </span>
                      <span className="text-[13px] font-semibold">
                        {author?.name ?? 'משתמש'}
                      </span>
                      <span className="text-[12px] text-mist-gray">
                        {formatRelativeHe(m.createdAt)}
                      </span>
                      {m.visibility === 'internal' ? (
                        <Badge tone="warning">
                          <Lock className="me-1 inline h-3 w-3" />
                          פנימי
                        </Badge>
                      ) : (
                        <Badge tone="info">
                          <Users className="me-1 inline h-3 w-3" />
                          משותף
                        </Badge>
                      )}
                    </div>
                    <p className="text-[14px] leading-relaxed">{m.body}</p>
                  </li>
                )
              })}
              {visibleMessages.length === 0 && (
                <li className="text-[14px] text-slate-gray">
                  אין הודעות בתצוגה זו
                </li>
              )}
            </ul>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">שיוך ותיק ראשי</h3>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-navy text-[13px] font-bold text-paper">
                {member?.name?.slice(0, 1) ?? unit?.familyName.slice(0, 1)}
              </span>
              <div>
                <div className="text-[14px] font-semibold">
                  {member?.name ?? `משפחת ${unit?.familyName}`}
                </div>
                <p className="text-[12px] text-slate-gray">
                  {member?.relation ?? 'יחידת טיפול'} · {unit?.region}
                </p>
                {member?.phone && (
                  <p className="mt-1 text-[12px] text-mist-gray">{member.phone}</p>
                )}
              </div>
            </div>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">צוות מעורב</h3>
            <ul className="space-y-2">
              {[
                { label: 'מת״ם', user: owner },
                { label: 'יוצר', user: creator },
                ...participants.map((p) => ({
                  label: p!.org ?? 'מולקולה',
                  user: p,
                })),
              ].map((row, idx) => (
                <li
                  key={`${row.label}-${idx}`}
                  className="flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-[12px] text-mist-gray">{row.label}</div>
                    <div className="text-[13px] font-medium">
                      {row.user?.name ?? '—'}
                    </div>
                  </div>
                  <div className="flex gap-1 text-slate-gray">
                    <Phone className="h-3.5 w-3.5" />
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">ביצוע ולוחות זמנים</h3>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-md bg-pebble px-3 py-2 text-center">
                <div className="text-[22px] font-bold tabular-nums">{daysOpen}</div>
                <div className="text-[11px] text-slate-gray">ימי טיפול</div>
              </div>
              <div className="rounded-md bg-pebble px-3 py-2 text-center">
                <div className="text-[22px] font-bold tabular-nums">
                  {task.hasNewReply ? 0 : 2}
                </div>
                <div className="text-[11px] text-slate-gray">מיום התראה</div>
              </div>
            </div>
            <div className="mb-1 flex justify-between text-[11px] text-slate-gray">
              <span>התקדמות מול יעד SLA ({slaTargetDays} ימים)</span>
              <span className="font-semibold text-ink-navy">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-pebble">
              <div
                className="h-full rounded-full bg-signal-blue"
                style={{ width: `${progress}%` }}
              />
            </div>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-1 text-[13px] font-semibold">מידע נוהלי</h3>
            <p className="text-[12px] leading-relaxed text-slate-gray">
              נוהל טיפול מואץ בוועדות חריגים — ראו מרכז הידע לנוסח המלא.
            </p>
            <Link
              to="/knowledge"
              className="mt-2 inline-flex text-[12px] font-semibold text-signal-blue hover:underline"
            >
              למעבר למרכז הידע ›
            </Link>
          </Panel>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-hairline bg-paper px-3 py-2 text-[12px] font-medium shadow-soft"
            onClick={() => setTechOpen((v) => !v)}
          >
            מידע טכני
            {techOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {techOpen && (
            <dl className="grid gap-2 rounded-lg border border-hairline bg-paper p-3 text-[12px] text-slate-gray shadow-soft">
              <div>
                <dt>מזהה פנימי</dt>
                <dd className="font-mono text-ink-navy">{task.id}</dd>
              </div>
              <div>
                <dt>עודכן</dt>
                <dd className="text-ink-navy">{formatRelativeHe(task.updatedAt)}</dd>
              </div>
              <div>
                <dt>מקור נתונים</dt>
                <dd className="text-ink-navy">Mock / stub (לא Salesforce)</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}
