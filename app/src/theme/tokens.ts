export const colors = {
  brand: '#0F766E',
  brandDark: '#115E59',
  ink: '#12312E',
  muted: '#5B746F',
  line: '#CFE0DB',
  panel: '#F4FAF7',
  canvas: '#E7F1EE',
  sidebar: '#0F3D38',
  teal950: '#042F2E',
  teal900: '#134E4A',
  teal800: '#115E59',
  teal700: '#0F766E',
  teal50: '#F0FDFA',
  teal300: '#5EEAD4',
  error: '#E11D48',
  rose600: '#E11D48',
  rose50: '#FFF1F2',
  amber500: '#D97706',
  amber50: '#FFFBEB',
  violet500: '#7C3AED',
  violet50: '#F5F3FF',
  sky600: '#0284C7',
  white: '#FFFFFF',
}

export const radii = {
  card: 28,
  nested: 16,
  control: 12,
  pill: 999,
  mark: 8,
  icon: 16,
}

export const fonts = {
  sans: 'InterTight_400Regular',
  sansMedium: 'InterTight_500Medium',
  sansSemibold: 'InterTight_600SemiBold',
  sansBold: 'InterTight_700Bold',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
}

export const cardShadow = {
  shadowColor: 'rgb(15,61,56)',
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.06,
  shadowRadius: 50,
  elevation: 8,
}

export const TONE = {
  teal: { fill: '#0f766e', track: '#d5ebe6', bg: 'rgba(240,253,250,0.9)', text: '#134E4A', icon: '#0F766E' },
  coral: { fill: '#e11d48', track: '#fde4ea', bg: 'rgba(255,241,242,0.9)', text: '#881337', icon: '#F43F5E' },
  amber: { fill: '#d97706', track: '#fdecc8', bg: 'rgba(255,251,235,0.9)', text: '#78350F', icon: '#F59E0B' },
  violet: { fill: '#7c3aed', track: '#ece4ff', bg: 'rgba(245,243,255,0.9)', text: '#2E1065', icon: '#7C3AED' },
  sky: { fill: '#0284c7', track: '#d7eefb', bg: 'rgba(240,249,255,0.9)', text: '#0C4A6E', icon: '#0284C7' },
  stone: { fill: '#57534e', track: '#e7e5e4', bg: 'rgba(250,250,249,0.9)', text: '#292524', icon: '#57534E' },
} as const

export type Tone = keyof typeof TONE

export const STATUS_SEGMENTS = [
  { key: 'todo', label: 'To do', color: '#94a3b8' },
  { key: 'inProgress', label: 'Doing', color: '#d97706' },
  { key: 'review', label: 'Under review', color: '#7c3aed' },
  { key: 'blocked', label: 'Blocked', color: '#e11d48' },
  { key: 'done', label: 'Done', color: '#0f766e' },
] as const
