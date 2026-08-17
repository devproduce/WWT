import type { ReactNode } from 'react'

export function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-teal-950/35 p-4 backdrop-blur-sm">
      <div className="app-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] p-6 shadow-[0_30px_80px_rgb(15_61_56_/_0.28)]">
        {children}
      </div>
    </div>
  )
}
