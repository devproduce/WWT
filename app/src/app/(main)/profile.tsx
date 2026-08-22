import { Avatar } from '@/components/charts'
import { PageHeader } from '@/components/PageHeader'
import { AppText } from '@/components/ui/AppText'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/field'
import { useAuth } from '@/features/auth/AuthContext'
import { api, apiError } from '@/services/api'
import { colors, radii } from '@/theme/tokens'
import type { NotificationPrefs } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from '@/components/Toast'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native'

export default function ProfileScreen() {
  const { user, refreshMe } = useAuth()
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
  }, [user?.firstName, user?.lastName])

  const prefs = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: async () => (await api.get<NotificationPrefs>('/me/notification-preferences')).data,
  })
  const updatePrefs = useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => api.patch('/me/notification-preferences', patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-prefs'] }),
    onError: (err) => toast.error(apiError(err)),
  })
  const saveProfile = useMutation({
    mutationFn: async () => (await api.patch('/me', { firstName: firstName.trim(), lastName: lastName.trim() })).data,
    onSuccess: async () => {
      await refreshMe()
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const savePassword = useMutation({
    mutationFn: async () => api.post('/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      toast.success('Password updated')
    },
    onError: (err) => toast.error(apiError(err)),
  })

  if (!user) return null

  const roleLabel =
    user.role === 'SUPER_ADMIN'
      ? 'Platform owner'
      : user.role === 'ADMIN'
        ? 'Organization admin'
        : user.managedProjectIds.length > 0
          ? 'Project manager'
          : 'Member'

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <PageHeader eyebrow="Account" title="Profile" subtitle="Your details and how WeWorkTogether talks to you." />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Avatar name={`${user.firstName} ${user.lastName}`} size="lg" />
          <View style={{ flex: 1 }}>
            <AppText variant="title" style={{ fontSize: 22 }}>
              {user.firstName} {user.lastName}
            </AppText>
            <AppText variant="caption">{user.email}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <Badge tone={statusTone(user.role)}>{roleLabel}</Badge>
              {user.organizationName ? <Badge>{user.organizationName}</Badge> : null}
            </View>
          </View>
        </View>
      </Card>
      <Card>
        <CardTitle>Your details</CardTitle>
        <AppText variant="caption" style={{ marginTop: 4 }}>
          Name is what teammates see on comments and assignments. Email cannot be changed here.
        </AppText>
        <View style={{ marginTop: 16, gap: 12 }}>
          <Field label="First name">
            <Input value={firstName} onChangeText={setFirstName} />
          </Field>
          <Field label="Last name">
            <Input value={lastName} onChangeText={setLastName} />
          </Field>
          <Field label="Email">
            <Input value={user.email} editable={false} />
          </Field>
          <Button
            disabled={saveProfile.isPending || !firstName.trim() || !lastName.trim()}
            pending={saveProfile.isPending}
            onPress={() => saveProfile.mutate()}
          >
            Save name
          </Button>
        </View>
      </Card>
      <Card>
        <CardTitle>Password</CardTitle>
        <AppText variant="caption" style={{ marginTop: 4 }}>
          Use at least 8 characters.
        </AppText>
        <View style={{ marginTop: 16, gap: 12 }}>
          <Field label="Current password">
            <Input secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
          </Field>
          <Field label="New password">
            <Input secureTextEntry value={newPassword} onChangeText={setNewPassword} />
          </Field>
          <Button
            disabled={savePassword.isPending || currentPassword.length === 0 || newPassword.length < 8}
            pending={savePassword.isPending}
            onPress={() => savePassword.mutate()}
          >
            Update password
          </Button>
        </View>
      </Card>
      <Card>
        <CardTitle>Email me about</CardTitle>
        <AppText variant="caption" style={{ marginTop: 4 }}>
          Invites and password setup still send email. Other product emails are paused for now — these toggles are saved
          for when they come back.
        </AppText>
        <View style={{ marginTop: 12 }}>
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
            <AppText variant="caption">Loading preferences…</AppText>
          )}
        </View>
      </Card>
    </ScrollView>
    </KeyboardAvoidingView>
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
    <Pressable style={styles.pref} onPress={() => !disabled && onChange(!checked)}>
      <View style={{ flex: 1 }}>
        <AppText variant="cardTitle">{label}</AppText>
        <AppText variant="caption">{hint}</AppText>
      </View>
      <Switch
        value={checked}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: '#D5EBE6', true: colors.teal700 }}
        thumbColor={colors.white}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, paddingBottom: 40 },
  pref: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.nested,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
