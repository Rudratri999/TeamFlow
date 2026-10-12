# Project API Reference

This document lists endpoints defined in `app/routers/projects.py` for frontend integration.

## Base path and authentication

The router is mounted at `/projects`. The route decorators also begin with `/organizations`, so the actual paths are prefixed with `/projects/organizations/...`. The app configures `root_path="/api"` for its proxy deployment; depending on the proxy setup, the externally visible URL may include `/api` before these paths.

All endpoints require the authenticated user's `access_token` cookie. The caller must belong to the organization. Creating a project is allowed for any organization member. Updating and deleting projects require the `admin` or `owner` role.

## Endpoints

| Method | Path | Request | Response / access |
|---|---|---|---|
| `POST` | `/projects/organizations/{organization_id}/projects` | `{ "name": "...", "description": "...", "organization_id": 123 }` | Created project; caller must be a member. The body `organization_id` is required by the schema, but the handler uses the URL ID instead. |
| `GET` | `/projects/organizations/{organization_id}/projects` | — | List of projects for that organization; caller must be a member. |
| `GET` | `/projects/organizations/{organization_id}/projects/{project_id}` | — | One project; caller must be a member. |
| `PATCH` | `/projects/organizations/{organization_id}/projects/{project_id}` | `{ "name": "...", "description": "..." }` | Updated project; `admin` or `owner`. `name` is required by the update schema; `description` may be omitted or set to `null`. |
| `DELETE` | `/projects/organizations/{organization_id}/projects/{project_id}` | — | `{ "message": "Project Deleted Successfully" }`; `admin` or `owner`. Deleting the project also deletes its tasks through the model cascade. |

## Project object

Project responses contain:

```json
{
  "id": 1,
  "name": "Website redesign",
  "description": "Optional project details",
  "organization_id": 123,
  "created_at": "2026-09-30T12:00:00Z",
  "updated_at": "2026-09-30T12:00:00Z"
}
```

`description` may be `null`. Create, list, and update declare `ProjectResponse` response schemas. The single-project endpoint returns the ORM object without an explicit response schema, but uses the same project fields.

## Errors and integration notes

- `403 Forbidden`: caller is not a member, or lacks the required role.
- `404 Not Found`: project does not exist in the specified organization.
- The create endpoint returns FastAPI's default success status (`200`), not `201`.
- For create requests, send `organization_id` in the JSON body to satisfy validation, and ensure it matches the organization ID in the URL. The handler currently ignores the body's value and associates the project with the URL organization.
- For partial updates, `name` must still be included. Omitting `description` preserves its current value; sending `"description": null` clears it.
