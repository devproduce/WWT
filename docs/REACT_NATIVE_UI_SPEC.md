# WWT React Native UI specification

Rebuild the **same visual language** as the React website in **Expo + React Native**. Colors, type, radii, shadows, component anatomy, and screen structure must match. Do not ship the default iOS/Android look (no system blue tabs, no Material purple).

How React Native itself works, and how it differs from Flutter, is in [REACT_NATIVE.md](./REACT_NATIVE.md).

This is the source of truth extracted from:

- `frontend/tailwind.config.js`
- `frontend/src/index.css`
- `frontend/src/layouts/AppLayout.tsx`
- `frontend/src/components/**`
- `frontend/src/pages/**`

Companion-app goal: a member/admin/PM/super-admin can open the app and recognize the same product as `https://weworktogether.me`.

**Stack:** Expo (current SDK) · TypeScript · Expo Router · TanStack Query · the same types as `frontend/src/types/index.ts`.

---

## 1. Product chrome

| Token | Value |
|---|---|
| Product name | **WWT** |
| Tagline | Work together, stay aligned |
| Wordmark tracking | `0.22em` (letter-spacing ~ 22% of font size) |
| Logo mark | White rounded square, **black** `WWT` letters, tracking `-0.08em`, teal glow |
| App loading copy | `Loading WeWorkTogether…` |
| Toast library on web | Sonner, top-right, rich colors — RN: `sonner-native` or `burnt` / a custom toast, top-right, same teal/rose |

### 1.1 Logo mark (`WwtMark`)

A square badge, **not** a circle.

| Size | Box | Letter size |
|---|---|---|
| sm | 28 × 28 | ~8 px |
| md (default) | 32 × 32 | ~9 px |
| lg | 44 × 44 | ~11 px |

- Background: `#FFFFFF`
- Text: `#000000`, bold
- Corner radius: `8` (rounded-lg)
- Shadow: `0 0 24 rgba(45, 212, 191, 0.18)`
- Place the mark next to the wordmark `WWT` with 10 px gap

On a dark sidebar the wordmark is **white**. On light canvas it is **ink/teal-950**.

---

## 2. Design tokens

Copy these into `src/theme/tokens.ts` (and optionally NativeWind theme). Do not approximate.

### 2.1 Brand colors

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `brand` | `#0F766E` | teal-700 / brand | Rings, progress, primary accent |
| `brandDark` | `#115E59` | brand-dark | Hover emphasis, nav underline |
| `ink` | `#12312E` | ink | Body text on canvas |
| `muted` | `#5B746F` | muted | Secondary body (web often uses teal-900/55 instead) |
| `line` | `#CFE0DB` | line | Hairline borders |
| `panel` | `#F4FAF7` | panel | Light surfaces |
| `canvas` | `#E7F1EE` | canvas | Page background |
| `sidebar` | `#0F3D38` | sidebar | Navigation shell |

### 2.2 Semantic teal scale used in the app

The UI is almost entirely **teal**, not generic Material green.

| Role | Approx hex | Notes |
|---|---|---|
| Title / teal-950 | `#042F2E` | Headings, card titles |
| Body / teal-900 | `#134E4A` | Often at 55–65% opacity |
| Label / teal-800 | `#115E59` | Buttons, icons, field labels |
| Soft fill / teal-50 | `#F0FDFA` | Metric cards, comment bubbles |
| Active nav pill | `#5EEAD4` (teal-300) | Text on it: `#042F2E` |
| Sidebar text idle | teal-100 at 75% | `#CCFBF1` × 0.75 |
| Sidebar hover | white at 8% | `rgba(255,255,255,0.08)` |
| Focus ring | teal-700 at 12% | `rgba(15, 118, 110, 0.12)` 4 px |
| Focus border | teal-500 at 40% | `rgba(13, 148, 136, 0.40)` |

### 2.3 Status / priority palette

Use these exact fills. They appear in badges, kanban columns, StatusStack, and rings.

| Meaning | Fill | Track / wash | Text |
|---|---|---|---|
| To do / slate | `#94A3B8` | stone-100 `#F5F5F4` | stone-700 |
| In progress / amber | `#D97706` | `#FDECC8` | amber-950 |
| Review / violet | `#7C3AED` | `#ECE4FF` | violet-950 |
| Blocked / overdue / urgent | `#E11D48` | `#FDE4EA` | rose-800 / rose-900 |
| Done / brand | `#0F766E` | `#D5EBE6` | teal-900 |
| Medium priority (badge) | teal-100 | — | teal-900 |
| Sky (projects, storage) | `#0284C7` | `#D7EEFB` | sky-950 |
| Stone (neutral metric) | `#57534E` | `#E7E5E4` | stone-800 |

**Badge tone map** (`statusTone`):

| Status / why | Tone |
|---|---|
| `DONE`, `ACTIVE`, `COMPLETED` | green / emerald |
| `REVIEW`, `PLANNED`, `PINNED`, `DUE_TODAY`, `DUE_SOON` | blue / sky |
| `BLOCKED`, `DISABLED`, `URGENT`, `OVERDUE`, `RETURNED` | red / rose |
| `IN_PROGRESS`, `HIGH`, `ON_HOLD` | amber |
| `TODO`, `PENDING_SETUP`, `LOW` | slate / stone |
| `MEDIUM` | teal |
| `SUPER_ADMIN` / default | slate |

### 2.4 Typography

Load these Google Fonts (same as `frontend/index.html`):

```
Inter Tight: 400–800, italic
Instrument Serif: 400, italic
IBM Plex Mono: 400, 500
```

| Role | Family | Size | Weight | Tracking | Color |
|---|---|---|---|---|---|
| Page title | Inter Tight | 30–36 | 600 | tight (−0.025em) | teal-950 |
| Card title | Inter Tight | 16 | 600 | tight | teal-950 |
| Body | Inter Tight | 14 | 400 | 0 | ink / teal-900 @ 55–80% |
| Subtitle / serif italic | Instrument Serif italic | 14–18 | 400 italic | 0 | teal-900 @ 55% |
| Eyebrow | IBM Plex Mono | 11 | 400–500 | 0.32em, ALL CAPS | teal-700 @ 70–80% |
| Field label | IBM Plex Mono | 11 | 400 | 0.18em, ALL CAPS | teal-800 @ 70% |
| Badge / chip | IBM Plex Mono | 10 | 500 | wider, ALL CAPS | tone text |
| Metric value | Inter Tight | 24 | 600 | tight | tone text |
| Nav item | Inter Tight | 14 | 400/500 | 0 | see sidebar |
| Greeting | Inter Tight | 18 | 600 | tight | teal-950 |

Never use Roboto or the system San Francisco/Roboto default as the primary typeface.

React Native `letterSpacing` is **pixels**, not `em`. Convert `em × fontSize`:

| Web tracking | At size | RN `letterSpacing` |
|---|---|---|
| `0.22em` (wordmark) | 15 | ~3.3 |
| `0.32em` (eyebrow) | 11 | ~3.5 |
| `0.18em` (field label) | 11 | ~2 |
| `0.16em` (chips) | 10 | ~1.6 |
| `-0.025em` (titles) | 32 | ~−0.8 |
| `-0.08em` (logo) | 9 | ~−0.7 |

### 2.5 Shape

Everything is **pill or super-ellipse**, not default `View` squares or iOS grouped-table chrome.

| Element | Radius |
|---|---|
| Cards, empty states, kanban columns, modals | **28** |
| Nested cards, comment bubbles, list rows | **16–24** (16 = rounded-2xl, 24 = rounded-[24px]) |
| Buttons, nav pills, badges, chips, header icon buttons | **999** (fully round / Stadium) |
| Inputs, selects, textareas | **12** (rounded-xl) |
| Logo mark | **8** |
| Metric icon well | **16** |
| App shell panes (sidebar + main) | **28** |
| Auth split panel | full screen, no extra radius on the dark half |

### 2.6 Elevation / glass

Cards are **frosted glass**, not flat white.

```
background: rgba(255, 255, 255, 0.78)
border: 1px solid rgba(15, 61, 56, 0.08)
shadow: 0 18 50 rgba(15, 61, 56, 0.06)
backdrop-blur: 16
```

On hover (interactive cards):

```
translateY(-6)
background: rgba(255, 255, 255, 0.92)
border: rgba(15, 118, 110, 0.22)
shadow: 0 28 70 rgba(15, 61, 56, 0.12)
```

Main content pane:

```
background: rgba(255, 255, 255, 0.45)
border: 1px solid rgba(255, 255, 255, 0.50)
shadow: 0 24 60 rgba(15, 61, 56, 0.08)
radius: 28
backdrop-blur: xl (~24)
```

Sidebar:

```
background: #0F3D38
text: teal-50
shadow: 0 24 60 rgba(15, 61, 56, 0.28)
radius: 28
```

Modal scrim:

```
background: rgba(4, 47, 46, 0.35)   /* teal-950/35 */
backdrop-blur: 4
```

Modal card extra shadow: `0 30 80 rgba(15, 61, 56, 0.28)`

### 2.7 Canvas background

Never a flat grey. Stack three blurred orbs on `canvas` `#E7F1EE`:

1. Teal orb: `rgba(45, 212, 191, 0.22)` ellipse at ~12% / −10%, ~288 px, blur-3xl
2. Amber orb: `rgba(251, 191, 36, 0.16)` at ~92% / 8%
3. Sky orb: `rgba(125, 211, 252, 0.18)` at ~80% / 100%

Animate orbs slowly (16s ease-in-out, 18 px drift). Honor `prefers-reduced-motion` / disable on low-power devices.

Outer app padding: **12 px**. Gap between sidebar and content when open: **12 px**.

### 2.8 Motion

Easing: `cubic-bezier(0.22, 1, 0.36, 1)` — Reanimated `Easing.bezier(0.22, 1, 0.36, 1)` as `tokens.easeApp`.

On phone there is no hover. Use `Pressable` `pressed` (slightly brighter / 2 px lift) instead of desktop hover. Skip the shine sweep or run it once on press.

| Interaction | Duration |
|---|---|
| Color / background | 350 ms |
| Transform / shadow | 450–500 ms |
| Sidebar width | 300 ms |
| Shine sweep | 800 ms |
| Hover lift (button) | translateY(−2) |
| Hover lift (card) | translateY(−6) |

Shine overlay on interactive cards: a 105° white gradient (45% opacity) that travels from −140% to +140% X on hover. On mobile, skip shine or trigger on press.

---

## 3. React Native theme mapping

Do **not** wrap the app in React Navigation’s default header or a React Native Paper / NativeBase theme. Build WWT components on `View` / `Text` / `Pressable`.

```ts
// src/theme/tokens.ts — conceptual
export const colors = {
  brand: '#0F766E',
  brandDark: '#115E59',
  ink: '#12312E',
  canvas: '#E7F1EE',
  sidebar: '#0F3D38',
  teal950: '#042F2E',
  error: '#E11D48',
}

export const radii = { card: 28, control: 12, pill: 999, mark: 8 }

export const fonts = {
  sans: 'InterTight_400Regular',
  sansSemibold: 'InterTight_600SemiBold',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  mono: 'IBMPlexMono_400Regular',
}
```

Load fonts with `@expo-google-fonts/inter-tight`, `@expo-google-fonts/instrument-serif`, `@expo-google-fonts/ibm-plex-mono`. Gate the tree on `useFonts` (same as waiting for `SplashScreen`).

Shadow on iOS uses `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius`. On Android use `elevation` **and** a matching `shadowColor` so cards do not go flat-grey. Example card:

```ts
{
  backgroundColor: 'rgba(255,255,255,0.78)',
  borderWidth: 1,
  borderColor: 'rgba(15,61,56,0.08)',
  borderRadius: 28,
  padding: 24,
  shadowColor: 'rgb(15,61,56)',
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.06,
  shadowRadius: 50,
  elevation: 8,
}
```

Blur: `expo-blur` `BlurView` (intensity ~40–60) behind the glass fill. On low-end Android, skip blur and keep the same rgba fill — never fall back to grey `Card` from a UI kit.

Web CSS classes (`app-card`, `rounded-full`) do not exist in RN unless you add **NativeWind**. Either NativeWind with the same token names, or a `StyleSheet` per component. Do not mix Tailwind web class strings into RN `className` without NativeWind.

---

## 4. Component catalog

Build these as shared RN components in `src/components`. Names match the web components (`Button`, `Card`, `Badge`, …) so a reader of the Vite app can find them.

### 4.1 Button

Height ~36–40. Full pill. 8 px horizontal gap for icons. Disabled opacity 0.5.

| Variant | Fill | Text | Extra |
|---|---|---|---|
| `primary` | teal-800 `#115E59` | white | shadow `0 12 28 rgba(15,118,110,0.22)`, hover teal-700, lift −2 |
| `secondary` | white/80 | teal-950 | 1 px border `teal-900/10`, hover white + teal-700/25 border |
| `ghost` | transparent | teal-800 | hover `teal-900/6` |
| `danger` | rose-600 `#E11D48` | white | hover rose-500 |

Full-width primary on auth forms.

### 4.2 Card / CardTitle

- Padding 24
- Radius 28
- Glass style from §2.6
- `interactive: true` adds lift + shine
- Title: 16 / semibold / tracking-tight / teal-950

### 4.3 Badge

Pill, padding `10 × 2` (px-2.5 py-0.5), IBM Plex Mono 10, uppercase, tracking wider.

Tones: teal, slate, amber, red, green, blue, purple — see §2.3.

Always display **raw enum** on task/project/org status (`TODO`, `IN_PROGRESS`) unless a human label is listed in this spec (kanban columns use human labels).

### 4.4 Input / Textarea / Select

Shared control class:

```
width: 100%
radius: 12
border: 1px solid rgba(18, 49, 46, 0.10)
background: rgba(255,255,255,0.80)
padding: 10 × 12
font: Inter Tight 14
outline: none
focus border: teal-500/40
focus ring: 4px rgba(15,118,110,0.12)
```

Textarea min-height 96. Select uses the same chrome (`app-select`).

Disabled email field on Profile: same control, disabled.

### 4.5 Field

Label above control:

- IBM Plex Mono 11
- tracking 0.18em
- uppercase
- teal-800 @ 70%
- 6 px gap below label

### 4.6 Modal

Centered, max-width 512, max-height 90vh, scroll inside. Radius 28, padding 24. Scrim from §2.6. Title 18 semibold teal-950. Action row: right-aligned, secondary then primary, 8 px gap.

On phone: still a dialog, not a full-screen route, unless keyboard would cover it — then a bottom sheet with the **same** 28 radius top corners, same padding, same fields.

### 4.7 PageHeader

Row: title block left, actions right, wrap on small screens, 16 px gap, align end.

1. Optional **eyebrow** — mono 11, tracking 0.32em, uppercase, teal-700/80
2. **Title** — 30–36 semibold teal-950
3. Optional **subtitle** — Instrument Serif italic 18, teal-900/55, max-width ~576

### 4.8 EmptyState

Dashed 1 px border `teal-900/12`, fill white/40, radius 28, padding 24/56, centered.

- Decorative circle 64×64, gradient teal-200 → emerald-100, inner shadow
- Title 18 semibold teal-950
- Description 14 teal-900/55, max-width 384

### 4.9 MetricCard

Glass card, radius 28, padding 20, row: icon well + copy + optional RingChart.

- Icon well: 44×44, radius 16, tone fill, white icon 20
- Label: mono 10, tracking 0.22em, uppercase, teal-800/60
- Value: 24 semibold
- Hint: 12 teal-900/50
- Interactive: lift + pointer
- Active filter: 2 px ring `teal-600/40`

Tones and their card wash:

| Tone | Card bg | Icon well |
|---|---|---|
| teal | teal-50/90 | teal-700 |
| coral | rose-50/90 | rose-500 |
| amber | amber-50/90 | amber-500 |
| violet | violet-50/90 | violet-600 |
| sky | sky-50/90 | sky-600 |
| stone | stone-50/90 | stone-600 |

### 4.10 QuotaMeter

- Label row: mono 10, tracking 0.16em, uppercase, teal-800/55
- Right: `used / max · pct%` (or bytes)
- Track height 8, radius full, fill `teal-900/8`
- Bar color: teal-600 if &lt;70%, amber-500 if ≥70%, rose-500 if ≥90%

Byte format: B / 1 decimal KB / MB / GB.

### 4.11 StatusStack

Horizontal stacked bar height 12, radius full, track `teal-900/8`.

Segments in this **order**:

| key | label | color |
|---|---|---|
| todo | To do | `#94A3B8` |
| inProgress | Doing | `#D97706` |
| review | Under review | `#7C3AED` |
| blocked | Blocked | `#E11D48` |
| done | Done | `#0F766E` |

Legend below: 8 px color dot + `Label **count**`, wrap, 16 px horizontal gap.

### 4.12 RingChart

`react-native-svg` `Circle`, rotated −90° (`transform={[{ rotate: '-90deg' }]}` on the Svg). `strokeLinecap="round"`. Center label is a sibling `Text`, not part of the SVG. Default size 88, stroke 9.

Default size 88, stroke 9. MetricCard uses 64 / 7. Dashboard tenant health uses 120 / 12.

### 4.13 StatusDonut

Multi-segment ring via `react-native-svg`, size 148, stroke 16, track `#E4EEEA`, butt caps. Center overlay is **not** part of the SVG — stack a column: assigned count (24 semibold) + `ASSIGNED` mono 10.

### 4.14 Avatar

Circle, `expo-linear-gradient` `from-teal-600 to-emerald-500` (`#0D9488` → `#10B981`), white initials (first two words), shadow `0 8 18 rgba(15,118,110,0.25)`.

| Size | Box | Type |
|---|---|---|
| sm | 32 | 10 |
| md | 40 | 12 |
| lg | 48 | 14 |

### 4.15 FilterChips

Horizontal wrap, 6 px gap. Each chip: pill, px-12 py-6, mono 10, tracking 0.16em, uppercase.

- Selected: teal-800 fill, white text
- Idle: white/70, teal-800, hover white

### 4.16 Notifications bell

Round 40×40 button, white/70, 1 px `teal-900/10`. Bell icon 20 teal-800.

Unread: 8×8 rose-500 dot at top-right, pulse (2s, expanding teal/rose ring).

Dropdown (on phone: a modal sheet): width 320, radius 24, padding 12. Header “Notifications” + “Mark all read” (12, teal-700). Max height 320, scroll.

Row: radius 16, padding 12×8.

- Unread mention (`COMMENT_MENTIONED`): violet-50 / violet-950, eyebrow `MENTIONED YOU` mono 10 tracking 0.18em violet-700
- Unread other: teal-50 / teal-950
- Read mention: violet-900/60
- Read other: teal-900/55

Tap: go to task if `taskId`, else project if `projectId`.

### 4.17 ReturnNoteModal

Title: **What should change?**  
Optional task title in teal-800.  
Helper: “The member needs a real note so they know what to fix — not a generic bounce.”  
Textarea 4 rows, placeholder “Describe what is missing or wrong”.  
Counter: `{len}/8 characters` mono 11 teal-800/50.  
Primary disabled until trim length ≥ 8. Button: **Return for revision**.

### 4.18 BlockedReasonModal

Title: **Why is this blocked?**  
Helper mentions PM is notified.  
Reason textarea, same 8-char rule.  
Optional select **Waiting on**, first option “Nobody specific”, exclude the assignee.  
Primary: **Mark blocked**.

### 4.19 CommentComposer

Textarea + primary **Comment**. Typing `@` opens a member picker (project members except self). Mentions render as violet-100 / violet-900 chips in `CommentBody`.

### 4.20 WWT loading / empty copy

Use the product’s voice: calm, specific, slightly literary subtitles. Do not write generic “No data found”.

---

## 5. App shell (must match)

Web: `AppLayout`. A phone cannot keep a persistent 256 px sidebar, but **chrome must still be the same object**: dark teal rounded pane + glass content pane + orbs. Use a custom drawer, not React Navigation’s default grey drawer.

### 5.1 Desktop / tablet (≥ 900 px)

Match web exactly:

- Full-height canvas with 12 px padding
- Left sidebar 256 px, radius 28, `#0F3D38`
- Collapses to width 0 on close; a 12 px hover strip re-opens
- Main pane: glass, radius 28, header + scroll body, content max-width 1280 centered, horizontal padding 24

Sidebar structure:

1. Padding 20×24: mark + `WWT` (14 semibold tracking 0.22em white) + tagline 11 teal-200/70
2. Nav pills, 4 px vertical gap, 12 px horizontal padding
3. Footer: Profile + Sign out

**Active pill:** fill teal-300, text teal-950, shadow `0 10 24 rgba(45,212,191,0.28)`.  
**Idle:** teal-100/75, hover white/8 + white text.  
Icon 16 px, gap 10, pill padding 14×10, font 14, fully round.

Header left: round icon button (Menu / PanelLeftClose) 40×40, then greeting `Good morning/afternoon/evening, {firstName}` and serif italic org name (or `Platform console` for SuperAdmin).

Header right: notification bell.

Tapping the main body closes the sidebar (web does this). Tablet (`useWindowDimensions().width >= 900`) can keep it open.

### 5.2 Phone

Keep the **same colors, radii, and pills**. Adapt structure:

1. **Top bar** on the glass pane: menu, greeting (one line), bell. Same 40 px round buttons.
2. **Drawer** = the exact sidebar (256 px, `#0F3D38`, same pills, same footer).
3. Optional **bottom nav** for the primary destinations of the current role, using the same active/idle colors as the sidebar pills (teal-300 on dark or teal-800 on light). Hide Expo Router / React Navigation default tabs; style them as WWT pills. Do not use iOS blue or Material indicators.

Outer padding 12. Body padding 24, but on very small screens 16.

### 5.3 Navigation by role

Project Manager is **not** a global role. A `MEMBER` with `managedProjectIds.length > 0` is a PM.

**SuperAdmin**

| Label | Route | Icon (`lucide-react-native`) |
|---|---|---|
| Dashboard | `/app` | LayoutDashboard |
| Organizations | `/app/organizations` | Building2 |
| Profile | `/app/profile` | UserRound |
| Sign out | logout | LogOut |

**Admin**

Dashboard, Reviews, Members, Projects, Profile, Sign out.

**Member**

My work (`/app`), Projects labeled **My projects**, Profile, Sign out.

**Member who is a PM**

My work, **Review inbox**, **Projects**, Profile, Sign out.

Guest routes: `/`, `/login`, `/forgot-password`, `/reset-password?token=`, `/setup-password?token=`. Authenticated users bounce from `/` and `/login` to `/app`.

---

## 6. Auth screens

Shared `AuthShell`:

- Canvas + orbs
- Two columns on large screens
- **Left:** `#0F3D38`, padding 40, logo, mono eyebrow `WEWORKTOGETHER` tracking 0.32em teal-200/80, headline 36 semibold with serif italic word **real** in teal-200, body teal-100/70, footer “Privacy-first multi-tenant SaaS”
- **Right:** centered glass card max-width 448, radius 28, padding 32. Back link `← Back to WWT`. Title 24. Serif italic subtitle.

On phone: hide the left panel; keep the card.

| Screen | Title | Subtitle | Fields | Submit |
|---|---|---|---|---|
| Login | Sign in | Manage organizations, projects, and work in one place. | Email, Password | Sign in / Signing in… |
| Forgot | Forgot password | If the account exists, we will send a reset link. | Email | Send reset link → success copy |
| Setup | Set your password | Use the invite link from your administrator. | New password min 8 | Activate account |
| Reset | Reset password | Choose a new password for WeWorkTogether. | New password min 8 | Update password |

Errors: 14 rose-600 under fields. Login link “Forgot password?” teal-800 underline.

Deep links: handle `https://weworktogether.me/setup-password?token=` (associated domain) **and** a custom scheme such as `wwt://setup-password?token=` if you ship native invites. Expo Router: `app/setup-password.tsx` reads `useLocalSearchParams().token`. The query param name is `token`.

Auth forms: wrap in `KeyboardAvoidingView` (iOS `padding`, Android `height`) so the primary button stays visible.

---

## 7. Screens — authenticated

Every screen starts with `PageHeader` unless noted. Vertical rhythm: `space-y-5` or `space-y-6` (20–24 px).

### 7.1 Home — SuperAdmin (“Fleet overview”)

Eyebrow `Platform`. Title `Fleet overview`. Subtitle `Aggregate customer usage only. Internal work is never shown here.` Action: **Manage customers**.

Layout:

1. Two-column: tenant-health card (RingChart + QuotaMeters Active/Disabled) + 2×2 MetricCards (Organizations, Active, Disabled, Active members). Cards are filters.
2. “Customer fleet” + FilterChips All / Active / Disabled.
3. Org cards grid 1/2/3 columns: name, plan, status badge, three QuotaMeters (Members, Projects, Storage bytes). Tap → org detail.

### 7.2 Home — Admin

Eyebrow `Organization`. Title = org name. Action **Open projects**.

1. Four MetricCards: Members `n / limit`, Projects `n / limit`, Overdue, Due this week. First two navigate. Last two filter the deadline strip.
2. Delivery mix StatusStack + Deadline strip (up to 6 rows: title, due day, overdue/upcoming badge).
3. Awaiting review card: rows of PM name + violet badge `{n} in review`. Button **Open reviews**.
4. Project portfolio + chips All / Active / On hold / Completed. Cards: name, `PM {name} · done/total`, status badge, RingChart + progress bar.
5. Recent activity: Avatar + message + timestamp. Link to task or project.

### 7.3 Home — Member (“My work”)

Eyebrow `Workspace`. Title `My work`.

1. Left: StatusDonut + StatusStack of **assigned** mix.
2. Right 2×2 MetricCards: Overdue, Due soon, Awaiting review, High priority — they filter My Day.
3. If `managedProjects > 0`: PM gradient card (teal-50 → white), StatusStack of managed pipeline, link `{n} waiting on your review`, button **Open Kanban**.
4. Due timeline: horizontal rail of min-width 176 cards (date mono, title 2 lines, status badge).
5. **My Day** panel (see §7.4).
6. Recent activity if present.

### 7.4 My Day panel

Card titled **My Day**. Subtitle: `A private plan for today. The board still shows the same work.` Search field max-width 320, placeholder `Search my work`.

Focus rows:

- 6×40 left color bar (amber if IN_PROGRESS, rose if overdue, amber if HIGH/URGENT, else teal)
- Title → task detail
- Meta: project · Due {date} · blocked waiting-on
- Badges: “Going on now” if IN_PROGRESS, plus why-label
- Actions: **Start** (`primaryAction == START`) or **Submit** (`SUBMIT_REVIEW`), pin, hide-until-tomorrow

Waiting section eyebrow `WAITING`: REVIEW and BLOCKED items, **Open** only.

Footer hints: `{overflowCount} more assigned`, `{hiddenCount} hidden until tomorrow`, `{n} pinned`.

Empty: title `Clear day`.

Why labels:

| Enum | Label |
|---|---|
| PINNED | Pinned |
| IN_PROGRESS | Going on now |
| OVERDUE | Overdue |
| RETURNED | Returned |
| DUE_TODAY | Due today |
| DUE_SOON | Due soon |
| HIGH_PRIORITY | High priority |
| REVIEW | Under review |
| BLOCKED | Blocked |

### 7.5 Organizations (SuperAdmin)

Header + **Create organization**. Invite link banner (teal-50) if the API returned `inviteToken`. Grid of org cards.

Create modal fields: org name, admin first/last, admin email, plan select, feature checkboxes (Kanban, Comments, Notifications, File Attachments, Advanced Reporting) in 2-col chips radius 16.

### 7.6 Organization detail (SuperAdmin)

Title = org name. Actions: **Disable** (danger) / **Enable**, **Reset Admin**.

Three MetricCards (Members, Projects, Storage %). Quota meters card. Feature toggles + **Save features**.

Never show tasks, comments, or member lists. Privacy boundary.

### 7.7 Members (Admin)

Header + **Add member**. Invite banner. Grid of people cards: Avatar, name, email, role + status badges. For non-admin: Edit, Resend invite / Cancel invite (pending), or Reset password / Disable / Enable.

Add/Edit modal: first name, last name, email.

### 7.8 Projects list

Header. Admin gets **Create project**.

Cards: 6 px left gradient edge by status (ACTIVE teal, PLANNED sky, ON_HOLD amber, COMPLETED emerald, ARCHIVED stone), name, `PM {name}`, description 2 lines, RingChart + `done/total complete`, optional `Target {date}`.

Create modal: name, description, PM select, member checkboxes (PM always on), target date.

### 7.9 Project board (Kanban)

Header: project name, subtitle `PM {name} · done/total`. Admin: **Manage members**. Admin or PM: **New task**.

If report allowed (Admin or PM): delivery RingChart + StatusStack, and “By member” QuotaMeters (`completed / assigned`).

Five columns, equal width on large screens, **horizontal pager / swipe** on phone (still five columns, not a list grouped by status — grouping is fine if each column keeps its color).

| Status | Label | Column wash | Dot |
|---|---|---|---|
| TODO | To do | stone-100/80, stone-200 border | stone-400 |
| IN_PROGRESS | In progress | amber-50/90 | amber-500 |
| REVIEW | Under review | violet-50/90 | violet-500 |
| BLOCKED | Blocked | rose-50/90 | rose-500 |
| DONE | Done | teal-50/90 | teal-600 |

Column radius 28, padding 12, min-height 288. Header: dot + label + count chip. Show 5 cards then **View all · N** opening a modal list.

**Task card:** glass, radius 16, padding 14, 4 px left priority bar (URGENT rose-500, HIGH amber-500, MEDIUM teal-500, LOW stone-300). Title, avatar + name, due chip (rose if overdue), priority badge, blocked waiting-on chip.

Drag-and-drop between columns. If target is not in `allowedTransitions`, toast `That move is not allowed`. Dropping on BLOCKED opens BlockedReasonModal. On phone, prefer a status action sheet using the same allowed transitions rather than fighting DnD — but the **card chrome must match**.

New task modal: title, description, assignee (Unassigned + project members; PM cannot assign themselves unless Admin), priority select LOW/MEDIUM/HIGH/URGENT, deadline date.

### 7.10 Task detail

Header: title, description as subtitle, **Back to board**.

Conditional banners:

- IN_PROGRESS + `lastReturnNote`: amber-50 card **Changes requested**
- BLOCKED + reason: rose-50 card **Blocked**, waiting-on line

Two columns (stack on phone):

**Left**

- Status card: badge, 5-segment progress (filled teal-600 up to current), labels under it, chips Assignee / Priority / Due.
- Transition buttons from `allowedTransitions`, **except**:
  - hide REVIEW when current is IN_PROGRESS (use **Submit for review** instead)
  - hide DONE and IN_PROGRESS when current is REVIEW (use **Approve** / **Return**)
- If REVIEW and `canReview`: primary Approve + secondary Return.
- If REVIEW and not `canReview`: amber text “Waiting for the Project Manager…”
- If IN_PROGRESS and user is assignee: **Submit for review**.
- BLOCKED uses **Move to blocked** → modal.
- Comments list (teal-50/60 bubbles, avatar, name, time, CommentBody) + composer.

**Right**

- Attachments: `expo-document-picker` / `expo-image-picker`; download with `fetch` + `expo-file-system` (not a browser blob URL).
- Activity timeline: avatar + message + time.

### 7.11 Review inbox

Admin (read-only grouping by PM) vs PM (actionable).

Title: `Waiting on you` if the user can act, else `Work in review`.

Three MetricCards: Waiting, Stale (&gt;24h), High priority.

**Next to review** hero: violet left bar, gradient violet-50 → white, large title, badges, wait chip, Approve + Return.

Wait chip colors: violet &lt;8h, amber ≥8h, rose ≥24h. Copy from `formatWait`: `Just in`, `Nm waiting`, `Nh waiting`, `1 day waiting`, `N days waiting`.

### 7.12 Profile

Header `Account` / `Profile`. Hero card: lg Avatar, name, email, role badge (`Platform owner` / `Organization admin` / `Project manager` / `Member`) + org badge.

Two columns: Your details (first, last, disabled email, **Save name**) and Password (current, new min 8, **Update password**).

Email me about: four PrefRows (Comments, Assignments, Reviews, Deadlines) with teal-800 accent checkboxes.

### 7.13 Organization disabled

Single card: **Organization disabled** + preserved-data copy. No mutating UI.

### 7.14 Landing (optional for companion)

Marketing page is **not** required in the mobile app. Login can be the first screen. If you include a splash, use the same canvas, orbs, WWT mark, and teal-950 type.

Public contact form exists on the website (`POST /api/public/contact`) if you add a “Contact us” screen.

---

## 8. Copy, dates, toasts

- Dates: `toLocaleDateString` / `toLocaleString` work in Hermes for simple cases; prefer `Intl` or a small formatter. Empty → em dash `—`.
- Greeting hour: &lt;12 Good morning, &lt;17 Good afternoon, else Good evening. Copy `greetingFor` from `frontend/src/lib/utils.ts`.
- Toasts: short, no exclamation spam. Errors use API `message`.
- Confirm: `Alert.alert` for cancel-invite with the member’s name (same copy as the website).

---

## 9. React Native implementation notes

1. **Fonts:** `@expo-google-fonts/inter-tight`, `instrument-serif`, `ibm-plex-mono`. Pass `fontFamily` on every `Text` that is not body sans — RN does not inherit font the way CSS does.
2. **Icons:** `lucide-react-native` (same names as the website: `LayoutDashboard`, `Bell`, `Inbox`, …). Size 16 in nav, 20 in header/metrics. `color` prop, not CSS `currentColor`.
3. **Blur / orbs:** `expo-blur` on panes; orbs as absolutely positioned `View`s with large `borderRadius` and low-opacity fills (RN has no CSS `blur-3xl` on a view background — use BlurView or a soft PNG). Skip blur on low-end Android; keep teal fills.
4. **Safe area:** `SafeAreaView` / `useSafeAreaInsets` **inside** the 12 px canvas, not instead of it. Add extra bottom inset for home indicator.
5. **Dark mode:** the product has **no** workspace dark theme. Force `Appearance` light. The sidebar is already dark.
6. **Density:** 14 px body, 20–24 padding. Do not compact to a default Settings-app list.
7. **Lists:** prefer `ScrollView` for dashboards (like the website). Use `FlatList` only for long member/task lists. Kanban on phone: horizontal `ScrollView` paging of five columns, or an action sheet for status instead of web `@dnd-kit`.
8. **Press vs hover:** `Pressable` with `style={({ pressed }) => ...}`. No `:hover`.
9. **Overflow:** RN `overflow: 'hidden'` is required for column radius to clip cards. Android needs it more often than iOS.
10. **Share code:** copy `frontend/src/types/index.ts` and `frontend/src/lib/utils.ts` into the Expo app (or a later `packages/shared`).
11. **Parity test:** screenshot the web dashboard, board, task, review inbox, and profile at 390×844 and overlay the RN screens. Radii, teal, and serif subtitles should match.

---

## 10. Screen → API map

Use `fetch` or `axios` against `{API}/api` with a 401→refresh interceptor (same as `frontend/src/services/api.ts`). Store refresh token in `expo-secure-store`, not `AsyncStorage`. Details: [BACKEND_OVERVIEW.md](./BACKEND_OVERVIEW.md).

Full contracts live in `BACKEND_API_REFERENCE.md`. Quick wiring:

| Screen | Reads | Writes |
|---|---|---|
| Session | `POST /auth/refresh`, `GET /auth/me` | `POST /auth/login`, `/logout` |
| Home | `GET /dashboard` | — |
| My Day | `GET /me/day` | `PUT /me/day/pins`, `/hidden`; task transitions |
| Notifications | `GET /notifications` (poll 30s) | `POST /notifications/read-all` |
| Orgs | `GET /organizations`, `/plans` | create, enable/disable, entitlements, reset-admin |
| Members | `GET /members` | invite, patch, disable/enable, resend, cancel, reset |
| Projects | `GET /projects` | `POST /projects` |
| Board | `GET /projects/{id}`, `/tasks`, `/report` | transitions, create task, patch members |
| Task | task, comments, activity, attachments, project | transition, submit-review, approve, return, comments, upload |
| Review | `GET /reviews` | approve, return |
| Profile | `GET /me/notification-preferences` | `PATCH /me`, `POST /me/password`, `PATCH /me/notification-preferences` |
