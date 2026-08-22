# Backend overview

Spring Boot 3.4 API for **WeWorkTogether**. Java package: `com.orgaflow`. MongoDB. JWT access tokens + refresh tokens.

This document explains how the backend is put together. Endpoint-by-endpoint contracts are in [BACKEND_API_REFERENCE.md](./BACKEND_API_REFERENCE.md). Business rules are in [BACKEND_DOMAIN_AND_WORKFLOWS.md](./BACKEND_DOMAIN_AND_WORKFLOWS.md).

---

## 1. Runtime

| Item | Value |
|---|---|
| Base URL (prod) | `https://api.weworktogether.me` |
| Base URL (local) | `http://localhost:8080` |
| API prefix | `/api` |
| Health | `GET /actuator/health` |
| Port | 8080 |
| Multipart | max file 15 MB, max request 20 MB; app also enforces `MAX_FILE_BYTES` (default 10 MB) |
| JSON | Jackson camelCase, Java records |
| Dates | `Instant` → ISO-8601 (`2026-08-21T18:12:00Z`). `LocalDate` → `2026-08-21` |
| Enums | JSON strings, exact names: `IN_PROGRESS`, not `inProgress` |

The mobile app should treat the API as a remote HTTPS service. Native clients ignore CORS. Expo **web** (if you preview there) must be added to `CORS_ORIGINS` if it runs on a new origin.

---

## 2. Authentication model

Two tokens:

| Token | Lifetime | Where the website puts it | Where the RN app must put it |
|---|---|---|---|
| Access JWT | 15 minutes | Memory (`Authorization: Bearer`) | Secure storage + memory, same header |
| Refresh | 14 days | HttpOnly cookie `wwt_refresh` path `/api/auth`, SameSite=Lax | **JSON body** `{ "refreshToken": "..." }` — cookies are unreliable in mobile HTTP |

`POST /api/auth/login`, `/setup-password`, and `/refresh` all return:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "user": { "...MeResponse..." }
}
```

The website ignores `refreshToken` in JSON and uses the Set-Cookie. **The React Native app must persist `refreshToken` from the JSON body** (`expo-secure-store`). Never store tokens in AsyncStorage as plaintext.

### 2.1 Access JWT

Signed HS256. Claims:

| Claim | Meaning |
|---|---|
| `sub` | User id |
| `role` | `SUPER_ADMIN` \| `ADMIN` \| `MEMBER` |
| `organizationId` | Present for org users, absent for SuperAdmin |
| `iat` / `exp` | Issued / expiry |

Send on every authenticated request:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Multipart uploads: do **not** set Content-Type yourself; let the client set `multipart/form-data` with a boundary. Still send the Bearer header.

### 2.2 Refresh

`POST /api/auth/refresh`

Body (React Native):

```json
{ "refreshToken": "<token from last login/refresh>" }
```

Cookie is also accepted if present; body is the fallback (`AuthCookies.tokenFrom`).

On 401 from any other `/api/**` call: refresh once, retry the original request. If refresh fails, drop the session and go to login.

Do **not** refresh these paths (they are public or are the refresh itself):

- `/api/auth/login`
- `/api/auth/setup-password`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/refresh`
- `/api/auth/logout`

### 2.3 Logout

`POST /api/auth/logout` with the same refresh token in the body. Then delete local tokens. Response is `204`.

### 2.4 Session restore

On app launch:

1. Read stored refresh token.
2. `POST /api/auth/refresh`.
3. If ok, keep the new pair and `GET /api/auth/me` (or use `user` from the refresh response).
4. If fail, show login.

The website currently prefers cookie refresh and clears leftover localStorage keys. The RN app should only use the body token.

### 2.5 Password rules

- Setup / reset / change: **8–72** characters.
- Login with `PENDING_SETUP` → 401 `"Please set your password using the invite link first"`.
- Disabled user → 403 `"This account is disabled"`.
- Bad credentials → 401 `"Invalid email or password"`.

### 2.6 Rate limits

`POST /api/auth/login`, `/api/auth/forgot-password`, `/api/public/contact`: **20 requests per IP per 60 seconds**. Over limit: HTTP 429

```json
{ "code": "RATE_LIMITED", "message": "Too many attempts. Try again shortly." }
```

---

## 3. Multi-tenancy and privacy

Every org document, user (except SuperAdmin), project, task, comment, notification, and activity carries `organizationId`.

| Actor | Can see |
|---|---|
| SuperAdmin | Organizations as **customers**: name, plan, quotas, usage counts, admin identity. **Never** members, tasks, comments, activity, boards |
| Admin | Everything inside **their** organization |
| Project Manager | Projects they manage + tasks on those projects (all assignees). Reviews for those projects |
| Member | Projects they belong to. Tasks **assigned to them** (not other members’ tasks). Comments/activity on those visible tasks |

A disabled organization (`DISABLED`):

- GET still works (dashboard returns `organizationDisabled: true`).
- POST/PUT/PATCH/DELETE are blocked with 403 `ORGANIZATION_DISABLED`, except `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/refresh`.

Cross-tenant ids return **404** `"Resource not found"` / `"Project not found"` — not 403 — so existence is not leaked.

---

## 4. Roles

Stored role enum is only three values:

```
SUPER_ADMIN | ADMIN | MEMBER
```

**Project Manager is assignment, not a role.** `Me.managedProjectIds` lists project ids where `managerId == current user`. The website treats `managedProjectIds.length > 0` as PM.

| Capability | SuperAdmin | Admin | PM (member) | Member |
|---|---|---|---|---|
| Create orgs / plans / quotas | yes | | | |
| Invite members | | yes | | |
| Create projects | | yes | | |
| Change project members | | yes | yes (members endpoint is PM **or** admin) | |
| Create tasks | | yes | yes | no |
| Assign work | | any project member including PM | project members except themselves | no |
| Move own task TODO→IN_PROGRESS→REVIEW/BLOCKED | | if assignee | if assignee | if assignee |
| Approve / return REVIEW | | only if they are the PM | yes on their projects | no |
| Mark DONE | never via member flow | only as PM approve | yes (approve) | **never** |
| Review inbox | | read-only org-wide | actionable | 403 if not PM |
| My Day | no org | unused | yes | yes |
| Profile / password / email prefs | yes | yes | yes | yes |

Admins do **not** get extra transition rights in `TaskWorkflow`. If an Admin is not the project manager, they cannot approve. The review inbox shows work grouped by PM for Admins.

---

## 5. Error envelope

Almost every error is:

```json
{
  "timestamp": "2026-08-21T18:12:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": ["email: must not be blank"]
}
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bean validation (`@Email`, `@NotBlank`, `@Size`) |
| 400 | `BAD_REQUEST` | Malformed JSON, wrong current password, bad token |
| 401 | `UNAUTHORIZED` | Missing/invalid JWT, bad login, expired refresh |
| 403 | `FORBIDDEN` | Wrong role, SuperAdmin touching org internals |
| 403 | `ORGANIZATION_DISABLED` | Mutating while org is disabled |
| 404 | `NOT_FOUND` | Missing resource or hidden by tenancy |
| 409 | `CONFLICT` | Duplicate email, etc. |
| 409 | `QUOTA_EXCEEDED` | Member / project / storage cap |
| 422 | `INVALID_TRANSITION` | Illegal status move, short return note, short blocked reason |
| 429 | `RATE_LIMITED` | Auth/contact flood (body may omit timestamp) |
| 500 | `INTERNAL_ERROR` | Unexpected |

React Native: show `message` to the user. Log `code`. For 422 on a drag-and-drop, toast `That move is not allowed` if you want web parity.

Unauthenticated `/api/**` (except the public list below) → 401 via `JsonAuthEntryPoint`.

---

## 6. Public vs authenticated

No Bearer token:

| Method | Path |
|---|---|
| POST | `/api/auth/login` |
| POST | `/api/auth/refresh` |
| POST | `/api/auth/setup-password` |
| POST | `/api/auth/forgot-password` |
| POST | `/api/auth/reset-password` |
| POST | `/api/public/contact` |
| GET | `/actuator/health` |
| OPTIONS | `/**` |

Everything else under `/api/**` requires a valid access token.

---

## 7. Seeded data

On boot (`DataSeeder`):

**Plans**

| Code | Name | Members | Projects | Storage | Attachments | Reporting |
|---|---|---|---|---|---|---|
| `STARTER` | Starter | 25 | 5 | 10 GB | no | no |
| `PROFESSIONAL` | Professional | 100 | 20 | 100 GB | yes | yes |
| `BUSINESS` | Business | 500 | 100 | 1 TB | yes | yes |

All plans have kanban, comments, notifications **on**.

**SuperAdmin** comes from env `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`.

---

## 8. Feature entitlements

Per organization (copied from plan, overridable by SuperAdmin):

```json
{
  "kanban": true,
  "comments": true,
  "notifications": true,
  "fileAttachments": false,
  "advancedReporting": false
}
```

- `fileAttachments` must be true or uploads 409/403-style fail (check API message).
- `advancedReporting` gates `GET /api/projects/{id}/report`.
- Website still shows Kanban even if you would disable it; honor the flags the API returns rather than inventing UI for disabled features.

Quotas:

```json
{
  "maxMembers": 25,
  "maxProjects": 5,
  "maxStorageBytes": 10737418240
}
```

Hitting a cap → `QUOTA_EXCEEDED`.

---

## 9. Ids and lists

Ids are MongoDB ObjectId hex strings. Never invent ids.

List endpoints return JSON **arrays**, not `{ items: [] }`, except:

- `GET /api/notifications` → `{ unreadCount, items }`
- `GET /api/dashboard` → `{ role, organizationDisabled, metrics, items }`
- `GET /api/me/day` → object with `focus` / `waiting` arrays

Empty list = `[]`.

---

## 10. Recommended React Native HTTP client

1. Base url `https://api.weworktogether.me/api` (or localhost / `10.0.2.2` on the Android emulator).
2. Axios (or fetch) interceptor: attach Bearer; on 401 refresh once; queue concurrent 401s (the website uses a single in-flight `refreshing` promise — copy that).
3. `withCredentials` is a **browser** concept. Native RN does not send the website cookie; always pass `refreshToken` in the body.
4. Timeouts: 15s default, longer for uploads.
5. Parse errors with `message` + `code`.

Do not proxy through the React website. Talk to the API directly.
