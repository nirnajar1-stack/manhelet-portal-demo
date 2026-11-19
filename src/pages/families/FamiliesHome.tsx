import { Link } from 'react-router-dom'
import {
  Calendar,
  Home as HomeIcon,
  MapPin,
  Phone,
  HeartHandshake,
} from 'lucide-react'
import {
  FamCard,
  FamEventImage,
  FamStatus,
  FamStepper,
} from '@/components/families/FamiliesUi'
import { Button } from '@/components/ui/button'
import {
  familiesCompanion,
  familiesHotlines,
  familiesNextMeeting,
  familiesImageAssets,
  familiesPortalProfile,
  familiesPrograms,
  familiesRequests,
  familiesSyncBanner,
  familiesTransition,
} from '@/data/families-portal-seed'
import { useApp } from '@/state/AppContext'

const homeEvents = familiesPrograms.filter((p) =>
  ['prog-nature', 'prog-pottery'].includes(p.id),
)

const feedRequests = [
  familiesRequests[0],
  familiesRequests[2],
  familiesRequests[3],
]

function requestTone(
  status: (typeof familiesRequests)[0]['status'],
): 'progress' | 'done' | 'info' {
  if (status === 'done') return 'done'
  if (status === 'checking') return 'info'
  return 'progress'
}

export function FamiliesHome() {
  const { showToast } = useApp()
  /* Fixed demo date — matches inhabited mockup atmosphere */
  const todayLabel = 'יום חמישי, 9 במאי 2024'

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <div className="fam-enter rounded-[10px] border border-signal-blue/25 bg-badge-bg px-3.5 py-2.5 text-[13px] text-signal-blue">
          {familiesSyncBanner}
        </div>

        <FamCard enter={0} className="!p-0 overflow-hidden">
          <div className="grid sm:grid-cols-[minmax(0,1fr)_min(42%,280px)]">
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft-cyan text-signal-blue">
                <HomeIcon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[12px] text-slate-gray">{todayLabel}</p>
                <h1 className="mt-0.5 text-[22px] font-semibold tracking-tight text-ink-navy sm:text-[26px]">
                  בוקר טוב, {familiesPortalProfile.viewerFirstName}
                </h1>
                <p className="mt-1 max-w-xl text-[14px] text-slate-gray">
                  כאן תראו את ההתקדמות במעבר, סטטוס הבקשות, והמלווה האישי — הכול
                  במקום אחד.
                </p>
              </div>
            </div>
            <FamEventImage
              src={familiesImageAssets.warmth.src}
              alt={familiesImageAssets.warmth.alt}
              className="hidden !min-h-[140px] !rounded-none sm:block sm:h-full"
            />
          </div>
        </FamCard>

        <FamCard enter={1}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-ink-navy">
              {familiesTransition.title}
            </h2>
            <FamStatus tone="progress">
              שלב {familiesTransition.stepIndex + 1} מתוך{' '}
              {familiesTransition.stepTotal}
            </FamStatus>
          </div>
          <FamStepper
            steps={familiesTransition.steps}
            activeIndex={familiesTransition.stepIndex}
          />
        </FamCard>

        <FamCard enter={2} className="!p-0 overflow-hidden">
          <div className="border-b border-hairline px-4 py-3 sm:px-5">
            <h2 className="text-[15px] font-semibold text-ink-navy">
              סטטוס הבקשות הפעילות שלכם
            </h2>
          </div>
          <ul className="divide-y divide-hairline">
            {feedRequests.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink-navy">
                      {r.title}
                    </span>
                    <FamStatus tone={requestTone(r.status)}>
                      {r.statusLabel}
                    </FamStatus>
                  </div>
                  <p className="mt-1 text-[12px] text-slate-gray">
                    {r.ref}
                    {r.etaLabel ? ` · ${r.etaLabel}` : ''}
                  </p>
                  <p className="mt-0.5 text-[13px] text-slate-gray">{r.summary}</p>
                </div>
                {r.actionLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => showToast('הורדה מדומה · דמו בלבד')}
                  >
                    {r.actionLabel}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-hairline px-4 py-3 sm:px-5">
            <Button asChild variant="ghost" size="sm">
              <Link to="/families/requests">לכל הבקשות והסיוע</Link>
            </Button>
          </div>
        </FamCard>

        <section className="fam-enter fam-enter-delay-3 space-y-3">
          <h2 className="text-[15px] font-semibold text-ink-navy">
            מה חדש לכם ולילדים
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {homeEvents.map((ev) => (
              <FamCard key={ev.id} className="!p-3 sm:!p-4">
                <FamEventImage
                  src={ev.imageSrc}
                  alt={ev.imageAlt}
                  label={ev.kind === 'event' ? 'אירוע' : undefined}
                  className="mb-3 aspect-[16/10] max-h-44 sm:max-h-none"
                />
                <h3 className="text-[14px] font-semibold text-ink-navy">
                  {ev.title}
                </h3>
                <ul className="mt-2 space-y-1 text-[12px] text-slate-gray">
                  <li className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {ev.dateLabel}
                    {ev.timeLabel ? ` · ${ev.timeLabel}` : ''}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {ev.location}
                  </li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="dark" size="sm">
                    <Link to="/families/programs">{ev.ctaPrimary}</Link>
                  </Button>
                  {ev.ctaSecondary && (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/families/programs">{ev.ctaSecondary}</Link>
                    </Button>
                  )}
                </div>
              </FamCard>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <FamCard enter={1}>
          <h2 className="text-[14px] font-semibold text-ink-navy">
            המלווה האישי שלכם
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink-navy text-[18px] font-semibold text-paper">
              {familiesCompanion.initials}
              <span className="absolute bottom-0.5 start-0.5 h-3 w-3 rounded-full border-2 border-paper bg-success" />
            </span>
            <div>
              <p className="text-[15px] font-semibold">{familiesCompanion.name}</p>
              <p className="text-[12px] text-success">
                {familiesCompanion.availableLabel}
              </p>
              <p className="mt-0.5 text-[12px] text-slate-gray">
                {familiesCompanion.phone} · {familiesCompanion.hours}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Button asChild variant="dark" size="sm">
              <Link to="/families/companion">שליחת הודעה לניר</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/families/companion">תיאום שיחה / פגישה</Link>
            </Button>
          </div>
        </FamCard>

        <FamCard enter={2}>
          <h2 className="text-[14px] font-semibold text-ink-navy">
            {familiesNextMeeting.title}
          </h2>
          <p className="mt-2 text-[13px] font-medium text-ink-navy">
            {familiesNextMeeting.when}
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-[12px] text-slate-gray">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {familiesNextMeeting.where}
          </p>
          <button
            type="button"
            className="mt-2 text-[12px] font-medium text-signal-blue hover:underline"
            onClick={() => showToast('בקשת שינוי מועד נשלחה (דמו)')}
          >
            {familiesNextMeeting.changeLabel}
          </button>
        </FamCard>

        <div className="space-y-2 fam-enter fam-enter-delay-3">
          {familiesHotlines.map((h) => (
            <a
              key={h.id}
              href={`tel:${h.dial.replace('*', '')}`}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-paper p-3.5 shadow-soft transition-colors hover:bg-soft-cyan/40"
            >
              <span
                className={
                  h.tone === 'danger'
                    ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-danger-bg text-danger'
                    : 'flex h-11 w-11 items-center justify-center rounded-xl bg-badge-bg text-signal-blue'
                }
              >
                <Phone className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span
                  className="block text-[16px] font-bold tracking-tight text-ink-navy"
                  dir="ltr"
                >
                  {h.dial}
                </span>
                <span className="block text-[12px] font-medium text-ink-navy">
                  {h.title}
                </span>
                <span className="block text-[11px] text-slate-gray">{h.blurb}</span>
              </span>
            </a>
          ))}
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[10px] px-2 py-2 text-[12px] font-medium text-signal-blue hover:bg-soft-cyan"
          onClick={() => showToast('מדריך הזכויות ייפתח בדמו')}
        >
          <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
          מדריך זכויות ומעברים מעודכן
        </button>
      </aside>
    </div>
  )
}
