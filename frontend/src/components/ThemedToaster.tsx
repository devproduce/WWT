import { Toaster } from 'sonner'
import { useTheme } from '@/features/theme/ThemeProvider'

export function ThemedToaster() {
  const { resolved } = useTheme()
  return (
    <Toaster
      richColors
      theme={resolved}
      position="top-right"
      expand
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast: 'rounded-2xl',
        },
      }}
    />
  )
}
