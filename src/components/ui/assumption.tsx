import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Marks conservative product assumptions that need Salesforce validation. */
export function AssumptionBanner({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-2 rounded-[10px] border border-dusk-blue/28 bg-info-wash px-4 py-3 text-[12px] leading-snug text-slate-gray',
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-blue" aria-hidden />
      <div>
        <span className="font-semibold text-ink-navy">הנחה לא מאומתת · </span>
        {children}
      </div>
    </div>
  )
}
