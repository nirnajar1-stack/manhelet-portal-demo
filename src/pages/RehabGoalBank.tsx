import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import {
  RehabWorkflowError,
  addBankStageViaNewVersion,
  createBankTemplate,
  getRehabState,
  getTemplateStages,
  listActiveTemplates,
} from '@/lib/rehab-workflow/store'
import { domainLabelHe, type RehabDomain } from '@/types/rehab-workflow'
import { useApp } from '@/state/AppContext'

export function RehabGoalBank() {
  const { showToast } = useApp()
  const [tick, setTick] = useState(0)
  const templates = useMemo(() => {
    void tick
    return [...getRehabState().templates].sort((a, b) =>
      a.nameHe.localeCompare(b.nameHe, 'he'),
    )
  }, [tick])

  const [createOpen, setCreateOpen] = useState(false)
  const [code, setCode] = useState('')
  const [nameHe, setNameHe] = useState('')
  const [domain, setDomain] = useState<RehabDomain>('employment')
  const [desc, setDesc] = useState('')
  const [stageLines, setStageLines] = useState('שלב 1\nשלב 2\nשלב 3')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newStageName, setNewStageName] = useState('')

  const selected = templates.find((t) => t.id === selectedId)
  const stages = selected
    ? getTemplateStages(selected.id, selected.currentVersion)
    : []

  function refresh() {
    setTick((x) => x + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold">בנק מטרות שיקום</h1>
          <p className="mt-1 text-[14px] text-slate-gray">
            תבניות מרכזיות — שינוי כאן לא משנה מטרות אישיות שכבר נפתחו.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          מטרה חדשה בבנק
        </Button>
      </div>

      <AssumptionBanner>
        נתוני דמה בלבד. גרסה חדשה נוצרת בעת הוספת שלב לתבנית פעילה (pin על מטרות
        אישיות נשמר).
      </AssumptionBanner>

      {createOpen && (
        <Panel className="space-y-3">
          <h2 className="text-[16px] font-semibold">יצירת תבנית</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-[13px]">
              <span className="font-semibold">קוד</span>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <label className="space-y-1 text-[13px]">
              <span className="font-semibold">שם</span>
              <Input value={nameHe} onChange={(e) => setNameHe(e.target.value)} />
            </label>
          </div>
          <label className="block space-y-1 text-[13px]">
            <span className="font-semibold">תחום</span>
            <select
              className="h-10 w-full rounded-md border border-hairline bg-pebble px-3"
              value={domain}
              onChange={(e) => setDomain(e.target.value as RehabDomain)}
            >
              {(Object.keys(domainLabelHe) as RehabDomain[]).map((d) => (
                <option key={d} value={d}>
                  {domainLabelHe[d]}
                </option>
              ))}
            </select>
          </label>
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="תיאור / הנחיות"
          />
          <label className="block space-y-1 text-[13px]">
            <span className="font-semibold">שלבים (שורה לכל שלב)</span>
            <Textarea
              value={stageLines}
              onChange={(e) => setStageLines(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                try {
                  const lines = stageLines
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean)
                  createBankTemplate({
                    code: code.trim(),
                    nameHe: nameHe.trim(),
                    domain,
                    executionMode: 'sequential',
                    descriptionHe: desc || undefined,
                    stages: lines.map((name, i) => ({
                      code: `S${i + 1}`,
                      nameHe: name,
                    })),
                  })
                  showToast('תבנית נוצרה')
                  setCreateOpen(false)
                  refresh()
                } catch (e) {
                  showToast(
                    e instanceof RehabWorkflowError ? e.message : 'שגיאה',
                  )
                }
              }}
            >
              שמירה
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)}>
              ביטול
            </Button>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2 !p-0 overflow-hidden">
          <ul className="divide-y divide-hairline">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`w-full px-4 py-3 text-start hover:bg-pebble ${
                    selectedId === t.id ? 'bg-soft-cyan' : ''
                  }`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="font-semibold">{t.nameHe}</div>
                  <div className="text-[12px] text-slate-gray">
                    {domainLabelHe[t.domain]} · v{t.currentVersion} · {t.status}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="lg:col-span-3 space-y-3">
          {!selected && (
            <p className="text-[14px] text-slate-gray">בחרו תבנית מהרשימה.</p>
          )}
          {selected && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[18px] font-semibold">{selected.nameHe}</h2>
                <Badge>{selected.status}</Badge>
                <Badge tone="muted">v{selected.currentVersion}</Badge>
              </div>
              <p className="text-[13px] text-slate-gray">
                {selected.descriptionHe}
              </p>
              <ol className="list-decimal space-y-1 pr-5 text-[14px]">
                {stages.map((s) => (
                  <li key={s.id}>
                    {s.nameHe}
                    {!s.isMandatory ? ' (אופציונלי)' : ''}
                  </li>
                ))}
              </ol>
              <div className="rounded-md border border-hairline p-3">
                <div className="mb-2 text-[13px] font-semibold">
                  הוספת שלב (יוצר גרסה חדשה בבנק)
                </div>
                <Input
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="שם השלב החדש"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onClick={() => {
                    try {
                      const ver = addBankStageViaNewVersion({
                        templateId: selected.id,
                        code: `NEW-${Date.now()}`,
                        nameHe: newStageName.trim(),
                      })
                      showToast(`נוצרה גרסת תבנית v${ver} — מטרות אישיות לא השתנו`)
                      setNewStageName('')
                      refresh()
                    } catch (e) {
                      showToast(
                        e instanceof RehabWorkflowError ? e.message : 'שגיאה',
                      )
                    }
                  }}
                >
                  פרסום גרסה עם שלב חדש
                </Button>
              </div>
              <p className="text-[12px] text-mist-gray">
                תבניות פעילות במערכת: {listActiveTemplates().length}
              </p>
            </>
          )}
        </Panel>
      </div>

      <Link to="/units" className="text-[13px] text-signal-blue hover:underline">
        חזרה ליחידות טיפול
      </Link>
    </div>
  )
}
