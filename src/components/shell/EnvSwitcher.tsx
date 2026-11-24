import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'

type EnvId = 'matam' | 'molecule' | 'family'

const ENV_OPTIONS: { id: EnvId; label: string }[] = [
  { id: 'matam', label: 'מת״מים ומנהלי תיק' },
  { id: 'molecule', label: 'מרחב מולקולות' },
  { id: 'family', label: 'תצוגת שירות למשפחות' },
]

/**
 * Demo environment switcher. Commits role/user with flushSync before
 * navigate so RoleHome never sees a stale `family` role on `/` and
 * bounces the user back into the families portal.
 */
export function EnvSwitcher({
  onDark = false,
  onAfterSwitch,
  className,
}: {
  onDark?: boolean
  onAfterSwitch?: () => void
  className?: string
}) {
  const { currentUser, setRole, switchUser } = useApp()
  const navigate = useNavigate()

  const active: EnvId =
    currentUser.role === 'molecule'
      ? 'molecule'
      : currentUser.role === 'family'
        ? 'family'
        : 'matam'

  function go(id: EnvId) {
    if (id === 'molecule') {
      flushSync(() => switchUser('u-dana'))
      navigate('/molecule')
    } else if (id === 'family') {
      flushSync(() => setRole('family'))
      navigate('/families')
    } else {
      flushSync(() => setRole('matam'))
      navigate('/')
    }
    onAfterSwitch?.()
  }

  return (
    <div
      className={cn('space-y-1 rounded-xl p-2', onDark ? 'bg-paper/10' : 'bg-pebble', className)}
      role="radiogroup"
      aria-label="החלפת סביבה"
    >
      {ENV_OPTIONS.map((opt) => (
        <EnvOption
          key={opt.id}
          active={active === opt.id}
          label={opt.label}
          onDark={onDark}
          onClick={() => go(opt.id)}
        />
      ))}
    </div>
  )
}

function EnvOption({
  active,
  label,
  onClick,
  onDark = false,
}: {
  active: boolean
  label: string
  onClick: () => void
  onDark?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-[10px] px-2.5 py-2.5 text-start text-[13px] font-medium transition-colors duration-200',
        onDark
          ? active
            ? 'bg-dusk-blue text-ink-navy'
            : 'text-paper/85 hover:bg-paper/10 hover:text-paper'
          : active
            ? 'bg-paper text-ink-navy shadow-soft ring-1 ring-hairline'
            : 'text-slate-gray hover:bg-paper/70',
      )}
    >
      <span
        className={cn(
          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
          active
            ? onDark
              ? 'border-ink-navy bg-gold'
              : 'border-dusk-blue bg-dusk-blue'
            : onDark
              ? 'border-paper/55 bg-transparent'
              : 'border-mist-gray bg-transparent',
        )}
        aria-hidden
      >
        {active && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              onDark ? 'bg-ink-navy' : 'bg-paper',
            )}
          />
        )}
      </span>
      {label}
    </button>
  )
}
