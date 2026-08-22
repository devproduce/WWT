import { Canvas } from '@/components/Canvas'
import { AppText } from '@/components/ui/AppText'
import { WwtMark } from '@/components/WwtMark'
import { useAuth } from '@/features/auth/AuthContext'
import { formatDate, greetingFor } from '@/lib/utils'
import { api } from '@/services/api'
import { colors, fonts, radii } from '@/theme/tokens'
import type { NotificationItem } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, usePathname, type Href } from 'expo-router'
import {
  Bell,
  ClipboardList,
  FolderKanban,
  Inbox,
  LogOut,
  Menu,
  PanelLeftClose,
  UserRound,
} from 'lucide-react-native'
import { type ReactNode, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Link = { href: Href; label: string; match: string; Icon: typeof ClipboardList }

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const [drawer, setDrawer] = useState(false)
  const [bell, setBell] = useState(false)
  const queryClient = useQueryClient()
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<{ unreadCount: number; items: NotificationItem[] }>('/notifications')).data,
    refetchInterval: 30000,
  })
  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (!user) return null
  const isPm = user.managedProjectIds.length > 0
  const isMember = user.role === 'MEMBER'
  const links: Link[] = isMember
    ? [
        { href: '/', label: 'My work', match: '/', Icon: ClipboardList },
        ...(isPm
          ? [{ href: '/review' as Href, label: 'Review inbox', match: '/review', Icon: Inbox }]
          : []),
        { href: '/projects', label: isPm ? 'Projects' : 'My projects', match: '/projects', Icon: FolderKanban },
      ]
    : []

  const go = (href: Href) => {
    setDrawer(false)
    setBell(false)
    router.push(href)
  }

  const isActive = (match: string) => {
    if (match === '/') return pathname === '/' || pathname === ''
    return pathname.startsWith(match)
  }

  return (
    <Canvas>
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 8, 0) }]}>
        <View style={styles.pane}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.iconBtn} onPress={() => setDrawer((v) => !v)}>
                {drawer ? <PanelLeftClose size={20} color={colors.teal800} /> : <Menu size={20} color={colors.teal800} />}
              </Pressable>
              <View style={{ flex: 1 }}>
                <AppText variant="cardTitle" numberOfLines={1} style={{ fontSize: 18 }}>
                  {greetingFor(user.firstName)}
                </AppText>
                <AppText variant="subtitle" numberOfLines={1} style={{ fontSize: 14 }}>
                  {user.organizationName ?? 'Platform console'}
                </AppText>
              </View>
            </View>
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                setBell((v) => !v)
                setDrawer(false)
              }}
            >
              <Bell size={20} color={colors.teal800} />
              {(notifications.data?.unreadCount ?? 0) > 0 ? <View style={styles.dot} /> : null}
            </Pressable>
          </View>
          {bell ? (
            <View style={styles.bell}>
              <View style={styles.bellHead}>
                <AppText variant="cardTitle">Notifications</AppText>
                <Pressable onPress={() => markAll.mutate()}>
                  <AppText style={styles.markRead}>Mark all read</AppText>
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 280 }}>
                {(notifications.data?.items ?? []).length === 0 ? (
                  <AppText variant="caption" style={{ textAlign: 'center', paddingVertical: 24 }}>
                    No notifications yet
                  </AppText>
                ) : (
                  (notifications.data?.items ?? []).map((item) => {
                    const mentioned = item.type === 'COMMENT_MENTIONED'
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.note,
                          !item.read && (mentioned ? styles.noteMention : styles.noteUnread),
                        ]}
                        onPress={() => {
                          setBell(false)
                          if (item.taskId) router.push(`/tasks/${item.taskId}`)
                          else if (item.projectId) router.push(`/projects/${item.projectId}`)
                        }}
                      >
                        {mentioned ? (
                          <AppText variant="label" style={{ color: '#6D28D9', marginBottom: 2 }}>
                            Mentioned you
                          </AppText>
                        ) : null}
                        <AppText variant="cardTitle" style={{ fontSize: 14 }}>
                          {item.title}
                        </AppText>
                        <AppText variant="caption">{item.message}</AppText>
                        <AppText variant="caption" style={{ marginTop: 4, fontSize: 11 }}>
                          {formatDate(item.createdAt)}
                        </AppText>
                      </Pressable>
                    )
                  })
                )}
              </ScrollView>
            </View>
          ) : null}
          <View style={styles.body}>{children}</View>
        </View>
        {drawer ? (
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.drawer}>
              <View style={styles.brand}>
                <WwtMark />
                <View>
                  <AppText style={styles.wordmark}>WWT</AppText>
                  <AppText style={styles.tagline}>Work together, stay aligned</AppText>
                </View>
              </View>
              <View style={styles.nav}>
                {links.map((link) => {
                  const active = isActive(link.match)
                  const iconColor = active ? colors.teal950 : 'rgba(204,251,241,0.75)'
                  return (
                    <Pressable
                      key={link.label}
                      onPress={() => go(link.href)}
                      style={[styles.pill, active && styles.pillActive]}
                    >
                      <link.Icon size={16} color={iconColor} />
                      <AppText style={[styles.pillText, active && styles.pillTextActive]}>{link.label}</AppText>
                    </Pressable>
                  )
                })}
              </View>
              <View style={styles.footer}>
                <Pressable
                  onPress={() => go('/profile')}
                  style={[styles.pill, isActive('/profile') && styles.pillActive]}
                >
                  <UserRound size={16} color={isActive('/profile') ? colors.teal950 : 'rgba(204,251,241,0.75)'} />
                  <AppText style={[styles.pillText, isActive('/profile') && styles.pillTextActive]}>Profile</AppText>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await logout()
                    router.replace('/login')
                  }}
                  style={styles.pill}
                >
                  <LogOut size={16} color="rgba(204,251,241,0.75)" />
                  <AppText style={styles.pillText}>Sign out</AppText>
                </Pressable>
              </View>
            </View>
            <Pressable style={styles.scrim} onPress={() => setDrawer(false)} />
          </View>
        ) : null}
      </View>
    </Canvas>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  drawer: {
    width: 256,
    backgroundColor: colors.sidebar,
    borderRadius: radii.card,
    paddingBottom: 16,
  },
  scrim: { flex: 1, backgroundColor: 'rgba(4, 47, 46, 0.18)' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 24 },
  wordmark: { fontFamily: fonts.sansSemibold, color: colors.white, letterSpacing: 3.5, fontSize: 14 },
  tagline: { color: 'rgba(153,246,228,0.7)', fontSize: 11 },
  nav: { flex: 1, paddingHorizontal: 12, gap: 4 },
  footer: { paddingHorizontal: 12, gap: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillActive: { backgroundColor: colors.teal300 },
  pillText: { color: 'rgba(204,251,241,0.75)', fontSize: 14, fontFamily: fonts.sans },
  pillTextActive: { color: colors.teal950, fontFamily: fonts.sansSemibold },
  pane: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(18,49,46,0.1)',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  bell: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,61,56,0.08)',
    zIndex: 2,
  },
  bellHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 8 },
  markRead: { color: colors.teal700, fontSize: 12 },
  note: { borderRadius: 16, padding: 12 },
  noteUnread: { backgroundColor: colors.teal50 },
  noteMention: { backgroundColor: colors.violet50 },
  body: { flex: 1 },
})
