import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Map, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  parseTourStep,
  visitorTourStops,
} from '@/data/visitor-demo'
import { cn } from '@/lib/utils'

const TOUR_STORAGE_KEY = 'manhelet-visitor-tour'

/**
 * Guided visitor/inspector tour — overlays org-value captions on real screens.
 * Activate with `?tour=1` or localStorage; keep mobile density light.
 */
export function VisitorTour() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const tourParam = params.get('tour')
  const tourOn =
    tourParam === '1' ||
    (typeof window !== 'undefined' &&
      localStorage.getItem(TOUR_STORAGE_KEY) === '1' &&
      tourParam !== '0')

  const step = useMemo(
    () => parseTourStep(params.get('tourStep')),
    [params],
  )

  useEffect(() => {
    if (tourParam === '1') {
      localStorage.setItem(TOUR_STORAGE_KEY, '1')
    }
    if (tourParam === '0') {
      localStorage.removeItem(TOUR_STORAGE_KEY)
    }
  }, [tourParam])

  useEffect(() => {
    if (!tourOn) return
    if (params.get('tour') === '1' && params.get('tourStep') != null) return
    const p = new URLSearchParams(params)
    p.set('tour', '1')
    if (p.get('tourStep') == null) p.set('tourStep', String(step))
    setParams(p, { replace: true })
  }, [tourOn, params, setParams, step])

  if (!tourOn) return null

  const stop = visitorTourStops[step] ?? visitorTourStops[0]
  const isFirst = step <= 0
  const isLast = step >= visitorTourStops.length - 1

  function go(toStep: number) {
    const next = visitorTourStops[toStep]
    if (!next) return
    navigate(next.path)
  }

  function exit() {
    localStorage.removeItem(TOUR_STORAGE_KEY)
    const p = new URLSearchParams(params)
    p.delete('tour')
    p.delete('tourStep')
    const qs = p.toString()
    navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true })
  }

  return (
    <div
      className="visitor-tour pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 sm:p-4"
      role="region"
      aria-label="סיור מבקרים"
    >
      <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-[12px] border border-hairline bg-paper/95 shadow-elevated backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 border-b border-hairline bg-ink-navy px-3 py-2 text-paper sm:px-4">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-gold" aria-hidden />
            <span className="text-[13px] font-semibold">
              סיור מבקר · {step + 1}/{visitorTourStops.length}
            </span>
          </div>
          <button
            type="button"
            onClick={exit}
            className="rounded-md p-1.5 text-paper/80 hover:bg-white/10 hover:text-paper"
            aria-label="יציאה מהסיור"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 py-3 sm:px-4 sm:py-3.5">
          <div className="flex flex-wrap gap-1.5">
            {visitorTourStops.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i === step ? 'bg-gold' : i < step ? 'bg-dusk-blue' : 'bg-hairline',
                )}
                aria-label={s.titleHe}
                aria-current={i === step ? 'step' : undefined}
              />
            ))}
          </div>

          <h3 className="mt-3 text-[16px] font-bold text-ink-navy">{stop.titleHe}</h3>
          <p className="mt-1 text-[13px] text-slate-gray">{stop.captionHe}</p>
          <p className="mt-2 hidden text-[13px] leading-relaxed text-ink-navy sm:block">
            <span className="font-semibold text-signal-blue">מה הארגון מרוויח: </span>
            {stop.gainHe}
          </p>
          <details className="mt-2 sm:hidden">
            <summary className="cursor-pointer text-[12px] font-semibold text-signal-blue">
              מה הארגון מרוויח
            </summary>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-navy">
              {stop.gainHe}
            </p>
          </details>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isFirst}
              onClick={() => go(step - 1)}
              className="gap-1"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
              הקודם
            </Button>
            <span className="meta-xs-hide text-[11px] text-mist-gray">
              {stop.titleHe}
            </span>
            {isLast ? (
              <Button size="sm" onClick={exit}>
                סיום הסיור
              </Button>
            ) : (
              <Button size="sm" onClick={() => go(step + 1)} className="gap-1">
                הבא
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Compact entry control for shell / home. */
export function VisitorTourLauncher({ className }: { className?: string }) {
  const navigate = useNavigate()
  return (
    <Button
      size="sm"
      variant="secondary"
      className={cn('gap-1.5', className)}
      onClick={() => {
        localStorage.setItem(TOUR_STORAGE_KEY, '1')
        navigate(visitorTourStops[0].path)
      }}
    >
      <Map className="h-3.5 w-3.5" aria-hidden />
      סיור מבקר
    </Button>
  )
}
