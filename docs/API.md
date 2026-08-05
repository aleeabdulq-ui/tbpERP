# TBP ERP — API reference

Base URL: `/api/v1`. All routes (except login, refresh, forgot/reset password) require an `Authorization: Bearer <accessToken>` header. Errors are shaped as `{ "error": { "code", "message", "details?" } }`.

## Auth `/auth`
| Method | Path | Notes |
|---|---|---|
| POST | `/login` | `{ email, password, rememberMe }` → `{ accessToken, csrfToken, user }` + HttpOnly refresh cookie |
| POST | `/refresh` | Rotates session; requires `x-csrf-token` header matching the CSRF cookie |
| POST | `/logout` | Revokes the current refresh token |
| POST | `/forgot-password` | Queues a reset (dev: token in `x-reset-token` response header) |
| POST | `/reset-password` | `{ token, password }` — min 12 chars, mixed case + digit |

## Core modules
| Prefix | Key endpoints |
|---|---|
| `/dashboard` | `GET /` — role-shaped metrics, panels, trend, notifications |
| `/profile` | `GET/PATCH /`, `POST /avatar` (multipart image) |
| `/notifications` | `GET /`, `PATCH /:id/read`, `POST /read-all` |
| `/messages` | `GET /?box=inbox\|sent\|announcements`, `GET /audiences`, `POST /`, `PATCH /:id/read`, `GET /events/live` (SSE) |
| `/admin` | `GET /roles`, `PATCH /roles/:id` (requires `roles:manage`) |

## HR `/hr`
| Endpoint | Purpose |
|---|---|
| `GET/POST /employees`, `PATCH /employees/:id` | Directory + staff records (`employees:read/manage`, `staff_records:manage`) |
| `POST /employees/:id/avatar` · `POST/GET /employees/:id/signature` | Employee image & signature |
| `GET/POST /employees/:id/payment-structure` | Pay history; field visibility depends on `payment_structure:*`, `hourly_rate:read`, `own_net_pay:read` |
| `GET/POST /leave`, `POST /leave/preview`, `PATCH /leave/:id/review`, `GET /leave/holidays` | Leave with holiday-aware scheduling |
| `GET /payroll`, `GET /benefits` | Own payslips & benefits |
| `GET/POST /training`, `POST /training/:id/enroll`, `PATCH /training/:tid/employees/:eid` | Training programs & progress |

## Work `/tasks`, `/projects`, `/reports`
- `GET/POST /tasks`, `PATCH /:id`, `POST /:id/accept|submit|review`, `POST /:id/comments`, attachments upload/download, `POST /reminders/process`. Creates honor the `Idempotency-Key` header.
- `GET/POST /projects`, `PATCH /:id`, `POST /:id/milestones`.
- `GET /reports/overview` — scoped by the caller's report permissions.

Seeded demo logins (password `Password123!`): `admin@tbp.ng`, `hr@tbp.ng`, `finance@tbp.ng`, `projects@tbp.ng`, `architect@tbp.ng`.
