import { StyleSheet, Text, View } from 'react-native'

export default function IndexScreen() {
  return (
    <View style={styles.canvas}>
      <Text style={styles.mark}>WWT</Text>
      <Text style={styles.title}>WeWorkTogether</Text>
      <Text style={styles.subtitle}>Companion app</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F1EE',
  },
  mark: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#042F2E',
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '600',
    color: '#042F2E',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    fontStyle: 'italic',
    color: 'rgba(19, 78, 74, 0.55)',
  },
})
