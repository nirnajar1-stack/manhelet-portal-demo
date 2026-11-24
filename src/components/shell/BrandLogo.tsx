import { Link } from 'react-router-dom'
import { withBase } from '@/lib/base-path'
import { cn } from '@/lib/utils'

/** Official Manhelet lockup — shield + Hebrew wordmark (navy / gold / white). */
export const MANHELET_LOGO_SRC = withBase('/brand/manhelet-logo.jpg')
export const MANHELET_LOGO_ALT =
  'מנהלת החטופים והנעדרים השבים ומשפחותיהם · משרד ראש הממשלה'

type BrandLogoProps = {
  to?: string
  /** Visual size of the lockup height (width follows aspect). */
  size?: 'sm' | 'md' | 'lg'
  /**
   * `plain` — on light paper chrome.
   * `plate` — light plate behind the logo for contrast on navy surfaces.
   */
  surface?: 'plain' | 'plate'
  className?: string
  imgClassName?: string
}

const sizeClass = {
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-14',
} as const

/**
 * Authentic official logo. Do not recolor — use `surface="plate"` on dark navy.
 */
export function BrandLogo({
  to = '/',
  size = 'md',
  surface = 'plain',
  className,
  imgClassName,
}: BrandLogoProps) {
  const mark = (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        surface === 'plate' &&
          'rounded-[12px] bg-paper px-3 py-2.5 shadow-soft ring-1 ring-paper/50',
        className,
      )}
    >
      <img
        src={MANHELET_LOGO_SRC}
        alt={MANHELET_LOGO_ALT}
        className={cn(
          sizeClass[size],
          'w-auto max-w-full object-contain object-center',
          imgClassName,
        )}
        decoding="async"
      />
    </span>
  )

  if (!to) return mark

  return (
    <Link
      to={to}
      className="inline-flex shrink-0 rounded-[10px] focus-visible:outline-none"
      aria-label={MANHELET_LOGO_ALT}
    >
      {mark}
    </Link>
  )
}
