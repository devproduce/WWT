import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { api, apiError } from '@/services/api'
import { AuthShell } from '@/pages/LoginPage'

export function SetupPasswordPage() {
  const { setupPassword } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const token = params.get('token') ?? ''

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await setupPassword(token, password)
      navigate('/app')
    } catch (err) {
      setError(apiError(err, 'Could not set password'))
    }
  }

  return (
    <AuthShell title="Set your password" subtitle="Use the invite link from your administrator.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="New password">
          <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button className="w-full">Activate account</Button>
      </form>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const token = params.get('token') ?? ''

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await api.post('/auth/reset-password', { token, password })
      navigate('/login')
    } catch (err) {
      setError(apiError(err, 'Could not reset password'))
    }
  }

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for WeWorkTogether.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="New password">
          <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button className="w-full">Update password</Button>
      </form>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await api.post('/auth/forgot-password', { email })
    setSent(true)
  }

  return (
    <AuthShell title="Forgot password" subtitle="If the account exists, we will send a reset link.">
      {sent ? (
        <p className="text-sm text-teal-900/65">If that email is registered, a reset link is on its way (or logged in development).</p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  )
}
