import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[14px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-ink-navy text-paper shadow-button hover:bg-deep-navy',
        dark: 'bg-deep-navy text-paper shadow-button hover:bg-ink-navy',
        outline:
          'border border-hairline bg-paper text-ink-navy hover:bg-pebble',
        ghost: 'text-ink-navy hover:bg-pebble',
        soft: 'bg-badge-bg text-signal-blue hover:bg-[#d9e7fc]',
        success: 'bg-success text-paper hover:bg-[#2e7d32]',
        danger: 'bg-danger text-paper hover:bg-[#b71c1c]',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-4',
        lg: 'h-11 px-5 text-[15px]',
        icon: 'h-9 w-9',
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
