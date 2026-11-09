import { cn } from '@/lib/utils'

/** Default surface: hairline border, no decorative shadow. */
export function Card({
  className,
  children,
  elevated = false,
}: {
  className?: string
  children: React.ReactNode
  elevated?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-hairline bg-paper p-5',
        elevated && 'shadow-elevated',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Panel({
  className,
  children,
  elevated = false,
}: {
  className?: string
  children: React.ReactNode
  elevated?: boolean
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-hairline bg-paper p-5',
        elevated && 'shadow-elevated',
        className,
      )}
    >
      {children}
    </section>
  )
}
