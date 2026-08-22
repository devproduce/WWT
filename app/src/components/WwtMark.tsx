import { colors, fonts, radii } from '@/theme/tokens'
import { StyleSheet, Text, View } from 'react-native'

export function WwtMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 44 : size === 'sm' ? 28 : 32
  const type = size === 'lg' ? 11 : size === 'sm' ? 8 : 9
  return (
    <View style={[styles.mark, { width: box, height: box }]}>
      <Text style={[styles.letters, { fontSize: type }]}>WWT</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.mark,
    backgroundColor: colors.white,
    shadowColor: 'rgb(45,212,191)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 4,
  },
  letters: {
    fontFamily: fonts.sansBold,
    color: '#000000',
    letterSpacing: -0.7,
  },
})
