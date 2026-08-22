# Backend API reference

Base: `{API}/api`  
Auth: `Authorization: Bearer <accessToken>` unless marked **public**.  
Shared shapes are defined once in §0 and reused.

React Native: persist `refreshToken` from login/refresh/setup-password JSON. Send it in the body on refresh/logout. See [BACKEND_OVERVIEW.md](./BACKEND_OVERVIEW.md).

---

## 0. Shared types

### Me

```json
{
  "id": "665f…",
  "email": "ada@acme.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "role": "MEMBER",
  "status": "ACTIVE",
  "organizationId": "665e…",
  "organizationName": "Acme",
  "organizationStatus": "ACTIVE",
  "managedProjectIds": ["6660…"]
}
```

`organizationId` / `organizationName` / `organizationStatus` are `null` for SuperAdmin.  
`managedProjectIds` is empty unless this user is Project Manager on one or more projects.

`role`: `SUPER_ADMIN` | `ADMIN` | `MEMBER`  
`status`: `ACTIVE` | `DISABLED` | `PENDING_SETUP`  
`organizationStatus`: `ACTIVE` | `DISABLED` | `null`

### AuthResponse

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "user": { "...Me..." }
}
```

Also sets cookie `wwt_refresh` (ignore in React Native).

### ResourceQuotas

```json
{ "maxMembers": 100, "maxProjects": 20, "maxStorageBytes": 107374182400 }
```

### FeatureEntitlements

```json
{
  "kanban": true,
  "comments": true,
  "notifications": true,
  "fileAttachments": true,
  "advancedReporting": true
}
```

### Plan

```json
{
  "id": "…",
  "code": "PROFESSIONAL",
  "name": "Professional",
  "description": "Notifications, attachments, and reporting",
  "quotas": { "...ResourceQuotas..." },
  "entitlements": { "...FeatureEntitlements..." }
}
```

### OrganizationSummary

```json
{
  "id": "…",
  "name": "Acme",
  "status": "ACTIVE",
  "planId": "…",
  "planName": "Professional",
  "quotas": { "...ResourceQuotas..." },
  "entitlements": { "...FeatureEntitlements..." },
  "adminEmail": "admin@acme.com",
  "adminName": "Jane Admin",
  "memberCount": 12,
  "projectCount": 3,
  "storageUsedBytes": 4096,
  "createdAt": "2026-01-10T09:00:00Z",
  "inviteToken": null
}
```

`inviteToken` is only present right after create / reset-admin (dev convenience). Production emails a link instead.

### Member

```json
{
  "id": "…",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@acme.com",
  "role": "MEMBER",
  "status": "PENDING_SETUP",
  "createdAt": "2026-08-01T12:00:00Z",
  "inviteToken": "raw-token-or-null"
}
```

### Project

```json
{
  "id": "…",
  "organizationId": "…",
  "name": "Website relaunch",
  "description": "…",
  "managerId": "…",
  "managerName": "Pat Manager",
  "memberIds": ["…", "…"],
  "members": [{ "id": "…", "name": "Ada Lovelace" }],
  "status": "ACTIVE",
  "startDate": "2026-08-01",
  "targetDate": "2026-09-30",
  "createdBy": "…",
  "createdAt": "2026-08-01T12:00:00Z",
  "totalTasks": 20,
  "doneTasks": 5
}
```

`status`: `PLANNED` | `ACTIVE` | `ON_HOLD` | `COMPLETED` | `ARCHIVED`

### Task

```json
{
  "id": "…",
  "organizationId": "…",
  "projectId": "…",
  "title": "Draft homepage",
  "description": "…",
  "assigneeId": "…",
  "assigneeName": "Ada Lovelace",
  "createdBy": "…",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "deadline": "2026-08-25",
  "createdAt": "2026-08-10T08:00:00Z",
  "updatedAt": "2026-08-21T10:00:00Z",
  "completedAt": null,
  "lastReturnNote": "Add the pricing table",
  "lastReturnedAt": "2026-08-20T16:00:00Z",
  "blockedReason": null,
  "blockedWaitingOnUserId": null,
  "blockedWaitingOnName": null,
  "blockedAt": null,
  "allowedTransitions": ["REVIEW", "BLOCKED"],
  "canReview": false
}
```

`priority`: `LOW` | `MEDIUM` | `HIGH` | `URGENT`  
`status`: `TODO` | `IN_PROGRESS` | `REVIEW` | `BLOCKED` | `DONE`

`allowedTransitions` is **already filtered for the current user**. The RN app must only offer those targets.  
`canReview` is true only for the Project Manager of that project when status is `REVIEW`.

Nullables: `assigneeId`, `assigneeName`, `deadline`, `completedAt`, `lastReturnNote`, `lastReturnedAt`, blocked fields.

### Comment

```json
{
  "id": "…",
  "taskId": "…",
  "authorId": "…",
  "authorName": "Ada Lovelace",
  "content": "Looks good @Pat Manager",
  "mentionedUserIds": ["…"],
  "deleted": false,
  "createdAt": "2026-08-21T11:00:00Z",
  "updatedAt": "2026-08-21T11:00:00Z"
}
```

### Activity

```json
{
  "id": "…",
  "organizationId": "…",
  "projectId": "…",
  "taskId": "…",
  "actorId": "…",
  "actorName": "Ada Lovelace",
  "type": "TASK_STATUS_CHANGED",
  "message": "Ada Lovelace moved the task to IN_PROGRESS",
  "createdAt": "2026-08-21T11:00:00Z"
}
```

`type` values: `TASK_CREATED`, `TASK_ASSIGNED`, `TASK_PRIORITY_CHANGED`, `TASK_DEADLINE_CHANGED`, `TASK_STATUS_CHANGED`, `COMMENT_ADDED`, `TASK_SUBMITTED_FOR_REVIEW`, `TASK_APPROVED`, `TASK_RETURNED`, `TASK_BLOCKED`, `PROJECT_MANAGER_CHANGED`, `PROJECT_MEMBER_ADDED`, `PROJECT_MEMBER_REMOVED`, `PROJECT_CREATED`, `ATTACHMENT_ADDED`.

### Notification

```json
{
  "id": "…",
  "organizationId": "…",
  "recipientId": "…",
  "type": "TASK_ASSIGNED",
  "title": "Task assigned",
  "message": "You were assigned \"Draft homepage\"",
  "taskId": "…",
  "projectId": "…",
  "read": false,
  "createdAt": "2026-08-21T11:00:00Z"
}
```

`type`: `TASK_ASSIGNED`, `DEADLINE_APPROACHING`, `TASK_OVERDUE`, `COMMENT_ADDED`, `COMMENT_MENTIONED`, `TASK_RETURNED`, `TASK_APPROVED`, `TASK_READY_FOR_REVIEW`, `TASK_BLOCKED`, `PROJECT_ASSIGNMENT`, `ACCOUNT_EVENT`.

### ReviewQueueItem

```json
{
  "task": { "...Task..." },
  "projectName": "Website relaunch",
  "managerId": "…",
  "managerName": "Pat Manager",
  "waitingSince": "2026-08-20T09:00:00Z"
}
```

Sorted oldest `waitingSince` first.

### MyDayItem

```json
{
  "task": { "...Task..." },
  "projectName": "Website relaunch",
  "why": "OVERDUE",
  "score": 85,
  "pinned": false,
  "overdue": true,
  "primaryAction": "START"
}
```

`why`: `PINNED` | `IN_PROGRESS` | `OVERDUE` | `RETURNED` | `DUE_TODAY` | `DUE_SOON` | `HIGH_PRIORITY` | `REVIEW` | `BLOCKED`  
`primaryAction`: `START` | `SUBMIT_REVIEW` | `OPEN`

### Attachment

```json
{
  "id": "…",
  "taskId": "…",
  "originalName": "spec.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 20480,
  "uploadedBy": "…",
  "createdAt": "2026-08-21T11:00:00Z"
}
```

### ProjectReport

```json
{
  "projectId": "…",
  "projectName": "Website relaunch",
  "totalTasks": 20,
  "todo": 4,
  "inProgress": 6,
  "review": 2,
  "blocked": 1,
  "done": 7,
  "completionPercent": 35.0,
  "overdue": 2,
  "tasksByPriority": { "LOW": 2, "MEDIUM": 10, "HIGH": 6, "URGENT": 2 },
  "tasksByMember": [{ "name": "Ada Lovelace", "completed": 3, "assigned": 8 }]
}
```

`completed` counts tasks in `REVIEW` or `DONE`.

### Error

```json
{
  "timestamp": "2026-08-21T18:12:00Z",
  "status": 422,
  "code": "INVALID_TRANSITION",
  "message": "A return note of at least 8 characters is required",
  "details": []
}
```

---

## 1. Auth — `/api/auth`

### POST `/api/auth/login` — public

**Use:** Sign in.

Request:

```json
{ "email": "ada@acme.com", "password": "secret-8+" }
```

Response `200` AuthResponse.

| Failure | HTTP | message |
|---|---|---|
| Unknown email / wrong password | 401 | Invalid email or password |
| `PENDING_SETUP` | 401 | Please set your password using the invite link first |
| `DISABLED` | 403 | This account is disabled |
| Rate limit | 429 | Too many attempts. Try again shortly. |

### POST `/api/auth/refresh` — public

**Use:** New access token (app launch + 401 retry).

Request (React Native):

```json
{ "refreshToken": "<stored>" }
```

Empty body is allowed if the cookie exists (website only).

Response `200` AuthResponse (new pair).  
`401` Invalid / expired refresh token.

### POST `/api/auth/logout`

**Use:** Sign out. Auth optional but send Bearer + body token.

Request:

```json
{ "refreshToken": "<stored>" }
```

Response `204`. Clears cookie.

### POST `/api/auth/setup-password` — public

**Use:** Invite / admin-reset activation (`?token=`).

```json
{ "token": "<invite>", "password": "at-least-8" }
```

Response `200` AuthResponse (user is now logged in).  
`400` Invalid or expired token.

### POST `/api/auth/forgot-password` — public

```json
{ "email": "ada@acme.com" }
```

Response `202` empty. Always accepted (no email-enumeration). Rate limited.

### POST `/api/auth/reset-password` — public

```json
{ "token": "<reset>", "password": "at-least-8" }
```

Response `204`. Then send the user to login (website does not auto-login).

### GET `/api/auth/me`

**Use:** Hydrate session, refresh name/role/`managedProjectIds`.

Response `200` Me.

---

## 2. Profile — `/api/me`

### PATCH `/api/me`

**Use:** Change display name. Email cannot be changed here.

```json
{ "firstName": "Ada", "lastName": "Lovelace" }
```

Constraints: not blank, max 80. Response `200` Me.

### POST `/api/me/password`

```json
{ "currentPassword": "old-pass", "newPassword": "new-pass-8+" }
```

Response `204`.  
`400` Current password is incorrect / Choose a different new password.

### GET `/api/me/notification-preferences`

```json
{
  "emailComments": false,
  "emailAssignments": true,
  "emailReviews": true,
  "emailDeadlines": true
}
```

Defaults: comments **off**, the other three **on** if unset.

### PATCH `/api/me/notification-preferences`

Any subset:

```json
{ "emailComments": true }
```

Response `200` full NotificationPrefs.

---

## 3. Dashboard

### GET `/api/dashboard`

**Use:** Home screen. Shape **depends on role**. Always:

```json
{
  "role": "ADMIN",
  "organizationDisabled": false,
  "metrics": { },
  "items": [ ]
}
```

`role` is `SUPER_ADMIN` | `ADMIN` | `MEMBER` (PMs still have `role: MEMBER`).

#### SuperAdmin `metrics`

| Key | Type |
|---|---|
| `totalOrganizations` | number |
| `activeOrganizations` | number |
| `disabledOrganizations` | number |
| `aggregateMembers` | number (active users platform-wide) |
| `aggregateProjects` | number (PLANNED+ACTIVE+ON_HOLD) |

`items[]` — one row per org:

```json
{
  "id": "…",
  "name": "Acme",
  "status": "ACTIVE",
  "planName": "Professional",
  "memberCount": 12,
  "memberLimit": 100,
  "projectCount": 3,
  "projectLimit": 20,
  "storageUsedBytes": 4096,
  "storageLimitBytes": 107374182400
}
```

#### Disabled org (Admin/Member)

`organizationDisabled: true`

```json
{ "metrics": { "organizationName": "Acme", "status": "DISABLED" }, "items": [] }
```

#### Admin `metrics`

| Key | Type | Notes |
|---|---|---|
| `organizationName` | string | |
| `memberCount` / `memberLimit` | number | ACTIVE + PENDING_SETUP |
| `projectCount` / `projectLimit` | number | PLANNED+ACTIVE+ON_HOLD |
| `activeProjects` / `completedProjects` | number | |
| `overdueTasks` | number | clock running, deadline &lt; today |
| `upcomingDeadlines` | number | due within 7 days |
| `todo` `inProgress` `review` `blocked` `done` | number | org-wide mix |
| `recentActivity` | array | last 15, Activity-like maps |
| `deadlineTasks` | array | `{ id, title, status, deadline, projectId, kind: "overdue"\|"upcoming" }` |
| `reviewsByManager` | array | `{ managerId, managerName, reviewCount }` sorted desc |

`items[]` — projects:

```json
{
  "type": "project",
  "id": "…",
  "name": "Website relaunch",
  "status": "ACTIVE",
  "managerId": "…",
  "managerName": "Pat Manager",
  "totalTasks": 20,
  "doneTasks": 5,
  "todo": 4,
  "inProgress": 6,
  "review": 2,
  "blocked": 1
}
```

#### Member `metrics`

| Key | Type |
|---|---|
| `organizationName` | string |
| `assignedTasks` | number |
| `todo` `inProgress` `review` `blocked` `done` | number (mine) |
| `overdue` | number |
| `dueSoon` | number (≤ 3 days, clock running) |
| `highPriority` | number (HIGH or URGENT) |
| `awaitingReview` | number (status REVIEW) |
| `managedProjects` | number |
| `pmTotal` `pmTodo` `pmInProgress` `pmReview` `pmBlocked` `pmDone` | number, **only if PM** |
| `pmProjectId` | first managed project id |
| `pmProjectName` | that name, or `"N projects"` |
| `recentActivity` | array, visible projects only |

`items[]` — assigned tasks:

```json
{
  "id": "…",
  "title": "Draft homepage",
  "status": "TODO",
  "priority": "HIGH",
  "deadline": "2026-08-25",
  "projectId": "…"
}
```

---

## 4. My Day — `/api/me/day`

**Who:** any org user (not SuperAdmin).

### GET `/api/me/day?date=2026-08-21`

`date` optional ISO date, defaults to today (server local date).

```json
{
  "date": "2026-08-21",
  "focus": [ { "...MyDayItem..." } ],
  "waiting": [ { "...MyDayItem..." } ],
  "hiddenCount": 1,
  "overflowCount": 3,
  "pinnedTaskIds": ["…"],
  "hiddenTaskIds": ["…"]
}
```

Ranking rules: [BACKEND_DOMAIN_AND_WORKFLOWS.md](./BACKEND_DOMAIN_AND_WORKFLOWS.md).

**Use:** Member home focus list. `START` → transition IN_PROGRESS. `SUBMIT_REVIEW` → submit-review.

### PUT `/api/me/day/pins`

```json
{ "date": "2026-08-21", "taskIds": ["id1", "id2"] }
```

Replaces the pinned set for that date. Response: full MyDay object.

### PUT `/api/me/day/hidden`

Same body. Hidden tasks stay hidden **until that calendar date rolls** (prefs are per user; UI copy says “until tomorrow”). Response: full MyDay object.

---

## 5. Organizations — SuperAdmin only

All of these 403 for anyone else.

### GET `/api/plans`

`200` Plan[]. Used when creating an org.

### POST `/api/organizations`

```json
{
  "name": "Acme",
  "adminFirstName": "Jane",
  "adminLastName": "Admin",
  "adminEmail": "jane@acme.com",
  "planId": "…",
  "maxMembers": null,
  "maxProjects": null,
  "maxStorageBytes": null,
  "entitlements": { "...optional FeatureEntitlements..." }
}
```

Quota ints optional (plan defaults). Response `200` OrganizationSummary (may include `inviteToken`).

### GET `/api/organizations`

`200` OrganizationSummary[].

### GET `/api/organizations/{id}`

`200` OrganizationSummary.

### PATCH `/api/organizations/{id}/disable`

### PATCH `/api/organizations/{id}/enable`

No body. `200` OrganizationSummary.

### PATCH `/api/organizations/{id}/quotas`

```json
{ "maxMembers": 40, "maxProjects": 8, "maxStorageBytes": 21474836480 }
```

Any field optional. `200` OrganizationSummary.

### PUT or PATCH `/api/organizations/{id}/entitlements`

Website uses **PUT**. All five booleans required on the record:

```json
{
  "kanban": true,
  "comments": true,
  "notifications": true,
  "fileAttachments": true,
  "advancedReporting": false
}
```

`200` OrganizationSummary.

### POST `/api/organizations/{id}/reset-admin`

No body. Invalidates admin password, issues invite. `200` OrganizationSummary with `inviteToken`.

---

## 6. Members — Admin

### POST `/api/members`

**Use:** Invite. Counts against member quota.

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@acme.com"
}
```

`200` Member (`status: PENDING_SETUP`, maybe `inviteToken`).  
`409 QUOTA_EXCEEDED` if at cap.

### GET `/api/members`

`200` Member[]. Website only calls this as Admin (create project, board members). RN Admin screens need it.

### PATCH `/api/members/{id}`

```json
{ "firstName": "Ada", "lastName": "Byron", "email": "ada@acme.com" }
```

Changing email on `PENDING_SETUP` re-issues an invite (`inviteToken` may return). `200` Member.

### PATCH `/api/members/{id}/disable`

### PATCH `/api/members/{id}/enable`

No body. Cannot disable the org Admin. `200` Member.

### DELETE `/api/members/{id}`

`204`. Not used by the current website UI (disable instead). Still valid.

### POST `/api/members/{id}/resend-invite`

Pending users only. `200` Member + new `inviteToken`.

### POST `/api/members/{id}/cancel-invite`

Pending users only. `204`. Old setup link dies; member row is removed.

### POST `/api/members/{id}/reset-password`

Active members. `200` Member + `inviteToken`. Forces setup-password flow.

Invite URL the website builds:

`{origin}/setup-password?token={inviteToken}`

The RN app should open the same web URL or a native route that posts the token to `/auth/setup-password`.

---

## 7. Projects

### POST `/api/projects` — Admin

```json
{
  "name": "Website relaunch",
  "description": "…",
  "managerId": "…",
  "memberIds": ["…", "…"],
  "startDate": null,
  "targetDate": "2026-09-30",
  "status": "ACTIVE"
}
```

`managerId` required. Manager is always on the member list. `status` optional (defaults in service).  
`200` Project. `409 QUOTA_EXCEEDED` at project cap.

### GET `/api/projects`

**Use:** Projects list. Returns only projects the user may see (Admin: all in org; others: managed or member of).

`200` Project[].

### GET `/api/projects/{id}`

`200` Project. 404 if not visible.

### PATCH `/api/projects/{id}/members` — Admin or PM

```json
{ "memberIds": ["…", "…"] }
```

Manager cannot be removed. `200` Project.

### PATCH `/api/projects/{id}/status?status=ON_HOLD` — Admin or PM

Query param `status` = ProjectStatus. No JSON body. `200` Project.

### GET `/api/projects/{id}/activity`

`200` Activity[]. Same visibility as the project.

### GET `/api/projects/{id}/report` — Admin or PM

Requires advanced reporting entitlement. `200` ProjectReport.

---

## 8. Tasks

### POST `/api/projects/{projectId}/tasks` — Admin or PM

```json
{
  "title": "Draft homepage",
  "description": "…",
  "assigneeId": "…",
  "priority": "MEDIUM",
  "deadline": "2026-08-25"
}
```

`title` required. Others optional (`assigneeId` / `deadline` may be null).  
PM cannot assign the PM unless the actor is Admin. Assignee must be on the project.  
`200` Task. Starts as `TODO`.

### GET `/api/projects/{projectId}/tasks`

Query (all optional):

| Param | Type |
|---|---|
| `status` | TaskStatus |
| `priority` | TaskPriority |
| `assigneeId` | string |
| `q` | string (title search) |
| `overdue` | boolean |

Members only receive **their** tasks on that board; Admin/PM receive all.  
`200` Task[].

**Use:** Kanban columns = group this array by `status`.

### GET `/api/tasks/mine?q=`

Assigned to current user, optional title search. **Use:** My Day extra search matches. `200` Task[].

### GET `/api/tasks/review-queue?q=`

Same payload as `GET /api/reviews` (duplicate). Prefer `/reviews` (what the website uses).

### GET `/api/reviews?q=`

**Who:** Admin (all org REVIEW tasks on org projects) or PM (managed projects only). Plain members → 403 `"Only an Admin or Project Manager can open the review inbox"`.

`q` matches title, project, assignee, manager (case-insensitive).  
`200` ReviewQueueItem[].

### GET `/api/tasks/{id}`

`200` Task if visible. **Use:** task detail.

### PATCH `/api/tasks/{id}` — Admin or PM

Any subset:

```json
{
  "title": "…",
  "description": "…",
  "assigneeId": "…",
  "priority": "HIGH",
  "deadline": "2026-08-30",
  "status": "TODO"
}
```

If `status` is sent, it goes through the same transition engine (including notes). Website currently does not use PATCH for status — it uses the transition endpoints.

### POST `/api/tasks/{id}/transition`

**Use:** Kanban drop, My Day Start, Move to blocked / in progress.

```json
{
  "status": "BLOCKED",
  "comment": null,
  "blockedReason": "Waiting on legal review of the vendor contract",
  "blockedWaitingOnUserId": "…"
}
```

`status` required.  
IN_PROGRESS → BLOCKED requires `blockedReason` trim length ≥ 8.  
REVIEW → IN_PROGRESS (return) requires `comment` ≥ 8 — prefer `/return` instead.  
`blockedWaitingOnUserId` optional; cannot be the assignee; must be a project member.

`200` Task. `422 INVALID_TRANSITION` on illegal move or short note.

### POST `/api/tasks/{id}/submit-review`

No body. Assignee shortcut for IN_PROGRESS → REVIEW. `200` Task.

### POST `/api/tasks/{id}/approve`

No body. PM shortcut for REVIEW → DONE. `200` Task.

### POST `/api/tasks/{id}/return`

```json
{ "comment": "Add the pricing table please" }
```

(`status` is ignored; server forces IN_PROGRESS.) Note ≥ 8. `200` Task. Also writes a comment.

### GET `/api/tasks/{id}/activity`

`200` Activity[].

---

## 9. Comments

Requires comments entitlement.

### GET `/api/tasks/{taskId}/comments`

`200` Comment[].

### POST `/api/tasks/{taskId}/comments`

```json
{
  "content": "Looks good @Pat Manager",
  "mentionedUserIds": ["userIdOfPat"]
}
```

`content` required. Mentions optional. `200` Comment. Notifies assignee + mentioned users (`COMMENT_MENTIONED`).

### PATCH `/api/comments/{id}`

```json
{ "content": "Updated text", "mentionedUserIds": [] }
```

Author only. `200` Comment.

### DELETE `/api/comments/{id}`

Author (or elevated, depending on service). `204`. List may show `deleted: true` rather than omitting — handle both.

---

## 10. Attachments

Requires `fileAttachments` and storage quota.

### POST `/api/tasks/{taskId}/attachments`

`multipart/form-data` field name **`file`**. Bearer header required.  
`200` Attachment. Failures: entitlement, quota, size.

### GET `/api/tasks/{taskId}/attachments`

`200` Attachment[].

### GET `/api/attachments/{id}/download`

Binary. `Content-Disposition: attachment; filename="…"`.  
React Native: save bytes with `expo-file-system` / share with the `originalName`.

### DELETE `/api/attachments/{id}`

Uploader, Admin, or PM. `204`.

---

## 11. Notifications

### GET `/api/notifications`

Website polls every **30 seconds**.

```json
{
  "unreadCount": 2,
  "items": [ { "...Notification..." } ]
}
```

### POST `/api/notifications/{id}/read`

`204`. Website currently only uses read-all.

### POST `/api/notifications/read-all`

`204`.

Navigate: if `taskId` → task detail; else if `projectId` → board.

---

## 12. Public contact

### POST `/api/public/contact` — public

Landing “Contact us”. Rate limited.

```json
{
  "name": "Sam Buyer",
  "email": "sam@company.com",
  "organizationName": "Company Ltd",
  "teamSize": "11-50",
  "message": "We need a workspace for 40 people."
}
```

| Field | Rules |
|---|---|
| name | required, max 80 |
| email | required, max 160 |
| organizationName | required, max 120 |
| teamSize | optional, max 40 (`1-10`, `11-50`, `51-200`, `201-500`, `500+`) |
| message | required, 10–2000 |

Response `202`.

---

## 13. Who calls what (React Native cheat sheet)

| User intent | Method | Path |
|---|---|---|
| Log in | POST | `/auth/login` |
| Cold start | POST | `/auth/refresh` |
| Who am I | GET | `/auth/me` |
| Log out | POST | `/auth/logout` |
| Home | GET | `/dashboard` |
| My Day | GET | `/me/day` |
| Pin / hide | PUT | `/me/day/pins` `/me/day/hidden` |
| Bell | GET | `/notifications` |
| Mark read | POST | `/notifications/read-all` |
| Customer list | GET | `/organizations` |
| Create tenant | POST | `/organizations` |
| Org detail | GET | `/organizations/{id}` |
| Plans dropdown | GET | `/plans` |
| People | GET | `/members` |
| Invite | POST | `/members` |
| Project list | GET | `/projects` |
| Open board | GET | `/projects/{id}` + `/projects/{id}/tasks` |
| Report header | GET | `/projects/{id}/report` |
| New task | POST | `/projects/{id}/tasks` |
| Move card | POST | `/tasks/{id}/transition` |
| Submit | POST | `/tasks/{id}/submit-review` |
| Approve | POST | `/tasks/{id}/approve` |
| Return | POST | `/tasks/{id}/return` |
| Task screen | GET | `/tasks/{id}` + comments + activity + attachments |
| Review inbox | GET | `/reviews` |
| Profile name | PATCH | `/me` |
| Password | POST | `/me/password` |
| Email prefs | GET/PATCH | `/me/notification-preferences` |

---

## 14. HTTP cheat sheet

| Method | Typical success |
|---|---|
| GET | 200 + JSON |
| POST create | 200 + created entity (not 201) |
| POST action (approve, logout, read-all) | 200 entity **or** 204 |
| POST forgot / contact | 202 |
| PATCH | 200 + entity |
| PUT My Day | 200 + MyDay |
| DELETE | 204 |

There is no pagination on list endpoints today. Boards can grow; still load the full array like the website.
