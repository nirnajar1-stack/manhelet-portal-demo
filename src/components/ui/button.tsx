import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[18px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-signal-blue text-paper shadow-button hover:bg-[#0057d6]',
        dark: 'bg-ink-navy text-paper shadow-button hover:bg-[#082a46]',
        outline:
          'border border-hairline bg-paper text-ink-navy hover:bg-pebble',
        ghost: 'text-ink-navy hover:bg-pebble',
        danger: 'bg-danger text-paper hover:bg-[#912018]',
      },
      size: {
        sm: 'h-9 px-3 text-[14px]',
        md: 'h-10 px-4 py-2.5',
        lg: 'h-12 px-5',
        icon: 'h-10 w-10',
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
