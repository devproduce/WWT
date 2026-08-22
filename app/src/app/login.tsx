import { AuthShell } from '@/components/AuthShell'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { useAuth } from '@/features/auth/AuthContext'
import { apiError } from '@/services/api'
import { router, Redirect } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

export default function LoginScreen() {
  const { login, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (!loading && user) return <Redirect href="/(main)" />

  const onSubmit = async () => {
    setPending(true)
    setError('')
    try {
      await login(email.trim(), password)
      router.replace('/(main)')
    } catch (err) {
      setError(apiError(err, 'Invalid email or password'))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Manage organizations, projects, and work in one place.">
      <View style={styles.form}>
        <Field label="Email">
          <Input
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
        </Field>
        <Field label="Password">
          <Input secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} />
        </Field>
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <Button pending={pending} disabled={!email || !password} onPress={onSubmit} style={styles.full}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
        <Pressable onPress={() => router.push('/forgot-password')}>
          <AppText style={styles.link}>Forgot password?</AppText>
        </Pressable>
      </View>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  error: { color: '#e11d48', fontSize: 14 },
  full: { alignSelf: 'stretch' },
  link: { color: '#115E59', textAlign: 'center', textDecorationLine: 'underline' },
})
