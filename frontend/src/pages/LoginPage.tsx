import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { apiError } from '@/services/api'
import { WwtMark } from '@/components/WwtMark'

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
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button className="w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="text-center text-sm">
          <Link className="text-teal-800 hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="app-canvas relative min-h-screen overflow-hidden">
      <div className="app-orb pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-teal-300/35 blur-3xl" />
      <div className="app-orb pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" style={{ animationDelay: '5s' }} />
      <div className="relative grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[#0f3d38] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="app-orb absolute -left-10 top-20 h-56 w-56 rounded-full bg-teal-400/25 blur-3xl" />
          <div className="app-orb absolute right-0 bottom-10 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" style={{ animationDelay: '3s' }} />
          <Link to="/" className="relative z-10 flex items-center gap-3 text-white hover:text-teal-200">
            <WwtMark size="lg" />
            <span className="text-xl font-semibold tracking-[0.22em]">WWT</span>
          </Link>
          <div className="relative z-10">
            <div className="font-mono text-[11px] tracking-[0.32em] text-teal-200/80 uppercase">WeWorkTogether</div>
            <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight">
              A role-aware workspace for <span className="font-serif italic text-teal-200">real</span> organizations.
            </h1>
            <p className="mt-4 max-w-md text-teal-100/70">
              SuperAdmins run the platform. Admins run the company. Project Managers run delivery. Members get work done.
            </p>
          </div>
          <div className="relative z-10 text-sm text-teal-200/50">Privacy-first multi-tenant SaaS</div>
        </div>
        <div className="flex items-center justify-center p-6">
          <div className="app-card app-shine w-full max-w-md rounded-[28px] p-8">
            <Link to="/" className="mb-6 inline-block text-sm text-teal-800 hover:underline">
              ← Back to WWT
            </Link>
            <h2 className="text-2xl font-semibold tracking-tight text-teal-950">{title}</h2>
            <p className="mb-6 mt-1 font-serif italic text-teal-900/55">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
