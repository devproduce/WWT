# WeWorkTogether (WWT)

Multi-tenant project management SaaS: organizations, projects, tasks, Kanban, reviews, comments, quotas, and role-based privacy.

**Stack:** React (Vite + TypeScript) · Spring Boot 3.4 · MongoDB Atlas · JWT

## What you need

1. **JDK 21** and **Node.js 20+**
2. A **MongoDB Atlas** cluster and connection string
3. Atlas Network Access must allow your IP

Optional: Gmail SMTP for real invite/reset emails. Production is hosted at weworktogether.me.

## Configure

Edit the `.env` file in the project root (next to `README.md`). It is loaded every time you start the backend, so you do not need to set PowerShell variables again.

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/weworktogether?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-chars
SUPERADMIN_EMAIL=you@example.com
SUPERADMIN_PASSWORD=ChangeMe_Admin1!
VITE_API_BASE_URL=http://localhost:8080
```

If `.env` is missing, copy `.env.example` to `.env`.

Invite, password-reset, and notification emails are sent over **Gmail SMTP**. Until `SMTP_USERNAME` is set, the API logs the send instead and still returns the invite token in the UI.

### Gmail SMTP (production)

Activation links are built from `FRONTEND_URL`, not from the React app. On the live API (`api.weworktogether.me`) set:

```env
FRONTEND_URL=https://weworktogether.me
CORS_ORIGINS=https://weworktogether.me,https://www.weworktogether.me
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=yourname@gmail.com
SMTP_PASSWORD=your-16-char-app-password
MAIL_FROM_NAME=WeWorkTogether
```

Use a [Google App Password](https://myaccount.google.com/apppasswords), not your normal Gmail password. 2-Step Verification must be on. Recipients will see `WeWorkTogether <yourname@gmail.com>`. Restart the production API after changing env, then invite a test member and confirm the mail opens `https://weworktogether.me/setup-password?token=...`.

The hosted UI (`https://weworktogether.me`) calls `https://api.weworktogether.me`. Login will fail with a browser CORS error until the live API has `CORS_ORIGINS` set as above (or at least `https://weworktogether.me`) and the backend process is restarted. `http://localhost:5173` is only for local Vite.

Personal Gmail is typically limited to about 500 messages per day.

## Run locally

Terminal 1 — API:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Health check: http://localhost:8080/actuator/health

Terminal 2 — UI:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in as SuperAdmin.

## Roles

| Role | Scope |
|---|---|
| SuperAdmin | Organizations, plans, quotas. Cannot see internal work. |
| Admin | One organization: members, projects, full visibility. |
| Project Manager | Per-project assignment (not a global role). Tasks, Kanban, reviews. |
| Member | Assigned tasks, comments, submit for review. Cannot mark DONE. |

## Project layout

```
backend/    Spring Boot API (com.orgaflow)
frontend/   Vite + React
.github/    CI
```

## Docker

Requires `MONGODB_URI` in the environment. Builds API + Nginx UI:

```powershell
docker compose up --build
```

UI: http://localhost:8088 · API: http://localhost:8080
