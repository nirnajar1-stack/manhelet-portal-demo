import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RehabStagePicker } from '@/components/rehab/RehabStagePicker'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Panel } from '@/components/ui/card'
import { visibleUnits } from '@/lib/access'
import { useApp } from '@/state/AppContext'
import type { ActivityAffiliation, TaskPriority } from '@/types'

const domains = [
  { domain: 'דיור', subs: ['דיור זמני', 'דיור קבע'] },
  { domain: 'רווחה', subs: ['פניות', 'סיוע'] },
  { domain: 'ליווי', subs: ['ביקורים', 'מפגשים', 'תמיכה'] },
  { domain: 'שיקום', subs: ['מעקב', 'תיאום'] },
  { domain: 'תיאום ממשלתי', subs: ['חסמים', 'מענה'] },
  { domain: 'שירותים', subs: ['זכאות'] },
  { domain: 'מנהלה', subs: ['מסמכים', 'קשר'] },
]

export function NewTask() {
  const [params] = useSearchParams()
  const presetUnit = params.get('unitId') ?? ''
  const presetMember = params.get('memberId') ?? ''
  const presetStage = params.get('rehabStageId') ?? ''
  const presetAffiliation = (params.get('affiliation') as ActivityAffiliation) || 'routine'
  const fromUnitCase = Boolean(presetUnit)
  const { currentUser, createNewTask, showToast } = useApp()
  const navigate = useNavigate()

  const allowedUnits = useMemo(
    () => visibleUnits(currentUser),
    [currentUser],
  )

  const initialUnit =
    fromUnitCase && allowedUnits.some((u) => u.id === presetUnit)
      ? presetUnit
      : ''

  const [title, setTitle] = useState('')
  const [unitId, setUnitId] = useState(initialUnit)
  const [memberId, setMemberId] = useState(presetMember)
  const [description, setDescription] = useState('')
  const [domain, setDomain] = useState(
    presetAffiliation === 'rehab' ? 'שיקום' : domains[0].domain,
  )
  const [subDomain, setSubDomain] = useState(
    presetAffiliation === 'rehab' ? 'תיאום' : domains[0].subs[0],
  )
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [affiliation, setAffiliation] =
    useState<ActivityAffiliation>(presetAffiliation)
  const [primaryStageId, setPrimaryStageId] = useState<string | undefined>(
    presetStage || undefined,
  )
  const [secondaryStageIds, setSecondaryStageIds] = useState<string[]>([])
  const [includeInactive, setIncludeInactive] = useState(Boolean(presetStage))
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const unit = useMemo(
    () => allowedUnits.find((u) => u.id === unitId),
    [unitId, allowedUnits],
  )
  const subs = domains.find((d) => d.domain === domain)?.subs ?? []

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: string[] = []
    if (!title.trim()) next.push('כותרת')
    if (!unitId) next.push('יחידת טיפול')
    if (!description.trim()) next.push('תיאור')
    if (affiliation === 'rehab') {
      if (!memberId) next.push('בן/בת משפחה')
      if (!primaryStageId) next.push('שלב שיקום ראשי')
    }
    setErrors(next)
    if (next.length) return

    setSaving(true)
    try {
      const task = await createNewTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        domain,
        subDomain,
        unitId,
        memberId: memberId || undefined,
        ownerId: currentUser.id,
        creatorId: currentUser.id,
        dueDate: dueDate || undefined,
        activityAffiliation: affiliation,
        rehabPrimaryStageId: primaryStageId,
        rehabSecondaryStageIds: secondaryStageIds,
        actorUserId: currentUser.id,
      })
      navigate(`/tasks/${task.id}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-[28px] font-bold">פתיחת משימה</h1>
        <p className="mt-1 text-[14px] text-slate-gray">
          {fromUnitCase
            ? 'יחידת הטיפול מולאה אוטומטית מתוך התיק.'
            : 'ממסך כללי — בחרו יחידת טיפול ידנית (אין בחירה אוטומטית).'}
        </p>
      </div>

      <AssumptionBanner>
        שיוך שיקום מחויב למופע שלב אישי של בן המשפחה שנבחר — נאכף בצד השרת (stub).
      </AssumptionBanner>

      <Panel>
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <Field label="כותרת" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="מה צריך לטפל?"
            />
          </Field>

          <Field label="יחידת טיפול" required>
            <select
              className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
              value={unitId}
              onChange={(e) => {
                setUnitId(e.target.value)
                setMemberId('')
                setPrimaryStageId(undefined)
                setSecondaryStageIds([])
              }}
              disabled={fromUnitCase && Boolean(initialUnit)}
            >
              <option value="">בחרו יחידת טיפול…</option>
              {allowedUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  משפחת {u.familyName} · {u.region}
                </option>
              ))}
            </select>
          </Field>

          <Field label="בן/בת משפחה">
            <select
              className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value)
                setPrimaryStageId(undefined)
                setSecondaryStageIds([])
              }}
              disabled={!unit}
            >
              <option value="">ללא בחירה</option>
              {unit?.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.relation})
                </option>
              ))}
            </select>
          </Field>

          <Field label="שיוך הפעילות">
            <select
              className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
              value={affiliation}
              onChange={(e) => {
                const next = e.target.value as ActivityAffiliation
                if (affiliation === 'rehab' && next === 'routine') {
                  if (
                    !window.confirm(
                      'להסיר את קישורי השיקום מהמשימה? ההיסטוריה תישמר ביומן הפעולות.',
                    )
                  ) {
                    return
                  }
                  setPrimaryStageId(undefined)
                  setSecondaryStageIds([])
                }
                setAffiliation(next)
              }}
            >
              <option value="routine">פעילות שוטפת</option>
              <option value="rehab">פעילות במסגרת שיקום</option>
            </select>
          </Field>

          {affiliation === 'rehab' && (
            <div className="space-y-2 rounded-md border border-hairline p-3">
              <h3 className="text-[14px] font-semibold">קישור לתהליך השיקום</h3>
              <RehabStagePicker
                memberId={memberId}
                primaryStageId={primaryStageId}
                secondaryStageIds={secondaryStageIds}
                includeInactive={includeInactive}
                onIncludeInactiveChange={setIncludeInactive}
                onPrimaryChange={setPrimaryStageId}
                onSecondaryChange={setSecondaryStageIds}
                emptyHref={
                  unitId ? `/units/${unitId}?tab=rehab` : '/rehab/bank'
                }
              />
            </div>
          )}

          <Field label="תיאור" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פירוט קצר וממוקד"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="תחום">
              <select
                className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value)
                  const next =
                    domains.find((d) => d.domain === e.target.value)?.subs[0] ??
                    ''
                  setSubDomain(next)
                }}
              >
                {domains.map((d) => (
                  <option key={d.domain} value={d.domain}>
                    {d.domain}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="תת־תחום">
              <select
                className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
                value={subDomain}
                onChange={(e) => setSubDomain(e.target.value)}
              >
                {subs.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="עדיפות">
              <select
                className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="low">נמוכה</option>
                <option value="medium">בינונית</option>
                <option value="high">גבוהה</option>
                <option value="urgent">דחופה</option>
              </select>
            </Field>
            <Field label="תאריך יעד">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>

          {errors.length > 0 && (
            <p className="text-[13px] text-danger" role="alert">
              יש להשלים: {errors.join(', ')}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'שומר…' : 'יצירת משימה'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              ביטול
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-semibold text-ink-navy">
        {label}
        {required && (
          <span className="ms-1 text-danger" title="חובה — הנחה לאימות">
            *
          </span>
        )}
      </span>
      {children}
    </label>
  )
}
