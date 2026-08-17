# Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Product Name

**Project Management & Organization Platform**

Working name: **OrgaFlow**

### 1.2 Product Vision

OrgaFlow is a multi-tenant project management SaaS platform that allows organizations to manage employees, projects, tasks, collaboration, and project execution from one centralized system.

The platform separates responsibilities across four clearly defined roles:

**SuperAdmin → Admin → Project Manager → Member**

Each role has a different scope of visibility and authority. The platform owner manages organizations and their commercial/resource limits, while organizations independently manage their members and internal work.

### 1.3 Core Value Proposition

The platform solves two problems simultaneously:

**For the SaaS/platform owner:**

Manage multiple organizations as independent customers, control their resource quotas and available features, and operate the platform without accessing the private internal work of those organizations.

**For organizations:**

Provide administrators and project managers with a structured system to manage teams, projects, tasks, deadlines, reviews, collaboration, and progress.

**For employees:**

Give members a clear view of their assigned work, deadlines, priorities, comments, and task status.

---

# 2. Product Principles

The product will be designed around five principles:

### Privacy First

Organizations are isolated from one another. The SuperAdmin can manage the organization as a customer but cannot inspect its internal work.

### Role-Based Access

Users only receive the permissions required for their role.

### Multi-Tenant Architecture

Every organization is logically isolated from every other organization.

### Quota-Driven Business Model

Organizations have configurable limits such as members, projects, storage, and other resources.

### Clear Accountability

Projects, tasks, assignments, comments, status changes, and reviews should provide clear ownership and activity history.

---

# 3. User Roles

The system contains exactly four primary roles.

```text
SuperAdmin
    │
    ├── Organization A
    │      └── Admin
    │           ├── Project A
    │           │      └── Project Manager
    │           │           └── Members / Tasks
    │           └── Project B
    │
    ├── Organization B
    │      └── Admin
    │
    └── Organization C
           └── Admin
```

## 3.1 SuperAdmin

The SuperAdmin operates the SaaS platform.

The SuperAdmin is not an employee of any organization and does not participate in organization-level work.

### Responsibilities

- Create organizations
- Configure organization plans/limits
- Activate organizations
- Disable organizations
- Reset an organization's Admin account
- View organization-level aggregate information
- View organization usage against quotas
- Manage platform-level configuration

### SuperAdmin can see

- Organization name
- Organization status
- Organization plan
- Organization creation date
- Organization Admin identity
- Maximum member limit
- Current member count
- Maximum project limit
- Current project count
- Other aggregate resource usage
- Feature entitlements

### SuperAdmin cannot see

- Individual organization members
- Member names
- Member credentials
- Tasks
- Task descriptions
- Task comments
- Project details
- Project activity
- Employee activity
- Internal organization conversations
- Work performed by employees

This privacy boundary is a core product requirement.

---

# 4. Organization

An Organization represents a customer/tenant on the platform.

Each organization has exactly one Admin account.

Example:

```text
Acme Technologies

Plan: Professional
Member Limit: 100
Project Limit: 20
Storage Limit: 100 GB

Admin:
John Smith
```

## 4.1 Organization Properties

An organization may have:

- Organization ID
- Organization name
- Admin account
- Plan
- Status
- Member limit
- Project limit
- Storage limit
- Other resource limits
- Feature entitlements
- Creation date
- Last updated date

## 4.2 Organization Status

Organizations can have:

- ACTIVE
- DISABLED

A disabled organization cannot perform normal application operations.

Existing data should remain preserved unless explicitly removed according to a future data-retention policy.

---

# 5. Organization Admin

The Admin is the head of exactly one organization.

The Admin is responsible for managing the organization's members and projects.

## 5.1 Admin Responsibilities

### Member Management

The Admin can:

- Create member accounts
- Remove members
- Disable member accounts
- Reset member credentials
- View organization members
- Assign members to projects
- Designate members as Project Managers where applicable

The Admin is the only role responsible for organization-member management.

### Project Management

The Admin can:

- Create projects
- View all organization projects
- Assign a Project Manager to a project
- View project details
- View project tasks
- View task progress
- View project activity
- Intervene in project management
- Perform actions available to the Project Manager

### Organization-level Visibility

The Admin can access all internal information belonging to their organization, subject to the application's authorization rules.

The Admin cannot access another organization's data.

---

# 6. Project

A Project represents a unit of work belonging to exactly one organization.

Each project has exactly one Project Manager.

Example:

```text
Organization: Acme Technologies

Project:
Food Delivery Application

Project Manager:
Rahul Sharma
```

## 6.1 Project Properties

A project contains:

- Project ID
- Organization ID
- Project name
- Description
- Project Manager
- Project members
- Status
- Start date
- Target completion date
- Created by
- Created date
- Updated date
- Progress information

## 6.2 Project Status

Suggested states:

- PLANNED
- ACTIVE
- ON_HOLD
- COMPLETED
- ARCHIVED

---

# 7. Project Manager

The Project Manager is responsible for one project.

A Project Manager has authority over the execution of that project but cannot access or manage unrelated projects.

## 7.1 Project Manager Responsibilities

The Project Manager can:

- View project information
- View project members
- Create tasks
- Assign tasks to project members
- Set task priority
- Set deadlines
- Edit task details
- Monitor task progress
- Review submitted work
- Approve completed work
- Return work for revision
- Move tasks across workflow states
- Comment on tasks
- View project activity
- Monitor project progress
- Use the project's Kanban board

## 7.2 Project Manager Restrictions

The Project Manager cannot:

- Create organizations
- Manage organization Admin accounts
- Manage organization-level quotas
- Manage members outside their project
- Access another project's private data
- Access another organization's data

---

# 8. Member

A Member is an employee/user who performs work inside projects.

A member may belong to multiple projects within the organization.

## 8.1 Member Permissions

Members can:

- View their assigned tasks
- View task descriptions
- View deadlines
- View priorities
- View who assigned the task
- View relevant project information
- Change the status of their assigned tasks
- Submit work for review
- Add comments
- Participate in task discussions
- View task history relevant to their work

Members cannot:

- Create projects
- Create tasks
- Assign tasks
- Manage other users
- Manage project configuration
- Access unrelated organization data
- Access tasks that are not visible to them

---

# 9. Role & Permission Model

| Capability | SuperAdmin | Admin | Project Manager | Member |
|---|---:|---:|---:|---:|
| Create organization | ✓ | — | — | — |
| Disable organization | ✓ | — | — | — |
| Configure organization quotas | ✓ | — | — | — |
| Reset organization Admin | ✓ | — | — | — |
| See aggregate organization usage | ✓ | ✓ | — | — |
| See organization members | — | ✓ | Project only | — |
| Add organization members | — | ✓ | — | — |
| Remove organization members | — | ✓ | — | — |
| Create project | — | ✓ | — | — |
| View all organization projects | — | ✓ | — | — |
| Manage project | — | ✓ | Own project | — |
| Create task | — | ✓ | ✓ | — |
| Assign task | — | ✓ | ✓ | — |
| View all project tasks | — | ✓ | Own project | Assigned only |
| Update assigned task | — | ✓ | ✓ | ✓ |
| Review work | — | ✓ | ✓ | — |
| Comment | — | ✓ | ✓ | ✓ |
| View project activity | — | ✓ | Own project | Relevant activity |

The authorization layer must enforce these rules server-side.

The frontend must never be considered the source of truth for permissions.

---

# 10. Authentication

All users authenticate through the platform.

## 10.1 Authentication Requirements

The system should support:

- Login
- Logout
- Password hashing
- Password reset
- Credential reset by authorized administrator
- Session/token expiration
- Account activation/deactivation
- Authentication error handling

The initial implementation will use:

**Spring Security + JWT**

Access tokens should be short-lived, with an appropriate refresh-token strategy.

Passwords must never be stored in plain text.

---

# 11. Organization Creation Workflow

The SuperAdmin creates an organization.

Example:

```text
Create Organization

Organization Name:
Acme Technologies

Admin Name:
John Smith

Admin Email:
john@acme.com

Plan:
Professional

Maximum Members:
100

Maximum Concurrent Projects:
20

Storage:
100 GB

Enabled Features:
✓ Kanban
✓ Comments
✓ Notifications
✓ File Attachments
```

When creation succeeds:

1. Organization is created.
2. Organization limits are stored.
3. Organization Admin account is created.
4. Admin receives an invitation/credential setup flow.
5. Organization becomes ACTIVE.

---

# 12. Organization Quotas

Quotas are fundamental to the business model.

Each organization has a set of resource limits.

## 12.1 Initial Quotas

The first version should support:

### Member Limit

Maximum number of active members allowed.

### Project Limit

Maximum number of active/concurrent projects allowed.

### Storage Limit

Maximum storage available for uploaded files.

### Optional Future Quotas

The architecture should allow future limits such as:

- Maximum projects per Project Manager
- Maximum file size
- Maximum attachment count
- Maximum monthly notifications
- Maximum automation executions
- Maximum API usage
- Maximum project members

## 12.2 Quota Enforcement

Quotas must be enforced by the backend.

Example:

```text
Member Limit = 100
Current Members = 100

Admin attempts to add Member #101

Backend:
100 >= 100

Reject request
```

The frontend should display a meaningful message.

---

# 13. Plans

The platform should support configurable plans.

Example:

## Starter

- 25 members
- 5 projects
- 10 GB storage
- Basic task management
- Kanban
- Comments

## Professional

- 100 members
- 20 projects
- 100 GB storage
- Notifications
- File attachments
- Advanced reporting

## Business

- 500 members
- 100 projects
- 1 TB storage
- Advanced analytics
- Additional collaboration capabilities

These are example plans rather than fixed commercial commitments.

The SuperAdmin should be able to assign a plan and, where required, override individual organization quotas.

Example:

```text
Plan:
Professional

Default:
100 members
20 projects

Custom enterprise agreement:
250 members
50 projects
```

---

# 14. Project Creation Workflow

The Admin creates a project.

```text
Create Project

Project Name:
Food Delivery Application

Description:
Development of a food delivery platform.

Project Manager:
Rahul Sharma

Target Date:
December 30
```

The backend verifies:

1. The requester is an Admin.
2. The Admin belongs to the organization.
3. The organization is active.
4. The project quota has not been exceeded.
5. The selected Project Manager belongs to the organization.
6. The selected Project Manager satisfies the project's assignment rules.

Once created, the project becomes available to the Project Manager.

---

# 15. Project Members

A project contains a subset of organization members.

A member may belong to multiple projects.

Example:

```text
Organization Members:

Himanshu
Rahul
Priya
Amit
Sneha

Project A Members:

Himanshu
Rahul
Priya
```

Project members are the people who can receive tasks for the project.

For the initial product:

- Admin manages organization membership.
- Admin assigns organization members to projects.
- Project Manager works with the project's existing members.
- Project Manager may not add arbitrary users from outside the organization.

---

# 16. Task Management

Tasks are the central work unit.

## 16.1 Task Properties

Each task should support:

- Task ID
- Project ID
- Title
- Description
- Assigned member
- Created by
- Priority
- Status
- Deadline
- Creation date
- Updated date
- Completion date
- Comments
- Activity history
- Optional attachments

## 16.2 Task Priority

Initial priorities:

- LOW
- MEDIUM
- HIGH
- URGENT

## 16.3 Task Status

The workflow should be:

```text
TODO
  ↓
IN_PROGRESS
  ↓
REVIEW
  ↓
DONE
```

Additional state:

```text
BLOCKED
```

Possible transition:

```text
TODO → IN_PROGRESS
IN_PROGRESS → REVIEW
REVIEW → DONE
REVIEW → IN_PROGRESS
IN_PROGRESS → BLOCKED
BLOCKED → IN_PROGRESS
```

The Project Manager controls review/approval.

---

# 17. Task Review Workflow

A Member does not directly finalize a task as DONE.

Instead:

### Step 1

Member works on the task.

```text
TODO → IN_PROGRESS
```

### Step 2

Member submits completed work.

```text
IN_PROGRESS → REVIEW
```

### Step 3

Project Manager reviews the work.

If accepted:

```text
REVIEW → DONE
```

If changes are required:

```text
REVIEW → IN_PROGRESS
```

The Project Manager can leave a comment explaining what needs to change.

This provides accountability and creates a meaningful review workflow.

---

# 18. Kanban Board

Each project will have a Kanban board.

Columns:

```text
TODO | IN PROGRESS | REVIEW | BLOCKED | DONE
```

Cards display:

- Task title
- Assignee
- Priority
- Deadline
- Status

The board should support task movement according to authorized workflow transitions.

The UI should prevent unauthorized users from moving tasks they do not control.

The backend must validate every status transition.

---

# 19. Comments & Collaboration

Every task has a comment thread.

Users with permission can:

- Add comments
- View comments
- Reply to comments if threading is supported
- Mention other project participants in the future

Example:

```text
Rahul — Project Manager
"Please add retry handling for failed payments."

Himanshu — Member
"Added retry handling and pushed the changes."

Rahul — Project Manager
"Looks good. Sending it to DONE."
```

Comments should contain:

- Comment ID
- Task ID
- Author
- Content
- Created timestamp
- Updated timestamp
- Optional deleted/edited state

---

# 20. Activity History / Audit Trail

The system should record significant project and task events.

Examples:

```text
Task created
Task assigned
Task priority changed
Deadline changed
Task status changed
Comment added
Task submitted for review
Task approved
Task returned for revision
Project Manager changed
Project member added
Project member removed
```

Example:

```text
August 17, 10:42
Rahul assigned "Implement Login API" to Himanshu

August 18, 14:05
Himanshu changed status to IN_PROGRESS

August 20, 17:30
Himanshu submitted task for REVIEW

August 21, 09:15
Rahul approved task
```

Activity visibility must respect role permissions.

---

# 21. Dashboards

Each role gets a dedicated dashboard.

## 21.1 SuperAdmin Dashboard

Purpose:

Monitor the platform and customer organizations.

Displays:

- Total organizations
- Active organizations
- Disabled organizations
- Aggregate member count
- Aggregate project count
- Organization list
- Organization status
- Plan
- Member utilization
- Project utilization
- Storage utilization

SuperAdmin must not see internal organization work.

---

## 21.2 Admin Dashboard

Purpose:

Manage the organization.

Displays:

- Organization name
- Member utilization
- Project utilization
- Active projects
- Completed projects
- Organization members
- Project list
- Project progress
- Important project activity
- Upcoming deadlines
- Overdue tasks

---

## 21.3 Project Manager Dashboard

Purpose:

Manage project execution.

Displays:

- Project progress
- Total tasks
- TODO tasks
- IN_PROGRESS tasks
- REVIEW tasks
- BLOCKED tasks
- DONE tasks
- Overdue tasks
- Upcoming deadlines
- Team workload
- Kanban board
- Recent activity

---

## 21.4 Member Dashboard

Purpose:

Show members exactly what requires their attention.

Displays:

- Assigned tasks
- Due soon
- Overdue
- High-priority tasks
- Tasks awaiting review
- Recent comments
- Task status

The member dashboard should remain significantly simpler than the Admin/PM dashboards.

---

# 22. Notifications

The system should support notifications for events such as:

- New task assigned
- Task deadline approaching
- Task overdue
- Comment added
- User mentioned
- Task returned from review
- Task approved
- Project assignment
- Organization-level account events

Initial notification delivery can be:

- In-app notifications
- Email notifications

Push notifications can be introduced later.

---

# 23. File Attachments

Tasks should optionally support file attachments.

Possible examples:

- Design documents
- Screenshots
- PDFs
- Reports
- Deliverables

The initial version should enforce:

- Organization storage quota
- Maximum file size
- Authorized access
- File metadata
- Secure download

Actual object storage can be introduced using cloud storage later.

---

# 24. Search, Filtering & Sorting

Users should be able to efficiently find relevant work.

## Task filtering

Filter by:

- Status
- Priority
- Assignee
- Deadline
- Project
- Creation date

## Project filtering

Filter by:

- Status
- Project Manager
- Deadline

## Search

Admin/PM users should be able to search relevant projects/tasks within their permitted scope.

Members should search within their accessible tasks.

---

# 25. Reporting

The initial version should provide basic project metrics.

Examples:

```text
Total Tasks: 100
Completed: 62
In Progress: 20
Review: 10
Blocked: 8
```

Project completion:

```text
62%
```

Additional metrics:

- Tasks completed over time
- Overdue tasks
- Tasks by priority
- Tasks by member
- Average completion time
- Project workload

Advanced analytics can be introduced in later versions.

---

# 26. Multi-Tenancy

Every organization is an isolated tenant.

A user must never be able to access another organization's data.

Example:

```text
Organisation A
    User A
    Project A
    Tasks A

Organisation B
    User B
    Project B
    Tasks B
```

User A must never be able to access Project B, even by directly calling an API.

The backend must derive organization context from the authenticated user's identity/authorization rather than trusting organization IDs supplied by the client.

Every sensitive query must be scoped appropriately.

---

# 27. Security Requirements

The system must implement:

### Authentication

- Secure password hashing
- JWT authentication
- Token expiration
- Refresh-token strategy
- Logout/revocation strategy where appropriate

### Authorization

- Role-based access control
- Organization-level isolation
- Project-level access restrictions
- Resource-level permission checks

### API Security

- Request validation
- Input sanitization
- CORS configuration
- Rate limiting where appropriate
- Secure HTTP headers
- Consistent error responses

### Privacy

The SuperAdmin's inability to access organization internals must be enforced technically, not merely through UI restrictions.

---

# 28. Technology Stack

## Frontend

**React**

Recommended supporting technologies:

- React
- React Router
- TypeScript
- Axios or Fetch
- React Query / TanStack Query
- Form validation library
- Component library or custom design system

The frontend should be responsive and usable on desktop and tablet screens.

---

# 29. Backend

**Spring Boot**

Core components:

- Spring Boot
- Spring Web
- Spring Security
- Spring Data MongoDB
- Bean Validation
- Spring Boot Actuator
- Spring Testing

Potential supporting technologies:

- Lombok
- MapStruct
- JWT library
- OpenAPI/Swagger

---

# 30. Database

**MongoDB**

MongoDB will store application data.

Likely core collections:

```text
users
organizations
plans
projects
tasks
comments
activities
notifications
attachments
refresh_tokens
```

Important design consideration:

Although MongoDB is document-oriented, organization/project/task references must still be carefully designed so that authorization boundaries remain explicit.

Every organization-owned document should carry an organization identifier where appropriate.

Example:

```json
{
  "organizationId": "...",
  "projectId": "...",
  "title": "Implement login API",
  "assigneeId": "...",
  "status": "IN_PROGRESS"
}
```

The backend should never rely purely on the frontend to supply or validate these relationships.

---

# 31. API Architecture

The backend will expose REST APIs.

Example API areas:

```text
/api/auth
/api/organizations
/api/members
/api/projects
/api/tasks
/api/comments
/api/notifications
/api/dashboard
/api/plans
```

Example:

```text
POST   /api/auth/login
POST   /api/auth/refresh

POST   /api/organizations
PATCH  /api/organizations/{id}/disable

POST   /api/members
DELETE /api/members/{id}

POST   /api/projects
GET    /api/projects
GET    /api/projects/{id}

POST   /api/tasks
PATCH  /api/tasks/{id}
POST   /api/tasks/{id}/submit-review

POST   /api/tasks/{id}/comments
GET    /api/tasks/{id}/comments
```

Actual endpoint design should be finalized during system architecture.

---

# 32. Frontend Architecture

The React application should use a modular structure.

Possible structure:

```text
src/
│
├── components/
├── pages/
├── layouts/
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── projects/
│   ├── tasks/
│   ├── comments/
│   ├── notifications/
│   └── dashboard/
│
├── services/
├── hooks/
├── routes/
├── utils/
├── types/
└── app/
```

The UI should use role-aware routing and components.

However, role checks in React are only for user experience.

**Spring Boot remains the authoritative authorization layer.**

---

# 33. Backend Architecture

The initial backend should use a modular layered architecture.

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
MongoDB
```

Security:

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Controller
   ↓
Service
   ↓
Repository
```

Business rules such as quotas, task transitions, project membership, and role permissions should live in the backend service/domain layer rather than in controllers.

---

# 34. Suggested Spring Package Structure

```text
com.orgaflow
│
├── auth
│   ├── controller
│   ├── service
│   ├── security
│   └── dto
│
├── organization
│   ├── controller
│   ├── service
│   ├── repository
│   ├── model
│   └── dto
│
├── project
│   ├── controller
│   ├── service
│   ├── repository
│   ├── model
│   └── dto
│
├── task
│   ├── controller
│   ├── service
│   ├── repository
│   ├── model
│   └── dto
│
├── comment
├── notification
├── dashboard
├── plan
├── activity
└── common
```

This structure keeps features isolated and allows the application to grow.

---

# 35. CI/CD

The project should use GitHub Actions.

## CI pipeline

Every pull request should run:

```text
Checkout
   ↓
Install dependencies
   ↓
Compile
   ↓
Unit tests
   ↓
Integration tests
   ↓
Static checks
   ↓
Build application
```

## CD pipeline

After merging to the production branch:

```text
GitHub
   ↓
GitHub Actions
   ↓
Build Spring Boot application
   ↓
Build React application
   ↓
Build Docker images
   ↓
Push images to registry
   ↓
Deploy
```

The deployment environment can initially be AWS.

---

# 36. Deployment Architecture

Initial production architecture:

```text
                    Internet
                       │
                       ↓
                  Nginx / Load
                    Balancer
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
        React Frontend      Spring Boot API
                                  │
                                  ↓
                               MongoDB
```

Supporting infrastructure can include:

- AWS EC2 / ECS
- Docker
- Nginx
- MongoDB Atlas
- Object storage for attachments
- GitHub Actions

The exact AWS architecture can be finalized after the MVP.

---

# 37. Observability

The application should support:

- Structured application logs
- Error logging
- Health checks
- Metrics
- Basic application monitoring

Spring Boot Actuator can expose:

- Health
- Metrics
- Application information

Sensitive information must never be logged.

Examples of information that must not be logged:

- Passwords
- JWTs
- Refresh tokens
- Private task content where unnecessary
- Sensitive user information

---

# 38. Non-Functional Requirements

## Performance

Normal API requests should target low-latency responses under expected application load.

Large operations such as reporting, notifications, and file processing should not unnecessarily block request threads.

## Availability

The production system should be designed to recover gracefully from service failures.

## Scalability

The architecture should support growth in:

- Organizations
- Users
- Projects
- Tasks
- Comments
- Notifications

## Security

Authorization must be enforced server-side.

## Maintainability

The backend should use clear separation of concerns and reusable service components.

## Reliability

Critical state transitions must be validated and persisted consistently.

## Privacy

Tenant isolation must be strictly enforced.

---

# 39. MVP Scope

The first release should focus on the core workflow.

### Authentication

- Login
- Logout
- Password reset
- Role-based authentication

### SuperAdmin

- Create organization
- Configure limits
- Activate organization
- Disable organization
- Reset Admin
- View aggregate organization usage

### Admin

- Manage members
- Create projects
- Assign Project Managers
- View projects
- View organization usage

### Project Manager

- View project
- Manage project tasks
- Assign tasks
- Manage Kanban workflow
- Review tasks
- Monitor project progress

### Member

- View assigned tasks
- Update task status
- Submit tasks for review
- Comment

### Shared

- Dashboards
- Kanban board
- Comments
- Activity history
- Basic notifications
- Quota enforcement

---

# 40. Post-MVP Features

Possible future features:

- Email notifications
- Push notifications
- File attachments
- Advanced analytics
- Time tracking
- Recurring tasks
- Task dependencies
- Calendar integration
- Google/Microsoft SSO
- Organization invitations
- Advanced audit logs
- Custom workflows
- Custom roles
- Billing integration
- Stripe subscription management
- Usage-based billing
- Enterprise plans
- API access
- Webhooks
- Mobile application

---

# 41. Business Model

The product can operate as a B2B SaaS platform.

Organizations become customers.

Revenue can be generated through subscription plans based on:

- Number of members
- Number of projects
- Storage
- Advanced features
- Automation limits
- Analytics
- Enterprise capabilities

The SuperAdmin controls the organization's entitlements.

Example:

```text
Customer
    ↓
Organisation
    ↓
Subscription / Plan
    ↓
Limits + Features
    ↓
Resource Usage
```

A future billing system can integrate with the organization and plan model without changing the core project-management domain.

---

# 42. Key Product Workflows

## Workflow A — Organization Creation

```text
SuperAdmin
   ↓
Create Organization
   ↓
Select Plan
   ↓
Configure Limits
   ↓
Create Admin
   ↓
Organization ACTIVE
```

## Workflow B — Member Creation

```text
Admin
   ↓
Add Member
   ↓
Check Member Quota
   ↓
Create Account
   ↓
Member Receives Credentials / Invitation
```

## Workflow C — Project Creation

```text
Admin
   ↓
Create Project
   ↓
Check Project Quota
   ↓
Select Project Manager
   ↓
Assign Project Members
   ↓
Project ACTIVE
```

## Workflow D — Task Execution

```text
Project Manager
      ↓
Create Task
      ↓
Assign Member
      ↓
TODO
      ↓
IN_PROGRESS
      ↓
REVIEW
      ↓
Project Manager Reviews
      ↓
 ┌───────────────┐
 ↓               ↓
DONE         IN_PROGRESS
```

## Workflow E — Organization Deactivation

```text
SuperAdmin
   ↓
Disable Organization
   ↓
Organization becomes DISABLED
   ↓
Users cannot perform normal operations
   ↓
Existing data remains preserved
```

---

# 43. Success Metrics

The first version should track both product usage and business usage.

## Platform Metrics

- Number of organizations
- Active organizations
- Disabled organizations
- Organizations by plan
- Aggregate member count
- Aggregate active project count

## Organization Metrics

- Member utilization
- Project utilization
- Active projects
- Completed projects

## Project Metrics

- Task completion rate
- Overdue task rate
- Review turnaround
- Project completion percentage

## User Metrics

- Tasks completed
- Tasks overdue
- Tasks awaiting review

---

# 44. Acceptance Criteria

The MVP is successful when:

### Tenant Isolation

A user from Organization A cannot access Organization B's projects, tasks, members, or other private information through either the UI or API.

### SuperAdmin Privacy

SuperAdmin can manage organization configuration and aggregate usage but cannot retrieve organization members or internal project/task information.

### Quota Enforcement

Admins cannot exceed organization resource limits.

### Role Enforcement

A Member cannot create projects.

A Project Manager cannot manage another project's tasks.

An Admin cannot manage another organization's data.

A SuperAdmin cannot access internal organization work.

### Task Workflow

Tasks correctly transition through:

```text
TODO → IN_PROGRESS → REVIEW → DONE
```

with unauthorized transitions rejected.

### Project Management

An Admin can create a project and assign its Project Manager.

### Member Management

Only the organization's Admin can add/remove organization members.

### Dashboard Isolation

Each role sees only information appropriate to that role.

---

# 45. Core Domain Model

At a conceptual level, the product consists of:

```text
SuperAdmin
      │
      │ manages
      ↓
Organization
      │
      ├── Plan
      ├── Quotas
      ├── Admin
      └── Members
             │
             └── Project Membership
                      │
                      ↓
                   Project
                      │
                      ├── Project Manager
                      ├── Members
                      └── Tasks
                            │
                            ├── Assignee
                            ├── Comments
                            └── Activity
```

---

# 46. Product Boundary

The first version is intentionally focused on **organization/project/task management**.

It is not intended to become a full enterprise ERP, HRMS, accounting system, or communication platform.

The product's core loop is:

```text
ORGANIZATION
      ↓
PROJECT
      ↓
TASK
      ↓
ASSIGN
      ↓
EXECUTE
      ↓
REVIEW
      ↓
COMPLETE
```

Everything in the MVP should strengthen this workflow.

---

# 47. Recommended Development Phases

## Phase 1 — Foundation

- Spring Boot project setup
- React project setup
- MongoDB connection
- Authentication
- JWT
- Basic user model
- Role system
- Organization model

## Phase 2 — SaaS Administration

- SuperAdmin dashboard
- Organization creation
- Plans
- Quotas
- Organization activation/deactivation
- Admin account management

## Phase 3 — Organization Management

- Admin dashboard
- Member CRUD
- Member quota enforcement
- Project creation
- Project Manager assignment
- Project membership

## Phase 4 — Project Execution

- PM dashboard
- Task CRUD
- Assignment
- Status workflow
- Kanban board
- Deadlines
- Priorities

## Phase 5 — Collaboration

- Comments
- Activity history
- Notifications

## Phase 6 — Production Engineering

- Validation
- Error handling
- Tests
- Docker
- CI/CD
- AWS deployment
- Logging
- Monitoring
- Security hardening

---

# 48. Final Product Definition

**OrgaFlow is a multi-tenant SaaS project management platform that enables organizations to manage their members and projects while maintaining a strict hierarchy of permissions. The platform SuperAdmin manages organizations, plans, and resource quotas without accessing private organizational work. Each organization has an Admin who manages its members and projects. Each project has a Project Manager who manages tasks and reviews work, while Members focus on completing their assigned tasks and collaborating through comments.**

The platform combines:

**Organization Management + Project Management + Task Management + Kanban + Collaboration + Role-Based Access + Quotas + Multi-Tenant Privacy**

using:

**React + Spring Boot + MongoDB + Spring Security + REST APIs + Docker + GitHub Actions + AWS**

The central architectural principle is:

> **The higher-level role manages the scope below it, but privacy boundaries remain explicit.**

The result is not simply a Todo application. It is a **role-aware, quota-driven, multi-tenant SaaS platform** designed around a realistic B2B organization and project-management workflow.