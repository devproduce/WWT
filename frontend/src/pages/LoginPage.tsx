import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { apiError } from '@/services/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      setError(apiError(err, 'Invalid email or password'))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Manage organizations, projects, and work in one place.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="text-center text-sm">
          <Link className="text-teal-700" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
        <div className="text-2xl font-semibold">WeWorkTogether</div>
        <div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight">A role-aware workspace for real organizations.</h1>
          <p className="mt-4 max-w-md text-slate-300">
            SuperAdmins run the platform. Admins run the company. Project Managers run delivery. Members get work done.
          </p>
        </div>
        <div className="text-sm text-slate-400">Privacy-first multi-tenant SaaS</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
