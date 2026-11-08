import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { portalMemberPersonId } from '@/data/rehab-workflow-seed'
import {
  RehabWorkflowError,
  getTemplateStages,
  listActiveTemplates,
  listGoalsForMember,
  openPersonalGoal,
  type RehabWorkflowActor,
} from '@/lib/rehab-workflow/store'
import { cn } from '@/lib/utils'
import {
  domainLabelHe,
  type RehabDomain,
  type RehabGoalTemplate,
} from '@/types/rehab-workflow'

const DOMAINS: RehabDomain[] = [
  'employment',
  'education',
  'daily_function',
  'health',
  'emotional_support',
  'social',
  'housing',
  'other',
]

type Step = 1 | 2 | 3 | 4

interface Props {
  open: boolean
  onClose: () => void
  unitId: string
  memberId: string
  memberName: string
  actor: RehabWorkflowActor
  onCreated: (goalId: string) => void
}

export function AddGoalDrawer({
  open,
  onClose,
  unitId,
  memberId,
  memberName,
  actor,
  onCreated,
}: Props) {
  const [step, setStep] = useState<Step>(1)
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState<RehabDomain | 'all'>('all')
  const [templateId, setTemplateId] = useState('')
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [targetDate, setTargetDate] = useState('')
  const [ownerName, setOwnerName] = useState(actor.nameHe)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const templates = listActiveTemplates()
  const existingGoals = useMemo(
    () => listGoalsForMember(memberId, actor),
    [memberId, actor, open],
  )
  const activeTemplateIds = new Set(
    existingGoals.filter((g) => g.mgmtStatus === 'active').map((g) => g.goalTemplateId),
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      if (domain !== 'all' && t.domain !== domain) return false
      if (!q) return true
      return (
        t.nameHe.toLowerCase().includes(q) ||
        (t.descriptionHe ?? '').toLowerCase().includes(q) ||
        domainLabelHe[t.domain].includes(q)
      )
    })
  }, [templates, query, domain])

  const selected = templates.find((t) => t.id === templateId)
  const stages = selected ? getTemplateStages(selected.id) : []

  useEffect(() => {
    if (!open) return
    setStep(1)
    setQuery('')
    setDomain('all')
    setTemplateId('')
    setExpandedStage(null)
    setStartDate(new Date().toISOString().slice(0, 10))
    setTargetDate('')
    setOwnerName(actor.nameHe)
    setNotes('')
    setError(null)
    setSaving(false)
  }, [open, actor.nameHe])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function selectTemplate(t: RehabGoalTemplate) {
    if (activeTemplateIds.has(t.id)) return
    setTemplateId(t.id)
    setStep(2)
  }

  async function create() {
    if (!selected) return
    setError(null)
    setSaving(true)
    try {
      const goal = openPersonalGoal({
        actor,
        portalMemberId: memberId,
        portalUnitId: unitId,
        personId: portalMemberPersonId[memberId] ?? memberId,
        templateId: selected.id,
        startDate,
        targetDate: targetDate || undefined,
        notesHe: notes || undefined,
        ownerNameHe: ownerName || undefined,
      })
      onCreated(goal.id)
    } catch (e) {
      setError(e instanceof RehabWorkflowError ? e.message : 'שגיאה ביצירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-start" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-ink-navy/40"
        aria-label="סגירת חלון"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-goal-title"
        className="relative flex h-full w-full max-w-xl flex-col border-e border-hairline bg-paper shadow-xl"
      >
        <header className="shrink-0 border-b border-hairline px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="add-goal-title" className="text-[18px] font-semibold text-ink-navy">
                הוספת מטרת שיקום
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-gray">
                עבור {memberName} · שלב {step} מתוך 4
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>
              סגור
            </Button>
          </div>
          <ol className="mt-3 flex gap-1" aria-hidden>
            {([1, 2, 3, 4] as Step[]).map((s) => (
              <li
                key={s}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  s <= step ? 'bg-gold' : 'bg-pebble',
                )}
              />
            ))}
          </ol>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-3">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש מטרה…"
                aria-label="חיפוש בבנק המטרות"
              />
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={domain === 'all'}
                  onClick={() => setDomain('all')}
                  label="הכל"
                />
                {DOMAINS.map((d) => (
                  <Chip
                    key={d}
                    active={domain === d}
                    onClick={() => setDomain(d)}
                    label={domainLabelHe[d]}
                  />
                ))}
              </div>
              <ul className="space-y-2">
                {filtered.map((t) => {
                  const stagesCount = getTemplateStages(t.id).length
                  const dup = activeTemplateIds.has(t.id)
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        disabled={dup}
                        onClick={() => selectTemplate(t)}
                        className={cn(
                          'w-full rounded-md border px-3 py-3 text-start transition-colors',
                          dup
                            ? 'cursor-not-allowed border-hairline bg-pebble opacity-70'
                            : 'border-hairline bg-paper hover:border-dusk-blue hover:bg-soft-cyan',
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[15px] font-semibold text-ink-navy">
                            {t.nameHe}
                          </span>
                          <span className="text-[12px] text-slate-gray">
                            {domainLabelHe[t.domain]}
                          </span>
                        </div>
                        {t.descriptionHe && (
                          <p className="mt-1 text-[13px] text-slate-gray">
                            {t.descriptionHe}
                          </p>
                        )}
                        <p className="mt-1 text-[12px] text-mist-gray">
                          {stagesCount} שלבים · גרסה {t.currentVersion}
                          {dup ? ' · כבר פעילה אצל בן המשפחה' : ''}
                        </p>
                      </button>
                    </li>
                  )
                })}
                {filtered.length === 0 && (
                  <li className="py-8 text-center text-[14px] text-slate-gray">
                    לא נמצאו מטרות התואמות לחיפוש.
                  </li>
                )}
              </ul>
            </div>
          )}

          {step === 2 && selected && (
            <div className="space-y-3">
              <p className="text-[14px] text-slate-gray">
                שלבים שייפתחו עבור <strong>{selected.nameHe}</strong>:
              </p>
              <ol className="space-y-2">
                {stages.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-md border border-hairline bg-pebble/60 px-3 py-2"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-2 text-start"
                      onClick={() =>
                        setExpandedStage(expandedStage === s.id ? null : s.id)
                      }
                    >
                      <div>
                        <div className="text-[14px] font-semibold">
                          {s.seq}. {s.nameHe}
                        </div>
                        <div className="text-[12px] text-mist-gray">
                          {s.isMandatory ? 'חובה' : 'אופציונלי'}
                          {s.typicalDays ? ` · כ־${s.typicalDays} ימים` : ''}
                          {s.seq > 1 ? ' · תלוי בשלב קודם (רציף)' : ''}
                        </div>
                      </div>
                      <span className="text-[12px] text-signal-blue">
                        {expandedStage === s.id ? 'הסתר' : 'פרטים'}
                      </span>
                    </button>
                    {expandedStage === s.id && s.descriptionHe && (
                      <p className="mt-2 text-[13px] text-slate-gray">
                        {s.descriptionHe}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {step === 3 && selected && (
            <div className="space-y-3">
              <p className="text-[13px] text-slate-gray">
                התאמה למופע האישי בלבד — בנק המטרות לא משתנה.
              </p>
              <label className="block space-y-1">
                <span className="text-[13px] font-semibold">גורם אחראי</span>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </label>
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
                <span className="text-[13px] font-semibold">הערה ראשונית</span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="אופציונלי"
                />
              </label>
            </div>
          )}

          {step === 4 && selected && (
            <div className="space-y-3 rounded-md border border-hairline bg-pebble/50 p-4">
              <h3 className="text-[15px] font-semibold">סיכום לפני יצירה</h3>
              <dl className="space-y-2 text-[14px]">
                <Row label="מטרה" value={selected.nameHe} />
                <Row label="בן משפחה" value={memberName} />
                <Row label="מספר שלבים" value={String(stages.length)} />
                <Row label="גורם אחראי" value={ownerName || '—'} />
                <Row label="תאריך התחלה" value={startDate || '—'} />
                <Row label="תאריך יעד" value={targetDate || '—'} />
              </dl>
            </div>
          )}

          {error && (
            <p className="mt-3 text-[13px] text-danger" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="shrink-0 border-t border-hairline px-5 py-3">
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (step === 1) onClose()
                else setStep((s) => (s - 1) as Step)
              }}
            >
              {step === 1 ? 'ביטול' : 'הקודם'}
            </Button>
            <div className="flex gap-2">
              {step < 4 && (
                <Button
                  size="sm"
                  disabled={step === 1 ? !templateId : false}
                  onClick={() => {
                    if (step === 1 && !templateId) return
                    setStep((s) => (s + 1) as Step)
                  }}
                >
                  המשך
                </Button>
              )}
              {step === 4 && (
                <Button size="sm" disabled={saving} onClick={() => void create()}>
                  {saving ? 'יוצר…' : 'יצירת מטרת שיקום'}
                </Button>
              )}
            </div>
          </div>
        </footer>
      </aside>
    </div>
  )
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-[12px] font-medium',
        active
          ? 'border-gold bg-gold/20 text-ink-navy'
          : 'border-hairline bg-paper text-slate-gray hover:bg-pebble',
      )}
    >
      {label}
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-gray">{label}</dt>
      <dd className="font-medium text-ink-navy">{value}</dd>
    </div>
  )
}
