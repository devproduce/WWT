# Backend domain and workflows

How WeWorkTogether **behaves**. The React Native app must follow these rules instead of inventing its own. Endpoints: [BACKEND_API_REFERENCE.md](./BACKEND_API_REFERENCE.md).

---

## 1. Domain objects

```
Platform
  └── Organization  (tenant / customer)
        ├── Plan + quotas + entitlements (overridable)
        ├── Admin (exactly one, role ADMIN)
        ├── Members (role MEMBER)
        └── Projects
              ├── managerId  → Project Manager (still role MEMBER)
              ├── memberIds  → who may receive tasks
              └── Tasks
                    ├── assignee
                    ├── comments, attachments, activity
                    └── status workflow
```

Mongo collections you never talk to from the RN app: `users`, `organizations`, `plans`, `projects`, `tasks`, `comments`, `attachments`, `activities`, `notifications`, `refresh_tokens`, `one_time_tokens`, `my_day_prefs`.

---

## 2. User lifecycle

1. SuperAdmin creates an Organization + Admin email.
2. Admin is `PENDING_SETUP`. They open `/setup-password?token=` and `POST /auth/setup-password`. Status becomes `ACTIVE`.
3. Admin invites members the same way (`POST /members`).
4. Admin may **resend** or **cancel** a pending invite. Cancel deletes the pending user; the token dies.
5. Admin may **reset password** for an active member (new one-time token).
6. Admin may **disable** / **enable** members. Disabled users cannot authenticate.
7. SuperAdmin may **reset Admin** for a tenant (new setup token).
8. SuperAdmin may **disable the organization**. Data stays. Members can still GET (dashboard shows the lock card) but cannot POST/PUT/PATCH/DELETE.

Passwords are BCrypt. The RN app never hashes; send plaintext over HTTPS only.

---

## 3. Project membership

- Only **Admin** creates projects.
- `managerId` is required. That user is the Project Manager.
- `memberIds` is the assignable pool. The manager is always included.
- Admin may assign tasks to the PM. A PM may **not** assign tasks to themselves.
- Members who are not on `memberIds` cannot be assignees and cannot open the project (404).
- Admin sees every project in the org. Members see projects they manage or belong to.

Project statuses are metadata for portfolio filters. They do **not** freeze the board in the current API (you can still mutate tasks on `ON_HOLD` / `COMPLETED` unless a future guard is added). Prefer not to create tasks on `ARCHIVED` in the UI even if the API allows it.

---

## 4. Task workflow (source of truth)

Statuses, in board order:

```
TODO → IN_PROGRESS → REVIEW → DONE
                 ↘ BLOCKED ↗
```

`TaskWorkflow.allowedTargets` is what fills `allowedTransitions` on every Task JSON. **Do not hardcode extra buttons.**

### 4.1 Who may move where

Assume `from != to`. Same-status is always allowed (no-op).

**Assignee**

| From | To |
|---|---|
| TODO | IN_PROGRESS |
| IN_PROGRESS | REVIEW, BLOCKED |
| BLOCKED | IN_PROGRESS |

Assignee cannot touch REVIEW or DONE.

**Project Manager** (in addition, when `from == REVIEW`)

| From | To |
|---|---|
| REVIEW | DONE (approve) |
| REVIEW | IN_PROGRESS (return) |

**Admin** has **no extra transitions** unless they are also the assignee or the PM. Org-wide visibility ≠ sign-off rights.

**Nobody** may:

- Skip TODO → REVIEW
- Member-mark DONE
- Approve their own work unless they are the PM (unusual; Admin can assign the PM)

### 4.2 Dedicated endpoints vs generic transition

| Intent | Call | Body |
|---|---|---|
| Start work | `POST /tasks/{id}/transition` | `{ "status": "IN_PROGRESS" }` |
| Submit | `POST /tasks/{id}/submit-review` | empty |
| Block | `POST /tasks/{id}/transition` | `{ "status": "BLOCKED", "blockedReason": "≥8 chars", "blockedWaitingOnUserId": "optional" }` |
| Unblock | `POST /tasks/{id}/transition` | `{ "status": "IN_PROGRESS" }` |
| Approve | `POST /tasks/{id}/approve` | empty |
| Return | `POST /tasks/{id}/return` | `{ "comment": "≥8 chars" }` |

The website **hides** generic REVIEW / DONE / IN_PROGRESS buttons on the task page in favor of Submit / Approve / Return so the copy stays human. The RN app should do the same.

### 4.3 Notes (422 `INVALID_TRANSITION`)

- Return note and blocked reason: trim, **minimum 8 characters**.
- Blocked waiting-on person: optional; must be a project member; **cannot be the assignee**.
- Return also stores `lastReturnNote` / `lastReturnedAt` and inserts a comment. Show the amber “Changes requested” banner while status is IN_PROGRESS and `lastReturnNote` is set.

### 4.4 Deadline clock

`TaskDeadlines.clockRunning`:

- **Running** for TODO, IN_PROGRESS, BLOCKED
- **Paused** for REVIEW (waiting on the PM does not burn the member)
- **Stopped** for DONE

**Overdue:** clock running AND `deadline < today` (date only, no time).  
**Due soon (member home):** clock running AND deadline in `[today, today+3]`.  
**Upcoming (admin home):** same with **7** days.

A blocked task **can still be overdue**. The assignee still owns unblocking it.

---

## 5. My Day ranking

Private to the signed-in member. Does not change the board.

Input: all non-DONE tasks assigned to the user, plus pin/hide lists, plus `date`.

1. Hidden ids are removed from focus/waiting. Counted in `hiddenCount`.
2. `waiting` = visible tasks in REVIEW or BLOCKED (not capped).
3. Actionable = TODO or IN_PROGRESS.
4. Pinned actionable tasks go to the **front** of `focus` with `why: PINNED`.
5. Remaining actionable tasks are scored, sorted, **capped at 8** (`AUTO_CAP`).
6. `overflowCount` = other open, non-hidden, non-waiting tasks that did not make focus.

### Score (higher first)

| Condition | Points |
|---|---|
| IN_PROGRESS | +100 |
| Overdue | +50 + min(30, daysOverdue × 5) |
| Returned in last 48 hours | +30 |
| Due today | +35 |
| Due tomorrow | +20 |
| Due in 2–3 days | +10 |
| URGENT | +40 |
| HIGH | +25 |
| MEDIUM | +10 |
| LOW | 0 |

Tie-break: earlier deadline, then higher priority, then older `updatedAt`.

### `why` (first match)

PINNED → IN_PROGRESS → REVIEW → OVERDUE → RETURNED → DUE_TODAY → DUE_SOON (≤3 days) → BLOCKED → HIGH_PRIORITY.

### `primaryAction`

| Status | Action | RN button |
|---|---|---|
| TODO | `START` | Start → transition IN_PROGRESS |
| IN_PROGRESS | `SUBMIT_REVIEW` | Submit → submit-review |
| else | `OPEN` | Open task |

Pins/hides: send the **full replacement list** of ids, not a toggle delta, matching the website (`[...pinIds, id]` / filter out).

---

## 6. Review inbox

Queue = tasks in `REVIEW` on projects the actor may see, oldest `updatedAt` first (`waitingSince`).

- **PM:** can act when `task.canReview == true` (they manage that project).
- **Admin:** sees every org review, grouped by `managerName`, **read-only** unless they are also a PM on that project.
- Stale in the UI: waiting ≥ 24 hours.
- High priority chip: task priority HIGH or URGENT.

Approve and return are the only legal exits from REVIEW (plus theoretically a no-op).

---

## 7. Comments and mentions

- `mentionedUserIds` is an explicit list. The RN app should compute it from `@Display Name` tokens against `project.members`.
- Mention highlighting: violet chip when the `@Name` still appears as a bounded token.
- `COMMENT_MENTIONED` notifications use a distinct violet treatment in the bell.
- Soft-deleted comments may remain with `deleted: true` — render as removed or skip.

---

## 8. Notifications (in-app)

Created by the server when work happens. The RN app only lists and marks read.

| Type | Typical recipient |
|---|---|
| TASK_ASSIGNED | new assignee |
| PROJECT_ASSIGNMENT | added to a project |
| TASK_READY_FOR_REVIEW | project manager |
| TASK_RETURNED | assignee |
| TASK_APPROVED | assignee |
| TASK_BLOCKED | project manager |
| COMMENT_ADDED | assignee (if not author) |
| COMMENT_MENTIONED | mentioned users |
| DEADLINE_APPROACHING / TASK_OVERDUE | assignee (jobs / policy) |
| ACCOUNT_EVENT | user (invite/reset) |

Email is separate and currently mostly paused in the product copy; prefs are still stored. Invites and password setup **do** send mail when SMTP is configured. Until SMTP is set, the API logs the send and may return `inviteToken` for the Admin to copy.

---

## 9. Activity feed

Append-only. Messages are preformatted English sentences (`actorName + verb`). Display `message` as-is, not reconstruct it from `type`.

Link: `taskId` → task, else `projectId` → board.

---

## 10. Files

- Field name: `file`.
- Default max **10 MB** (`MAX_FILE_BYTES`), servlet cap 15 MB.
- Counts toward org `maxStorageBytes`.
- Disabled unless entitlement `fileAttachments` is true (Professional/Business by default; SuperAdmin can toggle per org).
- Download is authenticated; do not share raw disk paths. Use `GET /api/attachments/{id}/download` with Bearer.

---

## 11. Quotas

Checked on:

| Action | Quota |
|---|---|
| Invite member | `maxMembers` (ACTIVE + PENDING_SETUP) |
| Create project | `maxProjects` (non-archived live statuses as counted by the service) |
| Upload file | `maxStorageBytes` |

Response `409` `QUOTA_EXCEEDED` with a human `message`. Show it in a toast. SuperAdmin meters on org cards must use the same used/limit pairs as OrganizationSummary.

---

## 12. Dashboard semantics worth copying

### SuperAdmin

Aggregate **customers**, never work. Filter chips mutate the `items` list client-side (`ACTIVE` / `DISABLED`). Ring = active / total orgs.

### Admin

`deadlineTasks[].kind` is `overdue` or `upcoming`. Clicking Overdue / Due this week filters that strip. Delivery mix uses org-wide todo/inProgress/review/blocked/done. Project cards use `doneTasks/totalTasks` plus optional review count.

### Member

Donut + stack use **assigned** mix. MetricCards are client-side filters for My Day (`OVERDUE`, `SOON`, `REVIEW`, `PRIORITY`). Due rail: assigned tasks with a deadline and a running clock, sorted by date, max 8.

PM banner appears when `managedProjects > 0`. `pmProjectId` is only the **first** managed project — if they manage several, the name becomes `"N projects"` and the Kanban button still uses that first id. To open another, they use the Projects list.

---

## 13. Visibility cheat sheet (tasks)

| Actor | Sees task if |
|---|---|
| SuperAdmin | never |
| Admin | task’s org is theirs |
| PM | task’s project `managerId` is them |
| Member | `assigneeId` is them **and** they can see the project |

`GET /projects/{id}/tasks` already applies this. Do not assume a member’s board shows every card.

---

## 14. Suggested TypeScript models (share with the website)

Mirror the TypeScript names in `frontend/src/types/index.ts`:

`Role`, `UserStatus`, `OrganizationStatus`, `ProjectStatus`, `TaskStatus`, `TaskPriority`, `Me`, `AuthResponse`, `Plan`, `OrganizationSummary`, `Member`, `Project`, `TaskItem`, `CommentItem`, `ActivityItem`, `NotificationItem`, `Dashboard`, `ProjectReport`, `AttachmentItem`, `MyDayItem`, `MyDayResponse`, `ReviewQueueItem`, `NotificationPrefs`.

Parse enums as strings. Unknown future enum values should fall back to a slate badge, not crash.

Dashboard `metrics` and `items` are loosely typed maps — use defensive `num` / `str` helpers like the website (`Number(value)` / `String(value)` with fallbacks).

---

## 15. What not to build

- A second backend or local SQLite source of truth
- Client-side DONE for members
- SuperAdmin screens that list tasks or employees
- Assuming cookie refresh on iOS/Android
- Pagination (the API has none)
- Dark theme for the workspace
- A different status set (`Doing`, `QA`, etc.) — labels may be human (`In progress`) but the **id** stays `IN_PROGRESS`
