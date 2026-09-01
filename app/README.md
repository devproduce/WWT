# WWT companion app

Expo + TypeScript client for WeWorkTogether. It talks to the same Spring Boot API as the website. Routes live in `src/app/` so the project folder is `app/` without a nested `app/app/` routes directory.

## Run

```bash
cd app
npx expo start
```

Then open Expo Go, an iOS simulator, or an Android emulator.

### Install on Android phone (USB)

Requires [Android Studio](https://developer.android.com/studio) with **Android SDK Platform-Tools** installed (default: `%LOCALAPPDATA%\Android\Sdk`).

1. Enable **USB debugging** on the phone and connect over USB.
2. Point Gradle at the SDK — create `app/android/local.properties` (gitignored with `android/`):

   ```
   sdk.dir=C\:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk
   ```

   Or set `ANDROID_HOME` to that folder in Windows environment variables.

3. Build and install (keep the phone unlocked and connected — first build can take 10–15 minutes):

   ```bash
   cd app
   npx expo run:android --device
   ```

If the build succeeds but install fails because the device disconnected, reconnect USB and install the APK manually:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Then start Metro for live reload:

```bash
npx expo start
```

**Expo Go:** This project uses Expo SDK 57. If Play Store Expo Go is too old, use a dev build (`run:android`) instead of scanning the QR code.

## API URL

Public env var: `EXPO_PUBLIC_API_BASE_URL`. Do not put secrets in `.env`.

| Target | Value |
|---|---|
| Hosted (default) | `https://api.weworktogether.me` |
| Local API, iOS simulator | `http://localhost:8080` |
| Local API, Android emulator | `http://10.0.2.2:8080` |
| Local API, physical device | your machine’s LAN IP, e.g. `http://192.168.1.12:8080` |

Create `app/.env` (gitignored):

```
EXPO_PUBLIC_API_BASE_URL=https://api.weworktogether.me
```

The client always calls `{API}/api/...`. Refresh tokens are stored in expo-secure-store (`wwt_refresh`). Access tokens stay in memory.

## Scope

This pass is **member / project manager**: sign in, My work + My Day, projects, board (status action sheet), task detail, review inbox, profile.

Admin and SuperAdmin can sign in; the shell points them at the website for org/member/platform tools.

## Docs

- UI contract: `docs/REACT_NATIVE_UI_SPEC.md`
- API: `docs/BACKEND_API_REFERENCE.md`
- Workflows: `docs/BACKEND_DOMAIN_AND_WORKFLOWS.md`
