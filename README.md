# WeWorkTogether (WWT)

Multi-tenant project management SaaS: organizations, projects, tasks, Kanban, reviews, comments, quotas, and role-based privacy.

**Stack:** React (Vite + TypeScript) · Spring Boot 3.4 · MongoDB Atlas · JWT

## What you need

1. **JDK 21** and **Node.js 20+**
2. A **MongoDB Atlas** cluster and connection string
3. Atlas Network Access must allow your IP

Optional later: SMTP for real invite/reset emails, AWS for production deploy.

## Configure

Edit the `.env` file in the project root (next to `README.md`). It is loaded every time you start the backend, so you do not need to set PowerShell variables again.

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/weworktogether?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-chars
SUPERADMIN_EMAIL=you@example.com
SUPERADMIN_PASSWORD=ChangeMe_Admin1!
```

If `.env` is missing, copy `.env.example` to `.env`. Until SMTP is set, invite links are shown in the UI / API response.

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
