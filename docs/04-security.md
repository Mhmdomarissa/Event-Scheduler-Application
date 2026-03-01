# Security Design

**Version:** 5.0.0  
**Date:** 2026-03-01

---

## Authentication

- **Provider:** Firebase Authentication (ID token via Bearer JWT)
- **Verification:** `firebase-admin` SDK verifies signature + expiry + revocation
- **User linkage:** On every authenticated request, user is upserted in MongoDB by `firebaseUid`
- **Token never logged:** The `requestLogger` and Winston redactor strip `authorization`, `token`, `idToken`, etc.

---

## Authorization (RBAC)

| Role | Description |
|------|-------------|
| `member` | Default role. Can create events, invite others, respond to invitations. |
| `admin` | Can edit or delete any event, regardless of ownership. |

Guards are enforced by the `requireRole()` middleware factory and additionally by service-layer checks.

### Resource-level access rules

| Resource | Read | Write |
|----------|------|-------|
| Any event | Creator OR invitee | Creator OR admin |
| Invitation (RSVP) | Owner (inviteeUserId) | Owner only |
| Attendee list | Creator OR invitee | — |
| AI endpoints | Any authenticated user | — |

---

## Security Headers (Helmet)

```
Content-Security-Policy: default-src 'none'
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-Powered-By: (removed)
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-XSS-Protection: 1; mode=block
```

---

## CORS

- Allowlist configured via `ALLOWED_ORIGINS` environment variable (comma-separated).
- In production, if `ALLOWED_ORIGINS` is empty, **all cross-origin requests are denied**.
- In development with empty `ALLOWED_ORIGINS`, all origins are allowed (convenience only).

---

## Rate Limiting

| Limiter | Endpoint | Window | Max |
|---------|----------|--------|-----|
| `authLimiter` | `/api/auth` | 15 min | 30 |
| `generalLimiter` | `/api/events`, `/api/invitations` | 15 min | 100 |
| `aiLimiter` | `/api/ai` | 15 min | 20 |
| `adminLimiter` | Admin-only routes | 15 min | 200 |

All limit violations return `429 Too Many Requests` with a JSON envelope.

---

## Input Validation

- **Zod** schemas validate all request bodies, query parameters, and URL params.
- MongoDB ObjectId params validated with regex `/^[a-f\d]{24}$/i`.
- ISO-8601 date strings enforced with `z.string().datetime()`.
- Max lengths enforced on all string fields.

---

## Sensitive Data Handling

- Winston logger includes a recursive **redaction middleware** that replaces the following keys with `[REDACTED]` at any depth: `password`, `token`, `authorization`, `x-api-key`, `firebaseToken`, `idToken`, `accessToken`, `refreshToken`, `secret`, `creditCard`, `ssn`.
- MongoDB URI credentials masked in connection logs.

---

## Environment Variables

See `.env.example` for the full list. Never commit `.env` to source control.

---

## Soft Delete

Events are never physically deleted. The `isDeleted` flag and `deletedAt` timestamp are set instead. All queries exclude `isDeleted: true` by default.
