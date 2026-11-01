import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const tones = {
  info: 'bg-badge-bg text-deep-cobalt',
  muted: 'bg-pebble text-slate-gray',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  blue: 'bg-badge-bg text-signal-blue',
} as const

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
        'inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
