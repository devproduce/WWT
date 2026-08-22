import { colors, fonts } from '@/theme/tokens'
import { Text, type TextProps } from 'react-native'

type Variant = 'body' | 'title' | 'cardTitle' | 'subtitle' | 'eyebrow' | 'label' | 'metric' | 'caption'

const variants: Record<Variant, TextProps['style']> = {
  body: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  title: {
    fontFamily: fonts.sansSemibold,
    fontSize: 30,
    letterSpacing: -0.8,
    color: colors.teal950,
  },
  cardTitle: {
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: colors.teal950,
  },
  subtitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    color: 'rgba(19, 78, 74, 0.55)',
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    color: 'rgba(15, 118, 110, 0.8)',
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(17, 94, 89, 0.7)',
  },
  metric: {
    fontFamily: fonts.sansSemibold,
    fontSize: 24,
    letterSpacing: -0.4,
    color: colors.teal950,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: 'rgba(19, 78, 74, 0.5)',
  },
}

export function AppText({
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[variants[variant], style]} />
}
