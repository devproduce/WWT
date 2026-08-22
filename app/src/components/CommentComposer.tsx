import { Avatar } from '@/components/charts'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/field'
import type { ProjectMember } from '@/types'
import { colors, radii } from '@/theme/tokens'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

export function CommentBody({
  content,
  mentionedIds,
  members,
}: {
  content: string
  mentionedIds: string[]
  members: ProjectMember[]
}) {
  const names = members
    .filter((member) => mentionedIds.includes(member.id))
    .map((member) => member.name)
    .sort((a, b) => b.length - a.length)
  if (names.length === 0) {
    return (
      <AppText style={{ marginTop: 8, color: 'rgba(19,78,74,0.8)' }}>{content}</AppText>
    )
  }
  const pattern = new RegExp(`(@(?:${names.map(escapeRegExp).join('|')}))(?=\\s|$)`, 'g')
  const parts = content.split(pattern)
  return (
    <AppText style={{ marginTop: 8, color: 'rgba(19,78,74,0.8)' }}>
      {parts.map((part, index) =>
        names.some((name) => part === `@${name}`) ? (
          <AppText key={`${part}-${index}`} style={styles.mention}>
            {part}
          </AppText>
        ) : (
          <AppText key={`${part}-${index}`}>{part}</AppText>
        ),
      )}
    </AppText>
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function CommentComposer({
  members,
  currentUserId,
  pending,
  onSubmit,
}: {
  members: ProjectMember[]
  currentUserId?: string
  pending?: boolean
  onSubmit: (content: string, mentionedUserIds: string[]) => void
}) {
  const [value, setValue] = useState('')
  const mentionable = useMemo(
    () => members.filter((member) => member.id !== currentUserId),
    [members, currentUserId],
  )
  const mentioned = mentionable.filter((member) => value.includes(`@${member.name}`))

  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      <TextArea
        value={value}
        onChangeText={setValue}
        placeholder="Write a comment. Tap a name to mention them."
      />
      {mentionable.length > 0 ? (
        <View style={styles.people}>
          {mentionable.map((member) => (
            <Pressable
              key={member.id}
              style={styles.chip}
              onPress={() => {
                if (value.includes(`@${member.name}`)) return
                setValue((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}@${member.name} `)
              }}
            >
              <Avatar name={member.name} size="sm" />
              <AppText variant="caption">{member.name}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Button
        disabled={pending || !value.trim()}
        pending={pending}
        onPress={() => {
          if (!value.trim()) return
          onSubmit(
            value.trim(),
            mentioned.map((member) => member.id),
          )
          setValue('')
        }}
      >
        Comment
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  mention: {
    backgroundColor: colors.violet50,
    color: '#5B21B6',
    fontFamily: undefined,
  },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
})
