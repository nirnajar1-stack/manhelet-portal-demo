import { useState } from 'react'
import {
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Send,
  Video,
} from 'lucide-react'
import { FamCard, FamStatus } from '@/components/families/FamiliesUi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import {
  familiesChatSeed,
  familiesCompanion,
  familiesMeetings,
  familiesPortalProfile,
  type FamiliesChatMessage,
} from '@/data/families-portal-seed'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'

export function FamiliesCompanion() {
  const { showToast } = useApp()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<FamiliesChatMessage[]>(familiesChatSeed)

  const send = () => {
    const body = draft.trim()
    if (!body) return
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        from: 'family',
        author: familiesPortalProfile.viewerFullName,
        time,
        body,
      },
    ])
    setDraft('')
    showToast('ההודעה נשלחה בערוץ המאובטח (דמו)')
  }

  return (
    <div className="space-y-5">
      <header className="fam-enter">
        <p className="text-[12px] text-slate-gray">
          תיק {familiesPortalProfile.familyName} · מלווה אישי ישיר
        </p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-ink-navy sm:text-[26px]">
              קשר עם מנהל תיק משפחה
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] text-slate-gray">
              ערוץ ישיר ומאובטח עם {familiesCompanion.name} — הודעות, תיאום פגישות
              ותחומי סיוע.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="dark"
              size="sm"
              onClick={() => {
                document.getElementById('fam-chat-input')?.focus()
              }}
            >
              הודעה חדשה למלווה
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast('תיאום פגישה נפתח (דמו)')}
            >
              תיאום פגישה אישית
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <FamCard enter={1}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold text-ink-navy">
                פרופיל המלווה המשפחתי
              </h2>
              <FamStatus tone="done">{familiesCompanion.certifiedLabel}</FamStatus>
            </div>
            <div className="flex items-center gap-3">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-ink-navy text-[22px] font-semibold text-paper">
                {familiesCompanion.initials}
                <span className="absolute bottom-1 start-1 h-3 w-3 rounded-full border-2 border-paper bg-success" />
              </span>
              <div>
                <p className="text-[17px] font-semibold text-ink-navy">
                  {familiesCompanion.name}
                </p>
                <p className="text-[12px] text-slate-gray">
                  {familiesCompanion.title}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-[13px] text-ink-navy">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-signal-blue" aria-hidden />
                {familiesCompanion.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-signal-blue" aria-hidden />
                {familiesCompanion.email}
              </li>
              <li className="text-[12px] text-slate-gray">
                שעות מענה: {familiesCompanion.hours} ·{' '}
                <strong className="text-ink-navy">
                  {familiesCompanion.emergencyNote}
                </strong>
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="dark" size="sm">
                <a href={`tel:${familiesCompanion.phone}`}>חיוג ישיר</a>
              </Button>
              <Button
                variant="soft"
                size="sm"
                onClick={() => showToast('קביעת שיחה (דמו)')}
              >
                קביעת שיחה
              </Button>
            </div>
          </FamCard>

          <FamCard enter={2}>
            <h2 className="mb-3 text-[14px] font-semibold text-ink-navy">
              תחומי סיוע של המלווה
            </h2>
            <ul className="space-y-2">
              {familiesCompanion.supportAreas.map((area) => (
                <li
                  key={area}
                  className="flex items-start gap-2 text-[13px] text-ink-navy"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                  {area}
                </li>
              ))}
            </ul>
          </FamCard>
        </div>

        <div className="space-y-4">
          <FamCard enter={1} className="flex min-h-[420px] flex-col !p-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-[14px] font-semibold text-ink-navy">
                  ערוץ התכתבות ישיר ומאובטח
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                  מחובר כעת
                </p>
              </div>
              <Lock className="h-4 w-4 text-slate-gray" aria-hidden />
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed sm:max-w-[80%]',
                    m.from === 'family'
                      ? 'ms-auto rounded-es-md bg-ink-navy text-paper'
                      : 'me-auto rounded-ee-md bg-pebble text-ink-navy',
                  )}
                >
                  <div
                    className={cn(
                      'mb-1 flex items-center gap-2 text-[11px]',
                      m.from === 'family' ? 'text-paper/70' : 'text-slate-gray',
                    )}
                  >
                    <span className="font-semibold">{m.author}</span>
                    <span>{m.time}</span>
                  </div>
                  {m.body}
                </div>
              ))}
            </div>

            <div className="border-t border-hairline bg-paper px-3 py-3 sm:px-4">
              <div className="flex items-end gap-2">
                <Textarea
                  id="fam-chat-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder="כתבו הודעה לניר כהן…"
                  className="min-h-[44px] max-h-28 flex-1 resize-none"
                  rows={2}
                />
                <Button
                  variant="dark"
                  size="icon"
                  aria-label="שליחה"
                  onClick={send}
                  disabled={!draft.trim()}
                >
                  <Send className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-gray">
                <Lock className="h-3 w-3" aria-hidden />
                ההתכתבות מוצפנת ומאובטחת · דמו בלבד
              </p>
            </div>
          </FamCard>

          <FamCard enter={2}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-ink-navy">
                פגישות אישיות מתואמות
              </h2>
              <FamStatus tone="info">1 קרובה</FamStatus>
            </div>
            {familiesMeetings.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-hairline bg-soft-cyan/40 p-3.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-ink-navy">
                    {m.title}
                  </h3>
                  <FamStatus tone="progress">{m.statusLabel}</FamStatus>
                </div>
                <p className="mt-2 text-[13px] font-medium text-ink-navy">
                  {m.when}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-gray">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {m.where}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showToast('פרטי הפגישה (דמו)')}
                  >
                    <Video className="h-3.5 w-3.5" aria-hidden />
                    פרטי הפגישה
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => showToast('בקשת שינוי מועד (דמו)')}
                  >
                    שינוי מועד
                  </Button>
                </div>
              </div>
            ))}
          </FamCard>
        </div>
      </div>
    </div>
  )
}
