# Organization API Reference

This document lists endpoints defined in `app/routers/organizations.py` for frontend integration.

## Base path and authentication

The router is mounted at `/organizations`. Several route decorators also begin with `/organizations`, so their actual paths contain the segment twice. The paths below show the routes as registered by FastAPI. The app configures `root_path="/api"` for its proxy deployment; depending on the proxy setup, the externally visible URL may include `/api` before these paths.

All endpoints require the authenticated user's `access_token` cookie. Organization-scoped endpoints generally require the caller to be a member. Administrative operations require the role noted below.

## Organizations and members

| Method | Path | Request | Response / access |
|---|---|---|---|
| `POST` | `/organizations/create-organization` | `{ "name": "..." }` | Organization `{id, name, created_at}`; creator becomes `owner`. |
| `GET` | `/organizations/organizations` | — | Organizations the caller belongs to. |
| `GET` | `/organizations/organizations/{organization_id}` | — | One organization; caller must be a member. |
| `PATCH` | `/organizations/organizations/{organization_id}` | `{ "name": "..." }` | Updated organization; `admin` or `owner`. |
| `DELETE` | `/organizations/organizations/{organization_id}` | — | Success message; `owner` only. |
| `GET` | `/organizations/organizations/{organization_id}/members` | — | Membership records; caller must be a member. |
| `GET` | `/organizations/organizations/{organization_id}/members/details` | — | Joined membership records; caller must be a member. |
| `POST` | `/organizations/organizations/{organization_id}/members` | `{ "user_id": 123 }` | Creates a `member` membership; `admin` or `owner`. |
| `DELETE` | `/organizations/organizations/{organization_id}/members/{user_id}` | — | Removes a member; `admin` or `owner`. The owner cannot be removed. |
| `PATCH` | `/organizations/organizations/{organization_id}/members/{user_id}/role` | `{ "role": "admin" }` or `{ "role": "member" }` | Updated membership; `admin` or `owner`. |
| `DELETE` | `/organizations/organizations/{organization_id}/leave` | — | Caller leaves; owners cannot leave. |
| `PATCH` | `/organizations/organizations/{organization_id}/owner` | `{ "user_id": 123 }` | Transfers ownership; current owner only. |

## Dashboard and organization queries

| Method | Path | Request | Response |
|---|---|---|---|
| `GET` | `/organizations/organizations/{organization_id}/dashboard` | — | Counts: `{ "members": n, "projects": n, "tasks": n }`. Cached. |
| `GET` | `/organizations/organizations/{organization_id}/tasks/summary` | — | Counts by status: `todo`, `in_progress`, `done`. |
| `GET` | `/organizations/organizations/{organization_id}/tasks/priority-summary` | — | Counts by priority: `low`, `medium`, `high`. |
| `GET` | `/organizations/organizations/{organization_id}/tasks/overdue` | — | Incomplete tasks due before today. |
| `GET` | `/organizations/organizations/{organization_id}/tasks/unassigned` | — | Tasks without an assignee. |
| `GET` | `/organizations/organizations/{organization_id}/tasks/due-soon` | — | Incomplete tasks due today through the next seven days. |
| `GET` | `/organizations/organizations/{organization_id}/tasks/recent` | — | 10 newest-created tasks. |
| `GET` | `/organizations/organizations/{organization_id}/tasks/recent-updated` | — | 10 most recently updated tasks. |
| `GET` | `/organizations/organizations/{organization_id}/tasks/search?query=...` | Query parameter `query` | Tasks matching the title; returns `404` if none match. |
| `GET` | `/organizations/organizations/{organization_id}/projects/search?query=...` | Query parameter `query` | Projects matching the name; returns `404` if none match. |
| `GET` | `/organizations/organizations/{organization_id}/my_tasks` | — | Tasks assigned to the caller; returns `404` if none. |
| `GET` | `/organizations/organizations/{organization_id}/my_projects` | — | Projects in the organization. |
| `GET` | `/organizations/organizations/{organization_id}/users/{user_id}/tasks` | — | Tasks assigned to a member; `admin` or `owner`; returns `404` if none. |

## Task actions

| Method | Path | Request | Response / access |
|---|---|---|---|
| `GET` | `/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}` | — | One task in the specified project. |
| `PATCH` | `/organizations/organizations/{organization_id}/projects/{project_id}/task/{task_id}/assignee` | `{ "user_id": 123 }` | Updated task with assignee. Note the path uses singular `task`. |
| `PATCH` | `/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/unassign` | — | Updated task with no assignee. |
| `PATCH` | `/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/status` | `{ "status": "todo" }` | Updated task. Allowed values: `todo`, `in_progress`, `done`. |
| `PATCH` | `/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/priority` | `{ "priority": "medium" }` | Updated task. Allowed values: `low`, `medium`, `high`. |

## Common response shapes

Organization objects contain `id`, `name`, and `created_at`.

Membership records contain `id`, `user_id`, `organization_id`, `role`, and `created_at`.

Task objects contain `id`, `project_id`, `title`, `description`, `status`, `assignee_id`, `priority`, `due_date`, `created_at`, and `updated_at`.

Errors are returned in FastAPI's usual form, for example `{ "detail": "Forbidden" }`.

## Integration notes

- The assignment handler appears to compare `Membership.user_id` against the request model itself rather than `assign_user.user_id`. Verify/fix this before relying on the assignee endpoint.
- Most query and task endpoints return ORM objects without an explicit response schema. Confirm the exact serialized payloads through the running API or OpenAPI docs before depending on nested fields.
