import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const tones = {
  info: 'bg-badge-bg text-signal-blue',
  muted: 'bg-pebble text-slate-gray',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning-text',
  danger: 'bg-danger-bg text-danger',
  blue: 'bg-badge-bg text-signal-blue',
  gold: 'bg-gold-wash text-ink-navy',
  accent: 'bg-dusk-blue/25 text-ink-navy',
} as const

/** Compact status chip — 6px radius (not pill) for denser ops UI. */
export function Badge({
  children,
  tone = 'info',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof tones
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}
