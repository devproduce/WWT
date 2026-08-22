import { AuthShell } from '@/components/AuthShell'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { api } from '@/services/api'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  const onSubmit = async () => {
    setPending(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell title="Forgot password" subtitle="If the account exists, we will send a reset link.">
      {sent ? (
        <AppText style={styles.copy}>
          If that email is registered, a reset link is on its way (or logged in development).
        </AppText>
      ) : (
        <View style={styles.form}>
          <Field label="Email">
            <Input autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          </Field>
          <Button pending={pending} disabled={!email} onPress={onSubmit}>
            Send reset link
          </Button>
        </View>
      )}
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  copy: { color: 'rgba(19, 78, 74, 0.65)', fontSize: 14 },
})
