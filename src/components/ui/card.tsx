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
        'rounded-[10px] border border-hairline bg-paper p-4',
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
        'rounded-[10px] border border-hairline bg-paper p-4',
        elevated && 'shadow-elevated',
        className,
      )}
    >
      {children}
    </section>
  )
}
