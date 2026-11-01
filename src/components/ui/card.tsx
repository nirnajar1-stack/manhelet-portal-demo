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
        'rounded-xl border border-hairline bg-paper p-6',
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
        'rounded-[24px] border border-hairline bg-paper p-6 shadow-soft',
        elevated && 'shadow-elevated border-transparent',
        className,
      )}
    >
      {children}
    </section>
  )
}
