import { AuthShell } from '@/components/AuthShell'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { api, apiError } from '@/services/api'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const onSubmit = async () => {
    setPending(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token: token ?? '', password })
      router.replace('/login')
    } catch (err) {
      setError(apiError(err, 'Could not reset password'))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for WeWorkTogether.">
      <View style={styles.form}>
        <Field label="New password">
          <Input secureTextEntry value={password} onChangeText={setPassword} />
        </Field>
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <Button pending={pending} disabled={password.length < 8} onPress={onSubmit}>
          Update password
        </Button>
      </View>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  error: { color: '#e11d48', fontSize: 14 },
})
