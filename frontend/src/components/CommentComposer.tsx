import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/charts'
import { cn } from '@/lib/utils'
import type { ProjectMember } from '@/types'

export function findActiveMention(value: string, cursor: number) {
  const before = value.slice(0, cursor)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  if (at > 0 && !/\s/.test(value[at - 1] ?? '')) return null
  const query = before.slice(at + 1)
  if (query.includes('\n')) return null
  return { start: at, query }
}

export function mentionStillPresent(content: string, name: string) {
  const token = `@${name}`
  let from = 0
  while (from <= content.length) {
    const at = content.indexOf(token, from)
    if (at < 0) return false
    const after = at + token.length
    const boundedStart = at === 0 || /\s/.test(content[at - 1] ?? '')
    const boundedEnd = after === content.length || /\s/.test(content[after] ?? '')
    if (boundedStart && boundedEnd) return true
    from = at + 1
  }
  return false
}

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
    return <div className="mt-2 whitespace-pre-wrap text-teal-900/80">{content}</div>
  }
  const pattern = new RegExp(`(@(?:${names.map(escapeRegExp).join('|')}))(?=\\s|$)`, 'g')
  const parts = content.split(pattern)
  return (
    <div className="mt-2 whitespace-pre-wrap text-teal-900/80">
      {parts.map((part, index) =>
        names.some((name) => part === `@${name}`) ? (
          <span key={`${part}-${index}`} className="rounded-md bg-violet-100 px-1 py-0.5 font-medium text-violet-900">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </div>
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
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const [picked, setPicked] = useState<{ id: string; name: string }[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [cursor, setCursor] = useState(0)

  const mentionable = useMemo(
    () => members.filter((member) => member.id !== currentUserId),
    [members, currentUserId],
  )
  const active = open ? findActiveMention(value, cursor) : null
  const query = active?.query ?? ''
  const matches = mentionable.filter((member) => member.name.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const applyValue = (next: string, nextCursor: number, keepOpen: boolean) => {
    setValue(next)
    setCursor(nextCursor)
    setPicked((current) => current.filter((item) => mentionStillPresent(next, item.name)))
    setOpen(keepOpen)
    requestAnimationFrame(() => {
      const node = areaRef.current
      if (!node) return
      node.focus()
      node.setSelectionRange(nextCursor, nextCursor)
    })
  }

  const insertMention = (member: ProjectMember) => {
    const current = findActiveMention(value, cursor)
    if (!current) {
      setOpen(false)
      return
    }
    const token = `@${member.name} `
    const next = `${value.slice(0, current.start)}${token}${value.slice(cursor)}`
    const nextCursor = current.start + token.length
    setValue(next)
    setCursor(nextCursor)
    setOpen(false)
    setPicked((currentPicked) => {
      const kept = currentPicked.filter((item) => mentionStillPresent(next, item.name))
      return kept.some((item) => item.id === member.id) ? kept : [...kept, { id: member.id, name: member.name }]
    })
    requestAnimationFrame(() => {
      const node = areaRef.current
      if (!node) return
      node.focus()
      node.setSelectionRange(nextCursor, nextCursor)
    })
  }

  const onChange = (next: string, nextCursor: number) => {
    const mention = findActiveMention(next, nextCursor)
    const typedAt = nextCursor > 0 && next[nextCursor - 1] === '@' && (nextCursor === 1 || /\s/.test(next[nextCursor - 2] ?? ''))
    applyValue(next, nextCursor, Boolean(mention && (open || typedAt)))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || matches.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((index) => (index + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((index) => (index - 1 + matches.length) % matches.length)
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      insertMention(matches[highlight] ?? matches[0])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim()) return
    const remaining = picked.filter((item) => mentionStillPresent(value, item.name))
    onSubmit(value.trim(), remaining.map((item) => item.id))
    setValue('')
    setPicked([])
    setOpen(false)
    setCursor(0)
  }

  return (
    <form className="mt-3 space-y-2" onSubmit={submit}>
      <div ref={boxRef} className="relative">
        <Textarea
          ref={areaRef}
          value={value}
          placeholder="Write a comment. Type @ to mention someone."
          onKeyDown={onKeyDown}
          onClick={(event) => setCursor(event.currentTarget.selectionStart ?? 0)}
          onKeyUp={(event) => setCursor(event.currentTarget.selectionStart ?? 0)}
          onChange={(event) => onChange(event.target.value, event.target.selectionStart ?? event.target.value.length)}
        />
        {open && (
          <div className="absolute bottom-full z-20 mb-2 w-full overflow-hidden rounded-2xl border border-teal-900/10 bg-white shadow-[0_16px_40px_rgb(15_61_56_/_0.14)]">
            {matches.length === 0 ? (
              <div className="px-3 py-3 text-sm text-teal-900/50">No one matches that name</div>
            ) : (
              matches.map((member, index) => (
                <button
                  key={member.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-teal-950',
                    index === highlight ? 'bg-violet-50' : 'hover:bg-teal-50',
                  )}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    insertMention(member)
                  }}
                >
                  <Avatar name={member.name} size="sm" />
                  {member.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <Button disabled={pending || !value.trim()}>Comment</Button>
    </form>
  )
}
