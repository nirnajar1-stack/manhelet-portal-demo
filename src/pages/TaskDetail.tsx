import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Lock, Users } from 'lucide-react'
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
      // Access-filtered load — molecule never gets internal, even for "הכול"
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

  // View filter only — never expands beyond access-filtered messages
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
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="text-[13px] text-slate-gray">
        <Link to="/tasks" className="hover:text-ink-navy">
          משימות
        </Link>
        <span className="mx-1">/</span>
        <span>{task.number}</span>
      </div>

      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge tone="muted">{task.number}</Badge>
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
          </Badge>
          {task.needsAttention && <Badge tone="danger">דורש טיפול</Badge>}
          <Badge tone="warning">{priorityLabel[task.priority]}</Badge>
          <Badge tone="muted">
            {task.domain} · {task.subDomain}
          </Badge>
        </div>
        <h1 className="mt-3 text-[28px] font-bold leading-tight">{task.title}</h1>
        <p className="mt-2 text-[16px] text-slate-gray">{task.description}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Meta label="יחידת טיפול">
            <Link
              to={`/units/${task.unitId}`}
              className="font-semibold text-signal-blue hover:underline"
            >
              משפחת {unit?.familyName}
            </Link>
          </Meta>
          <Meta label="בן/בת משפחה">{member?.name ?? '—'}</Meta>
          <Meta label="אחראי ניהולי">{owner?.name ?? '—'}</Meta>
          <Meta label="יוצר">{creator?.name ?? '—'}</Meta>
          <Meta label="משתתפים">
            {participants.length
              ? participants.map((p) => p!.name).join(', ')
              : '—'}
          </Meta>
          <Meta label="ממתינים למענה">
            {waiting.length ? waiting.map((p) => p!.name).join(', ') : '—'}
          </Meta>
          <Meta label="תאריך יעד">{task.dueDate ?? '—'}</Meta>
          <Meta label="עודכן">{formatRelativeHe(task.updatedAt)}</Meta>
        </div>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-between rounded-md bg-pebble px-3 py-2 text-[13px] font-medium"
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
          <dl className="mt-2 grid gap-2 rounded-md border border-hairline p-3 text-[12px] text-slate-gray sm:grid-cols-2">
            <div>
              <dt>מזהה פנימי</dt>
              <dd className="font-mono text-ink-navy">{task.id}</dd>
            </div>
            <div>
              <dt>נוצר</dt>
              <dd className="text-ink-navy">{task.createdAt}</dd>
            </div>
            <div>
              <dt>מקור נתונים</dt>
              <dd className="text-ink-navy">Mock / stub (לא Salesforce)</dd>
            </div>
          </dl>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-3 text-[18px] font-semibold">פעולות</h2>
        {isMatam ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onStatus('in_progress')}>
              סמן בטיפול
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStatus('waiting')}>
              העבר להמתנה
            </Button>
            {canCloseTask(currentUser) && (
              <Button size="sm" variant="dark" onClick={() => setCloseOpen(true)}>
                סגור / השלם
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => void onToggleAttention()}>
              {task.needsAttention ? 'הסר דורש טיפול' : 'סמן דורש טיפול'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[14px] text-slate-gray">
              כמולקולה ניתן להגיב ולקדם פעולות — ללא שינוי סטטוס או סגירה.
            </p>
            <AssumptionBanner>
              הרשאות מולקולה (ללא שינוי סטטוס/סגירה) — הנחת מוצר מרכזית.
            </AssumptionBanner>
          </div>
        )}

        {closeOpen && (
          <div className="mt-4 space-y-3 rounded-lg border border-hairline bg-cloud p-4">
            <h3 className="text-[16px] font-semibold">סגירת משימה עם תיעוד</h3>
            <p className="text-[13px] text-slate-gray">
              נדרש תיעוד Chatter של לפחות {CLOSE_DOCUMENTATION_MIN_CHARS} תווים
              לפני סגירה (כלל עסקי מיושר ל־Salesforce).
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
              {closeDoc.trim().length}/{CLOSE_DOCUMENTATION_MIN_CHARS} תווים מינימום
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

      <Panel>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[18px] font-semibold">התכתבות</h2>
          <div className="flex gap-1">
            {viewTabs.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setChatterFilter(f.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[12px] font-medium',
                  chatterFilter === f.id
                    ? 'bg-badge-bg text-signal-blue'
                    : 'text-slate-gray hover:bg-pebble',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!canSeeInternal && (
          <AssumptionBanner className="mb-4">
            מולקולה רואה רק הודעות משותפות. תצוגת «הכול» מסננת תצוגה בלבד ואינה
            מעניקה גישה להודעות פנימיות.
          </AssumptionBanner>
        )}
        {canSeeInternal && (
          <AssumptionBanner className="mb-4">
            הפרדת Chatter (משותפת / פנימית) דורשת בדיקה מול Salesforce לפני ייצור.
          </AssumptionBanner>
        )}

        <ul className="space-y-3">
          {visibleMessages.map((m) => {
            const author = getUser(m.authorId)
            return (
              <li
                key={m.id}
                className="rounded-lg border border-hairline bg-cloud/80 p-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
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
            <li className="text-[14px] text-slate-gray">אין הודעות בתצוגה זו</li>
          )}
        </ul>

        <div className="mt-4 space-y-2 border-t border-hairline pt-4">
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
                    ? 'bg-warning-bg text-warning'
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
            placeholder="כתבו תגובה…"
            aria-label="תגובה חדשה"
          />
          <Button size="sm" onClick={() => void onReply()} disabled={!body.trim()}>
            שליחת תגובה (דמה)
          </Button>
        </div>
      </Panel>
    </div>
  )
}

function Meta({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-md bg-pebble/70 px-3 py-2">
      <div className="text-[11px] font-medium text-mist-gray">{label}</div>
      <div className="mt-0.5 text-[14px]">{children}</div>
    </div>
  )
}
