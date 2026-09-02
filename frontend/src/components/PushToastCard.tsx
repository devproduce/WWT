import { Bell, X } from 'lucide-react'

type PushToastCardProps = {
  title: string
  body?: string
  onOpen?: () => void
  onDismiss: () => void
}

export function PushToastCard({ title, body, onOpen, onDismiss }: PushToastCardProps) {
  return (
    <div className="push-toast-card w-[min(100vw-2rem,22rem)] overflow-hidden rounded-3xl border border-teal-900/15 bg-gradient-to-br from-white via-teal-50/90 to-amber-50/70 p-4 shadow-[0_28px_60px_rgb(15_61_56_/_0.28),0_8px_18px_rgb(15_61_56_/_0.12),inset_0_1px_0_rgb(255_255_255_/_0.9)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-800/15 bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-[0_10px_20px_rgb(15_118_110_/_0.35),inset_0_1px_0_rgb(255_255_255_/_0.25)]">
          <Bell className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800/70">
            WeWorkTogether
          </p>
          <p className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-teal-950">
            {title}
          </p>
          {body ? (
            <p className="mt-1.5 text-sm leading-relaxed text-teal-900/65">{body}</p>
          ) : null}
          <div className="mt-3.5 flex items-center gap-2">
            {onOpen ? (
              <button
                type="button"
                className="rounded-full bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_8px_16px_rgb(15_118_110_/_0.28)] transition hover:-translate-y-0.5 hover:bg-teal-700"
                onClick={() => {
                  onOpen()
                  onDismiss()
                }}
              >
                Open
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-full border border-teal-900/10 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-teal-900/70 transition hover:bg-white"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="rounded-full p-1 text-teal-900/35 transition hover:bg-teal-900/5 hover:text-teal-900/70"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
