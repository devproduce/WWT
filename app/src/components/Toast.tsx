import { AppText } from '@/components/ui/AppText'
import { colors, radii } from '@/theme/tokens'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Tone = 'ok' | 'error'
type ToastItem = { id: number; message: string; tone: Tone }

let push: ((message: string, tone: Tone) => void) | null = null
let seq = 0

export const toast = {
  success: (message: string) => push?.(message, 'ok'),
  error: (message: string) => push?.(message, 'error'),
}

export function ToastHost() {
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<ToastItem[]>([])
  const add = useCallback((message: string, tone: Tone) => {
    const id = ++seq
    setItems((current) => [...current.slice(-2), { id, message, tone }])
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3200)
  }, [])

  useEffect(() => {
    push = add
    return () => {
      push = null
    }
  }, [add])

  if (items.length === 0) return null
  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 12 }]}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => setItems((current) => current.filter((row) => row.id !== item.id))}
          style={[styles.toast, item.tone === 'error' ? styles.error : styles.ok]}
        >
          <AppText style={{ color: item.tone === 'error' ? '#9F1239' : colors.teal950 }}>{item.message}</AppText>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 50,
    gap: 8,
    alignItems: 'flex-end',
  },
  toast: {
    maxWidth: 360,
    borderRadius: radii.nested,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  ok: { backgroundColor: 'rgba(240,253,250,0.96)', borderColor: 'rgba(13,148,136,0.25)' },
  error: { backgroundColor: 'rgba(255,241,242,0.96)', borderColor: 'rgba(225,29,72,0.25)' },
})
