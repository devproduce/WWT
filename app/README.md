# WWT companion app

Expo + TypeScript client for WeWorkTogether. It talks to the same Spring Boot API as the website. Routes live in `src/app/` so the project folder is `app/` without a nested `app/app/` routes directory.

## Run

```bash
cd app
npx expo start
```

Then open Expo Go, an iOS simulator, or an Android emulator.

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
