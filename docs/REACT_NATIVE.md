# How React Native works (and how it differs from Flutter)

This is the companion-app runtime for WeWorkTogether. Pixel-level UI lives in [REACT_NATIVE_UI_SPEC.md](./REACT_NATIVE_UI_SPEC.md). API contracts live in the backend docs.

**Choice for WWT:** Expo + React Native + TypeScript, not Flutter. The website is already React. Types, auth interceptors, and screen structure can be reused instead of rewritten in Dart.

---

## 1. What React Native is

React Native (RN) lets you write **React components in JavaScript/TypeScript**. Those components do **not** run in a browser WebView (unless you put a WebView in on purpose).

On a phone:

1. Your JS bundle runs in **Hermes** (a JS engine, like a tiny V8).
2. When you render `<View>`, `<Text>`, `<Image>`, RN talks to **native UI** (UIKit on iOS, Android Views on Android).
3. The user sees real native views, not HTML.

So: **same React mental model as the Vite website**, **different primitives than the website**.

| Website (Vite) | React Native |
|---|---|
| `div` | `View` |
| `span` / `p` / `h1` | `Text` (all text must be inside `Text`) |
| `button` | `Pressable` (or `TouchableOpacity`) |
| `input` | `TextInput` |
| `img` | `Image` |
| CSS / Tailwind | `StyleSheet` or NativeWind |
| `react-router-dom` | Expo Router (file routes) |
| `axios` + cookies | `axios`/`fetch` + **expo-secure-store** |
| `lucide-react` | `lucide-react-native` |

You still write:

```tsx
export function Badge({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}
```

That is the same component idea as `frontend/src/components/ui/badge.tsx`. The JSX is familiar; the tags and styles are not HTML.

---

## 2. Expo vs “bare” React Native

**Expo** is the toolkit on top of RN that WWT should use.

| | Expo | Bare RN (React Native CLI) |
|---|---|---|
| Start | `npx create-expo-app` | Native Xcode + Android Studio from day one |
| Fonts, blur, secure store, file picker | Expo packages, one JS API | You wire each native module |
| Builds | EAS Build in the cloud | You maintain Gradle/Pods |
| When you need a custom native SDK | `expo prebuild` (“dev client”) | Already in native land |

Stay on Expo until something forces a custom native module. WWT (JWT, lists, kanban, uploads) does not need that at the start.

**Expo Go** is a sandbox app for quick previews. Some libraries need a **dev client** instead. For WWT, start in Expo Go; switch to a dev client if a library requires it.

---

## 3. How an Expo app is structured

Typical tree:

```
app/                  Expo Router screens (file = route)
  _layout.tsx         root: fonts, QueryClient, AuthProvider
  index.tsx           landing or redirect
  login.tsx
  (app)/              authenticated group
    _layout.tsx       drawer + header (WWT shell)
    index.tsx         home / My work
    projects/
      [id].tsx        board
    tasks/
      [id].tsx        task detail
src/
  components/         Button, Card, Badge… (same names as the website)
  theme/tokens.ts
  services/api.ts     copy of frontend axios interceptor, minus cookies
  types/index.ts      copy of frontend/src/types
  features/auth/
assets/
```

Expo Router maps files to URLs, similar to the website:

| File | Route |
|---|---|
| `app/(app)/index.tsx` | `/` inside the authed group |
| `app/(app)/projects/[id].tsx` | `/projects/abc` |
| `app/setup-password.tsx` | `/setup-password?token=` |

`router.push('/tasks/' + id)` is the RN equivalent of `<Link to={/app/tasks/${id}}>`.

---

## 4. The JavaScript thread (why lists and gestures matter)

RN has **two important threads**:

1. **JS thread** — React render, TanStack Query, JSON parse, your business logic.
2. **UI thread** — native layout, scrolling, some animations.

If JS is busy, the UI can hitch. Practical rules for WWT:

- Dashboard: `ScrollView` is fine (same as the website).
- Long member/task lists: `FlatList` (recycles rows).
- Kanban drag: `react-native-gesture-handler` + **Reanimated** so the drag runs on the UI thread. Do not implement drag with JS `onPanResponder` + `setState` every frame.
- Images/orbs: do not animate ten huge blurs at 60 fps on Android Go phones; freeze orbs if needed.

Flutter also has a UI thread (Impeller / Skia) and a Dart isolate. The difference is Flutter **draws its own pixels**; RN **asks the OS to draw views**. See §8.

---

## 5. Styling (the biggest day-one surprise)

There is **no CSS cascade** and **no `div > span` HTML**.

- `style` is a JS object (or array of objects).
- Flexbox is the layout system (default `flexDirection: 'column'`, the opposite of the web’s row default).
- You cannot put raw strings next to components: `<View>Hello</View>` is illegal. Wrap in `<Text>`.
- Fonts do **not** inherit to children the way `body { font-family }` does on the website. Set `fontFamily` on each `Text`, or wrap a small `AppText` component.
- `gap` exists on newer RN; if a version lacks it, use margin on children.
- Shadows differ on iOS vs Android (see the UI spec).
- `overflow: 'hidden'` is often required for `borderRadius` to clip children on Android.

**NativeWind** (optional) lets you write `className="rounded-[28px] bg-white/80"` like Tailwind. It is not required. A `tokens.ts` + `StyleSheet` is enough and closer to “we control every pixel.”

---

## 6. Talking to the WWT API

Same Spring Boot API as the website. Native apps **ignore CORS**.

Differences from `frontend/src/services/api.ts`:

| Website | React Native |
|---|---|
| `withCredentials: true` (cookie `wwt_refresh`) | Cookies are unreliable; **do not depend on them** |
| Access token in memory | Access token in memory; **refresh token in `expo-secure-store`** |
| `localStorage` | Never for secrets; SecureStore only |
| Relative `/api` via Vite proxy | Absolute `https://api.weworktogether.me/api` (or `http://localhost:8080/api` on emulator) |

Login / refresh still return JSON `refreshToken`. Persist that string. Send `{ "refreshToken": "..." }` on `POST /auth/refresh` and `/auth/logout`.

Copy the website’s **single in-flight refresh** so two 401s do not double-refresh.

Android emulator: `localhost` is the emulator, not your PC. Use `10.0.2.2:8080` for a local API, or always hit the hosted API.

iOS simulator: `localhost:8080` works for a Mac-hosted API. Physical devices need your LAN IP or the hosted API.

---

## 7. Suggested WWT package list

| Need | Package |
|---|---|
| App + routing | `expo`, `expo-router` |
| Fonts | `@expo-google-fonts/inter-tight`, `instrument-serif`, `ibm-plex-mono` |
| Icons | `lucide-react-native` |
| Data fetching | `@tanstack/react-query` (already on the website) |
| HTTP | `axios` or `fetch` |
| Secrets | `expo-secure-store` |
| Blur | `expo-blur` |
| Gradients (avatar, PM card) | `expo-linear-gradient` |
| Charts | `react-native-svg` |
| Gestures / drag | `react-native-gesture-handler`, `react-native-reanimated` |
| Files | `expo-document-picker`, `expo-file-system` |
| Toasts | `sonner-native` or `burnt` |
| Safe area | `react-native-safe-area-context` (included with Expo Router) |

Mirror website folders: `components/ui/button.tsx`, `features/auth/AuthContext.tsx`, `services/api.ts`.

---

## 8. React Native vs Flutter

Both compile to iOS and Android. They are different machines.

### 8.1 Language and reuse

| | React Native | Flutter |
|---|---|---|
| Language | TypeScript / JavaScript | Dart |
| UI model | React components | Widgets (`StatelessWidget` / `StatefulWidget`) |
| Share with WWT website | Types, utils, Query keys, mental model | Almost nothing |
| Package manager | npm / bun | pub.dev |

For WWT this is the deciding column. `TaskItem`, `allowedTransitions`, `isTaskOverdue`, `WHY_LABEL` already exist in TypeScript.

### 8.2 How pixels get on screen

**React Native** creates **platform views**. A `TextInput` is a real iOS `UITextField` / Android `EditText`. Scrolling uses the OS scroll view. That is why keyboards, autofill, and accessibility often feel “native” with less work — and why a `View` with `borderRadius` + shadow can look slightly different on the two OSes. You style around that (UI spec).

**Flutter** ships a **Skia/Impeller canvas**. It draws every button and letter itself. iOS and Android can look **identical** more easily. It does **not** use a `UITextField` unless you embed a platform view. That is why Flutter is praised for custom design systems — and why you rewrite the whole app in Dart.

WWT’s UI is a custom teal glass system either way. RN can match it; you must **not** use Paper/NativeBase defaults. Flutter can match it; you must **not** use Material 3 defaults. The cost is the rewrite.

### 8.3 Layout

| | React Native | Flutter |
|---|---|---|
| Default | Flexbox (`flex: 1`, `flexDirection`) | RenderBox / Flex, `Column`, `Row`, `Stack` |
| Constraints | Parent sizes child (web-like, with quirks) | Tight/loose constraints (“unbounded height” errors) |
| Text | Must be in `<Text>` | `Text` widget anywhere in the tree |

Flutter’s “unbounded constraints” (e.g. `ListView` inside `Column` without `Expanded`) is a class of bugs RN developers hit less often; RN has its own (`flex: 1` missing, Android overflow).

### 8.4 State

RN: React state (`useState`, context, TanStack Query) — **same as the website**.

Flutter: `setState`, `InheritedWidget`, or Riverpod/Bloc — a new state story.

### 8.5 Navigation

RN (this project): **Expo Router** file routes, close to `react-router-dom`.

Flutter: `Navigator` / `go_router` — another API.

### 8.6 Performance

Flutter often wins raw animation fps because it controls the rasterizer. RN is fast enough for WWT if:

- lists virtualize,
- drag uses Reanimated,
- you do not re-render the whole dashboard on every keystroke.

WWT is forms, cards, and a five-column board — not a 3D game. RN is enough.

### 8.7 Look-and-feel traps

| Trap | RN | Flutter |
|---|---|---|
| Accidental default theme | iOS blue headers, Material FAB | Material 3 purple/seed |
| Hover | Does not exist on phone | Does not exist on phone |
| Fonts | Must load + set per `Text` | `ThemeData.fontFamily` inherits more easily |
| Blur | `expo-blur`; weak on some Android GPUs | `BackdropFilter`; generally consistent |
| Shadows | iOS vs Android split | One `BoxShadow` everywhere |

The UI spec exists so neither stack ships a default look.

### 8.8 When Flutter would still be reasonable

- Greenfield app, no existing React code
- Team already writes Dart
- You need pixel-identical iOS/Android with lots of custom drawing and little API-model sharing

That is not WeWorkTogether today.

---

## 9. Mental map: website file → RN file

| Website | React Native |
|---|---|
| `frontend/src/App.tsx` routes | `app/` Expo Router |
| `layouts/AppLayout.tsx` | `app/(app)/_layout.tsx` custom drawer |
| `pages/LoginPage.tsx` | `app/login.tsx` |
| `pages/HomePage.tsx` | `app/(app)/index.tsx` |
| `pages/ProjectBoardPage.tsx` | `app/(app)/projects/[id].tsx` |
| `services/api.ts` | `src/services/api.ts` (SecureStore, body refresh) |
| `features/auth/AuthContext.tsx` | same file, almost |
| `types/index.ts` | same file |
| `index.css` tokens | `src/theme/tokens.ts` |
| `lucide-react` | `lucide-react-native` |
| `@dnd-kit` | gesture-handler + Reanimated, or a status action sheet on phone |

---

## 10. What not to confuse with React Native

- **React Native Web** — can render RN components in a browser. Do not try to replace the Vite app with it.
- **Capacitor / Cordova** — wraps the **existing website** in a WebView. That is not the companion app. Kanban, tokens, and motion will feel like a bookmark.
- **Expo for web** — useful for a quick preview, not the production `weworktogether.me` site.

The website stays Vite + React DOM. The companion app is Expo + React Native. They share **TypeScript types and API**, not the DOM.
