import type { ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] tracking-[0.18em] text-teal-800/70 uppercase dark:text-teal-200/60">{label}</span>
      {children}
    </label>
  )
}
