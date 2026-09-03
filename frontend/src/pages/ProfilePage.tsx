import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Badge, statusTone } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Avatar } from '@/components/charts'
import { useAuth } from '@/features/auth/AuthContext'
import { api, apiError } from '@/services/api'
import {
  detectBrowserPushFamily,
  ensurePushTokenRegistered,
  fetchPushRegistrationStatus,
  formatPushError,
  getPermissionState,
  isPushServiceBlockedError,
  isPushSupported,
  registerWebPush,
  unregisterWebPush,
  type BrowserPushFamily,
} from '@/services/pushNotifications'
import type { NotificationPrefs } from '@/types'

export function ProfilePage() {
  const { user, refreshMe } = useAuth()
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pushSupported, setPushSupported] = useState<boolean | null>(null)
  const [permissionState, setPermissionState] = useState(getPermissionState())
  const [pushBusy, setPushBusy] = useState(false)
  const [browserFamily, setBrowserFamily] = useState<BrowserPushFamily>('other')
  const [showPushGuide, setShowPushGuide] = useState(false)

  useEffect(() => {
    void isPushSupported().then(setPushSupported)
    void detectBrowserPushFamily().then(setBrowserFamily)
  }, [])

  useEffect(() => {
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
  }, [user?.firstName, user?.lastName])

  const prefs = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: async () => (await api.get<NotificationPrefs>('/me/notification-preferences')).data,
  })
  const pushStatus = useQuery({
    queryKey: ['push-status'],
    queryFn: fetchPushRegistrationStatus,
    enabled: permissionState === 'granted',
  })

  useEffect(() => {
    if (!prefs.data?.pushEnabled || permissionState !== 'granted') return
    void ensurePushTokenRegistered().then((registered) => {
      if (registered) {
        void queryClient.invalidateQueries({ queryKey: ['push-status'] })
      }
    })
  }, [prefs.data?.pushEnabled, permissionState, queryClient])

  const updatePrefs = useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => api.patch('/me/notification-preferences', patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs'] })
      toast.success('Email preferences saved')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const saveProfile = useMutation({
    mutationFn: async () => (await api.patch('/me', { firstName: firstName.trim(), lastName: lastName.trim() })).data,
    onSuccess: async () => {
      await refreshMe()
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(apiError(err, 'Could not update profile')),
  })
  const savePassword = useMutation({
    mutationFn: async () => api.post('/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      toast.success('Password updated')
    },
    onError: (err) => toast.error(apiError(err, 'Could not update password')),
  })

  const enableBrowserPush = async () => {
    setPushBusy(true)
    try {
      const token = await registerWebPush()
      setPermissionState(getPermissionState())
      if (!token) {
        if (getPermissionState() === 'denied') {
          toast.error('Notifications are blocked in your browser settings')
        }
        return false
      }
      await api.patch('/me/notification-preferences', { pushEnabled: true })
      await queryClient.invalidateQueries({ queryKey: ['notification-prefs'] })
      await queryClient.invalidateQueries({ queryKey: ['push-status'] })
      setShowPushGuide(false)
      toast.success('Browser notifications enabled')
      return true
    } catch (err) {
      if (isPushServiceBlockedError(err) && (browserFamily === 'brave' || browserFamily === 'chromium')) {
        setShowPushGuide(true)
        return false
      }
      toast.error(formatPushError(err))
      return false
    } finally {
      setPushBusy(false)
    }
  }

  const disableBrowserPush = async () => {
    setPushBusy(true)
    try {
      await unregisterWebPush()
      await api.patch('/me/notification-preferences', { pushEnabled: false })
      await queryClient.invalidateQueries({ queryKey: ['notification-prefs'] })
      await queryClient.invalidateQueries({ queryKey: ['push-status'] })
      toast.success('Browser notifications disabled')
    } catch (err) {
      toast.error(apiError(err, 'Could not disable notifications'))
    } finally {
      setPushBusy(false)
    }
  }

  const onPushToggle = async (enabled: boolean) => {
    if (enabled) {
      await enableBrowserPush()
    } else {
      await disableBrowserPush()
    }
  }

  if (!user) return null

  const roleLabel =
    user.role === 'SUPER_ADMIN'
      ? 'Platform owner'
      : user.role === 'ADMIN'
        ? 'Organization admin'
        : user.managedProjectIds.length > 0
          ? 'Project manager'
          : 'Member'

  const pushChecked = Boolean(
    prefs.data?.pushEnabled && permissionState === 'granted' && (pushStatus.data?.registered ?? false),
  )
  const pushDisabled =
    pushBusy ||
    pushSupported === false ||
    permissionState === 'denied' ||
    prefs.data == null

  const onSaveProfile = (event: FormEvent) => {
    event.preventDefault()
    saveProfile.mutate()
  }
  const onSavePassword = (event: FormEvent) => {
    event.preventDefault()
    savePassword.mutate()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        subtitle="Your details and how WeWorkTogether talks to you."
      />
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar name={`${user.firstName} ${user.lastName}`} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-xl font-semibold tracking-tight text-ink">
            {user.firstName} {user.lastName}
          </div>
          <div className="truncate text-sm text-muted">{user.email}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={statusTone(user.role)}>{roleLabel}</Badge>
            {user.organizationName && <Badge>{user.organizationName}</Badge>}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Your details</CardTitle>
          <p className="mt-1 text-sm text-muted">Name is what teammates see on comments and assignments. Email cannot be changed here.</p>
          <form className="mt-5 space-y-4" onSubmit={onSaveProfile}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
              </Field>
              <Field label="Last name">
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
              </Field>
            </div>
            <Field label="Email">
              <Input value={user.email} disabled />
            </Field>
            <Button disabled={saveProfile.isPending || !firstName.trim() || !lastName.trim()}>Save name</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Password</CardTitle>
          <p className="mt-1 text-sm text-muted">Use at least 8 characters.</p>
          <form className="mt-5 space-y-4" onSubmit={onSavePassword}>
            <Field label="Current password">
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </Field>
            <Field label="New password">
              <Input
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </Field>
            <Button disabled={savePassword.isPending || currentPassword.length === 0 || newPassword.length < 8}>
              Update password
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <CardTitle>Browser notifications</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Get notified when tasks are assigned, comments are added, or reviews need attention — even when this tab is in the background.
        </p>
        <div className="mt-5">
          {pushSupported === false ? (
            <p className="text-sm text-muted">This browser does not support push notifications.</p>
          ) : permissionState === 'denied' ? (
            <p className="text-sm text-amber-800">
              Notifications are blocked for this site. Allow them in your browser settings, then reload this page.
            </p>
          ) : prefs.data ? (
            <PrefRow
              label="Push notifications"
              hint="Send browser alerts for workspace activity"
              checked={pushChecked}
              disabled={pushDisabled}
              onChange={(enabled) => {
                void onPushToggle(enabled)
              }}
            />
          ) : (
            <p className="text-sm text-muted">Loading preferences…</p>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Email me about</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Invites and password setup still send email. Other product emails are paused for now — these toggles are saved for when they come back.
        </p>
        <div className="mt-5 space-y-1">
          {prefs.data ? (
            <>
              <PrefRow
                label="Comments"
                hint="When someone comments on work assigned to you"
                checked={prefs.data.emailComments}
                disabled={updatePrefs.isPending}
                onChange={(emailComments) => updatePrefs.mutate({ emailComments })}
              />
              <PrefRow
                label="Assignments"
                hint="When a task or project is assigned to you"
                checked={prefs.data.emailAssignments}
                disabled={updatePrefs.isPending}
                onChange={(emailAssignments) => updatePrefs.mutate({ emailAssignments })}
              />
              <PrefRow
                label="Reviews"
                hint="Ready for review, returned, approved, or blocked"
                checked={prefs.data.emailReviews}
                disabled={updatePrefs.isPending}
                onChange={(emailReviews) => updatePrefs.mutate({ emailReviews })}
              />
              <PrefRow
                label="Deadlines"
                hint="Due tomorrow and overdue reminders"
                checked={prefs.data.emailDeadlines}
                disabled={updatePrefs.isPending}
                onChange={(emailDeadlines) => updatePrefs.mutate({ emailDeadlines })}
              />
            </>
          ) : (
            <p className="text-sm text-muted">Loading preferences…</p>
          )}
        </div>
      </Card>

      {showPushGuide && (
        <PushMessagingGuideModal
          family={browserFamily}
          busy={pushBusy}
          onClose={() => setShowPushGuide(false)}
          onRetry={() => {
            void enableBrowserPush()
          }}
        />
      )}
    </div>
  )
}

function PushMessagingGuideModal({
  family,
  busy,
  onClose,
  onRetry,
}: {
  family: BrowserPushFamily
  busy: boolean
  onClose: () => void
  onRetry: () => void
}) {
  const isBrave = family === 'brave'

  return (
    <Modal>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Enable Google push messaging</h2>
          <p className="mt-2 text-sm text-teal-900/60">
            {isBrave
              ? 'Brave turns off Google’s push service by default. Turn it on, restart Brave, then try again.'
              : 'This browser needs Google’s push service for notifications. Enable it in privacy settings, restart the browser, then try again.'}
          </p>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
          {isBrave ? (
            <>
              <li>
                Open <span className="font-medium">brave://settings/privacy</span>
              </li>
              <li>
                Enable <span className="font-medium">Use Google services for push messaging</span>
              </li>
              <li>Restart Brave completely</li>
              <li>Return here and click Try again</li>
            </>
          ) : (
            <>
              <li>Open your browser’s Privacy / Security settings</li>
              <li>Enable Google services for push messaging (wording varies by browser)</li>
              <li>Restart the browser</li>
              <li>Return here and click Try again</li>
            </>
          )}
        </ol>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={onRetry}>
            {busy ? 'Checking…' : 'Try again'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PrefRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-3 py-3 hover:bg-teal-50/70">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-teal-800"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}
