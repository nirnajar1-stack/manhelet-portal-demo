import { cn } from '@/lib/utils'

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
        'rounded-lg border border-hairline/80 bg-paper p-5 shadow-soft',
        elevated && 'shadow-elevated border-transparent',
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
        'rounded-lg border border-hairline/60 bg-paper p-5 shadow-soft',
        elevated && 'shadow-elevated border-transparent',
        className,
      )}
    >
      {children}
    </section>
  )
}
