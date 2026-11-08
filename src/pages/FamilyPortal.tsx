import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { fetchFamilyRequests, fetchOrgNews } from '@/api/stubs'
import { cn, formatRelativeHe } from '@/lib/utils'
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
    <div className="page-stack">
      <header className="border-b border-hairline pb-4">
        <p className="section-label">הבית שלי</p>
        <h1 className="page-title mt-1">שלום, {currentUser.name}</h1>
        <p className="page-lede max-w-xl">
          כאן תמצאו עדכונים, בקשות ושירותים, ודרכים ליצור קשר עם המנהלת — בשפה
          ברורה ופשוטה.
        </p>
      </header>

      <AssumptionBanner>
        פורטל משפחות מוצג בנפרד לחלוטין מממשק העובדים. תוכן דמה בלבד.
      </AssumptionBanner>

      <div
        className="flex gap-0.5 overflow-x-auto border-b border-hairline"
        role="tablist"
        aria-label="מקטעי פורטל משפחות"
      >
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
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
              section === s.id
                ? 'border-gold text-ink-navy'
                : 'border-transparent text-slate-gray hover:text-ink-navy',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'home' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <h2 className="mb-3 text-[15px] font-semibold">עדכונים רלוונטיים</h2>
            <ul className="divide-y divide-hairline">
              {events.map((e) => (
                <li key={e.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="text-[11px] text-mist-gray">{e.date}</div>
                  <div className="text-[14px] font-medium">{e.title}</div>
                  <p className="mt-0.5 text-[13px] text-slate-gray">{e.summary}</p>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <h2 className="mb-3 text-[15px] font-semibold">סטטוס בקשות אחרונות</h2>
            <ul className="divide-y divide-hairline">
              {requests.slice(0, 3).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="text-[13px] font-medium">{r.title}</span>
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
              className="mt-3"
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
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="text-[15px] font-semibold">בקשות ושירותים</h2>
            <p className="mt-0.5 text-[12px] text-slate-gray">
              מעקב אחר בקשותיכם ומידע על שירותים זמינים.
            </p>
          </div>
          <ul className="divide-y divide-hairline">
            {requests.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.title}</span>
                  <Badge>{statusLabel[r.status]}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-slate-gray">{r.summary}</p>
                <p className="mt-1 text-[11px] text-mist-gray">
                  עודכן {formatRelativeHe(r.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {section === 'contact' && (
        <Panel>
          <div className="mb-2 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-slate-gray" aria-hidden />
            <h2 className="text-[15px] font-semibold">יצירת קשר עם המנהלת</h2>
          </div>
          <p className="mb-3 text-[13px] text-slate-gray">
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
