import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-[10px] border border-hairline bg-soft-cyan px-3 text-[14px] text-ink-navy transition-colors duration-200 placeholder:text-mist-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk-blue',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-24 w-full rounded-[10px] border border-hairline bg-soft-cyan px-3 py-2.5 text-[14px] text-ink-navy placeholder:text-mist-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk-blue',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'
