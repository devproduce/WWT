import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/features/theme/ThemeProvider'
import { cn } from '@/lib/utils'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-teal-900/10 bg-white/70 p-0.5 dark:border-teal-200/15 dark:bg-white/5',
        compact && 'shrink-0',
      )}
      role="group"
      aria-label="Color theme"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              'flex items-center justify-center rounded-full p-2 text-teal-800 app-ease dark:text-teal-200/70',
              active &&
                'bg-teal-800 text-white shadow-[0_8px_18px_rgb(15_118_110_/_0.22)] dark:bg-teal-300 dark:text-teal-950 dark:shadow-[0_8px_18px_rgb(45_212_191_/_0.22)]',
            )}
          >
            <Icon className="h-4 w-4" />
            {!compact && <span className="sr-only">{label}</span>}
          </button>
        )
      })}
    </div>
  )
}
