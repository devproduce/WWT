import { AuthShell } from '@/components/AuthShell'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { useAuth } from '@/features/auth/AuthContext'
import { apiError } from '@/services/api'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

export default function SetupPasswordScreen() {
  const { setupPassword } = useAuth()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const onSubmit = async () => {
    setPending(true)
    setError('')
    try {
      await setupPassword(token ?? '', password)
      router.replace('/(main)')
    } catch (err) {
      setError(apiError(err, 'Could not set password'))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell title="Set your password" subtitle="Use the invite link from your administrator.">
      <View style={styles.form}>
        <Field label="New password">
          <Input secureTextEntry value={password} onChangeText={setPassword} />
        </Field>
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <Button pending={pending} disabled={password.length < 8} onPress={onSubmit}>
          Activate account
        </Button>
      </View>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  error: { color: '#e11d48', fontSize: 14 },
})
