import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { portalMemberPersonId } from '@/data/rehab-workflow-seed'
import {
  RehabWorkflowError,
  getTemplateStages,
  goalProgress,
  getStagesForGoal,
  listActiveTemplates,
  listGoalsForMember,
  openPersonalGoal,
  resolveActorFromPortalUser,
} from '@/lib/rehab-workflow/store'
import {
  domainLabelHe,
  goalMgmtLabelHe,
} from '@/types/rehab-workflow'
import { useApp } from '@/state/AppContext'
import type { FamilyMember } from '@/types'

interface Props {
  unitId: string
  members: FamilyMember[]
}

export function MemberRehabPanel({ unitId, members }: Props) {
  const { currentUser, showToast } = useApp()
  const actor = useMemo(
    () => resolveActorFromPortalUser(currentUser),
    [currentUser],
  )
  const [memberId, setMemberId] = useState(members[0]?.id ?? '')
  const [tick, setTick] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [targetDate, setTargetDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const goals = useMemo(() => {
    void tick
    try {
      return listGoalsForMember(memberId, actor)
    } catch {
      return []
    }
  }, [memberId, actor, tick])

  const templates = listActiveTemplates()
  const selectedTemplate = templates.find((t) => t.id === templateId)

  function refresh() {
    setTick((x) => x + 1)
  }

  function onAddGoal() {
    setError(null)
    if (!memberId || !templateId) {
      setError('יש לבחור בן משפחה ותבנית מטרה')
      return
    }
    try {
      openPersonalGoal({
        actor,
        portalMemberId: memberId,
        portalUnitId: unitId,
        personId: portalMemberPersonId[memberId] ?? memberId,
        templateId,
        startDate,
        targetDate: targetDate || undefined,
        notesHe: notes || undefined,
      })
      showToast('מטרת שיקום אישית נוצרה עם שלביה')
      setAddOpen(false)
      setTemplateId('')
      setNotes('')
      refresh()
    } catch (e) {
      setError(e instanceof RehabWorkflowError ? e.message : 'שגיאה ביצירה')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold">תהליך השיקום</h2>
          <p className="mt-1 text-[13px] text-slate-gray">
            מטרות אישיות ושלבים לבן המשפחה — מופרדים מבנק התבניות.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-md border border-hairline bg-pebble px-3 text-[14px]"
            value={memberId}
            onChange={(e) => {
              setMemberId(e.target.value)
              setAddOpen(false)
            }}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            הוספת מטרת שיקום
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.location.href = '/rehab/bank'
            }}
          >
            בנק מטרות
          </Button>
        </div>
      </div>

      {addOpen && (
        <Panel>
          <h3 className="mb-3 text-[16px] font-semibold">הוספת מטרת שיקום</h3>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-[13px] font-semibold">מטרה מבנק השיקום</span>
              <select
                className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">בחרו מטרה…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameHe} · {domainLabelHe[t.domain]} (v{t.currentVersion})
                  </option>
                ))}
              </select>
            </label>
            {selectedTemplate && (
              <div className="rounded-md bg-pebble px-3 py-2 text-[13px]">
                <div className="font-medium">תצוגה מקדימה של שלבים</div>
                <BankStagePreview templateId={selectedTemplate.id} />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[13px] font-semibold">תאריך התחלה</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[13px] font-semibold">תאריך יעד</span>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-[13px] font-semibold">הערות</span>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="אופציונלי"
              />
            </label>
            {error && (
              <p className="text-[13px] text-danger" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={onAddGoal}>
                אישור והוספה
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                ביטול
              </Button>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {goals.map((g) => {
          const prog = goalProgress(g.id)
          const stages = getStagesForGoal(g.id)
          const active = stages.filter((s) => s.status === 'in_progress')
          return (
            <Panel key={g.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-[16px] font-semibold">{g.nameHe}</h3>
                  <p className="text-[12px] text-slate-gray">
                    {domainLabelHe[g.domain]} · מחזור {g.cycleNumber} · תבנית v
                    {g.pinnedTemplateVersion}
                  </p>
                </div>
                <Badge tone={g.mgmtStatus === 'active' ? 'success' : 'muted'}>
                  {goalMgmtLabelHe[g.mgmtStatus]}
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-pebble">
                <div
                  className="h-full bg-gold"
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
              <p className="text-[12px] text-slate-gray">
                {prog.completed}/{prog.total} שלבים · {prog.pct}% · אחראי:{' '}
                {g.ownerNameHe ?? '—'}
              </p>
              {active.length > 0 && (
                <p className="text-[13px] text-ink-navy">
                  בביצוע: {active.map((s) => s.nameHe).join(', ')}
                </p>
              )}
              <p className="text-[12px] text-mist-gray">
                התחלה {g.startDate ?? '—'} · יעד {g.targetDate ?? '—'} · עודכן{' '}
                {g.updatedAt.slice(0, 10)}
              </p>
              <Link
                to={`/rehab/goals/${g.id}`}
                className="text-[13px] font-medium text-signal-blue hover:underline"
              >
                פירוט המטרה והשלבים
              </Link>
            </Panel>
          )
        })}
        {goals.length === 0 && (
          <Panel className="md:col-span-2">
            <p className="text-center text-[14px] text-slate-gray">
              אין מטרות שיקום לבן משפחה זה. לחצו על &quot;הוספת מטרת שיקום&quot;.
            </p>
          </Panel>
        )}
      </div>
    </div>
  )
}

function BankStagePreview({ templateId }: { templateId: string }) {
  const stages = getTemplateStages(templateId)
  return (
    <ol className="mt-1 list-decimal pr-5 text-slate-gray">
      {stages.map((s) => (
        <li key={s.id}>
          {s.nameHe}
          {!s.isMandatory ? ' (אופציונלי)' : ''}
        </li>
      ))}
    </ol>
  )
}
