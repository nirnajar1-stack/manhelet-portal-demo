import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-[14px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        /* Primary CTA — Soft Golden Yellow + Midnight Navy text */
        primary: 'bg-gold text-ink-navy hover:bg-gold-hover',
        /* Secondary — Dusk Blue + Midnight Navy text */
        secondary: 'bg-dusk-blue text-ink-navy hover:bg-dusk-blue/85',
        dark: 'bg-ink-navy text-paper hover:bg-deep-navy',
        /* Tertiary — outline */
        outline:
          'border border-hairline bg-paper text-ink-navy hover:bg-soft-cyan',
        ghost: 'text-ink-navy hover:bg-soft-cyan',
        soft: 'bg-badge-bg text-signal-blue hover:bg-dusk-blue/25',
        success: 'bg-success text-paper hover:bg-success/90',
        danger: 'bg-danger text-paper hover:bg-danger/90',
      },
      size: {
        sm: 'h-9 min-h-9 px-3 text-[13px] sm:h-8',
        md: 'h-10 min-h-10 px-4 sm:h-9',
        lg: 'h-11 min-h-11 px-5 text-[15px]',
        icon: 'h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
