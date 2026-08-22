# WeWorkTogether companion-app docs

These documents describe the **live WeWorkTogether product** so a **React Native (Expo)** companion app can reuse the same backend and look like the website.

Product name in the UI: **WWT** (WeWorkTogether).  
Hosted API: `https://api.weworktogether.me`  
Hosted web: `https://weworktogether.me`

| Document | What it covers |
|---|---|
| [REACT_NATIVE.md](./REACT_NATIVE.md) | How React Native / Expo works, and how it differs from Flutter |
| [REACT_NATIVE_UI_SPEC.md](./REACT_NATIVE_UI_SPEC.md) | Theme, tokens, components, screens, motion — rebuild the same UI |
| [BACKEND_OVERVIEW.md](./BACKEND_OVERVIEW.md) | Architecture, auth, tenancy, roles, errors, conventions |
| [BACKEND_API_REFERENCE.md](./BACKEND_API_REFERENCE.md) | Every HTTP endpoint with request/response bodies and when to call it |
| [BACKEND_DOMAIN_AND_WORKFLOWS.md](./BACKEND_DOMAIN_AND_WORKFLOWS.md) | Task workflow, My Day ranking, dashboards, quotas, notifications |

Read [REACT_NATIVE.md](./REACT_NATIVE.md) if you are new to RN. Read the UI spec when building screens. Read the backend overview, then the API reference, when wiring HTTP.

The app must **not** invent a second API. Call the existing Spring Boot API. Store the access token in memory and the refresh token in **expo-secure-store**. Send `Authorization: Bearer <accessToken>`. On mobile, send `refreshToken` in the JSON body — do not rely on the HttpOnly cookie the website uses.
