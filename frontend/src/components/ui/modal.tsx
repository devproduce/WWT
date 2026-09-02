import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ children }: { children: ReactNode }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-teal-950/35 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="app-card max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-[28px] p-6 shadow-[0_30px_80px_rgb(15_61_56_/_0.28)]"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
