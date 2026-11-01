import { useEffect, useState } from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { fetchFamilyRequests, fetchOrgNews } from '@/api/stubs'
import { formatRelativeHe } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import type { FamilyRequest, OrgNewsItem } from '@/types'

/**
 * Completely separate UX from staff ops.
 * No Task / Chatter / יחידת טיפול language.
 */
export function FamilyPortal() {
  const { currentUser, showToast, setRole } = useApp()
  const [requests, setRequests] = useState<FamilyRequest[]>([])
  const [events, setEvents] = useState<OrgNewsItem[]>([])
  const [message, setMessage] = useState('')
  const [section, setSection] = useState<'home' | 'requests' | 'contact'>(
    'home',
  )

  useEffect(() => {
    if (currentUser.role !== 'family') setRole('family')
  }, [currentUser.role, setRole])

  useEffect(() => {
    void fetchFamilyRequests().then(setRequests)
    void fetchOrgNews().then((n) =>
      setEvents(n.filter((x) => x.kind === 'event' || x.kind === 'news').slice(0, 3)),
    )
  }, [])

  const statusLabel = {
    open: 'התקבלה',
    in_progress: 'בטיפול',
    done: 'הושלמה',
  } as const

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-hairline bg-paper p-6 shadow-soft sm:p-8">
        <div
          className="pointer-events-none absolute -start-10 -top-10 h-40 w-40 rounded-full bg-sky-cyan/20 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -end-8 h-44 w-44 rounded-full bg-coral-magenta/15 blur-2xl"
          aria-hidden
        />
        <p className="text-[13px] font-semibold text-deep-cobalt">הבית שלי</p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight text-ink-navy sm:text-[38px] sm:leading-[1.21]">
          שלום, {currentUser.name}
        </h1>
        <p className="mt-3 max-w-xl text-[16px] text-slate-gray">
          כאן תמצאו עדכונים, בקשות ושירותים, ודרכים ליצור קשר עם המנהלת — בשפה
          ברורה ופשוטה.
        </p>
      </div>

      <AssumptionBanner>
        פורטל משפחות מוצג בנפרד לחלוטין מממשק העובדים. תוכן דמה בלבד.
      </AssumptionBanner>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { id: 'home', label: 'הבית שלי' },
            { id: 'requests', label: 'בקשות ושירותים' },
            { id: 'contact', label: 'הקשר עם המנהלת' },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`shrink-0 rounded-md px-4 py-2 text-[14px] font-semibold ${
              section === s.id
                ? 'bg-signal-blue text-paper'
                : 'bg-paper text-ink-navy border border-hairline'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'home' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-signal-blue" />
              <h2 className="text-[18px] font-semibold">עדכונים רלוונטיים</h2>
            </div>
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="rounded-lg bg-pebble/70 p-3">
                  <div className="text-[12px] text-mist-gray">{e.date}</div>
                  <div className="font-semibold">{e.title}</div>
                  <p className="mt-1 text-[13px] text-slate-gray">{e.summary}</p>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <h2 className="mb-3 text-[18px] font-semibold">סטטוס בקשות אחרונות</h2>
            <ul className="space-y-2">
              {requests.slice(0, 3).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2"
                >
                  <span className="text-[14px] font-medium">{r.title}</span>
                  <Badge
                    tone={
                      r.status === 'done'
                        ? 'success'
                        : r.status === 'in_progress'
                          ? 'info'
                          : 'muted'
                    }
                  >
                    {statusLabel[r.status]}
                  </Badge>
                </li>
              ))}
            </ul>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={() => setSection('requests')}
            >
              לכל הבקשות
            </Button>
          </Panel>
        </div>
      )}

      {section === 'requests' && (
        <Panel className="!p-0 overflow-hidden">
          <div className="border-b border-hairline px-4 py-4 sm:px-6">
            <h2 className="text-[18px] font-semibold">בקשות ושירותים</h2>
            <p className="mt-1 text-[13px] text-slate-gray">
              מעקב אחר בקשותיכם ומידע על שירותים זמינים.
            </p>
          </div>
          <ul className="divide-y divide-hairline">
            {requests.map((r) => (
              <li key={r.id} className="px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.title}</span>
                  <Badge>{statusLabel[r.status]}</Badge>
                </div>
                <p className="mt-1 text-[14px] text-slate-gray">{r.summary}</p>
                <p className="mt-1 text-[12px] text-mist-gray">
                  עודכן {formatRelativeHe(r.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {section === 'contact' && (
        <Panel>
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-signal-blue" />
            <h2 className="text-[18px] font-semibold">יצירת קשר עם המנהלת</h2>
          </div>
          <p className="mb-3 text-[14px] text-slate-gray">
            שלחו הודעה לצוות הליווי. נחזור אליכם בהקדם האפשרי.
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="כתבו כאן…"
          />
          <Button
            className="mt-3"
            onClick={() => {
              if (!message.trim()) return
              setMessage('')
              showToast('ההודעה נשלחה (סימולציה)')
            }}
          >
            שליחה
          </Button>
        </Panel>
      )}
    </div>
  )
}
