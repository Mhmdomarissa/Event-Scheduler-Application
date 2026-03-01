# API Contract

**Version:** 5.0.0  
**Base URL:** `http://localhost:3000`  
**Authentication:** `Authorization: Bearer <Firebase_ID_Token>`

All responses follow the envelope:
```json
{ "success": true, "message": "...", "data": ..., "meta": { ... } }
```

---

## Auth

### `GET /api/auth/me`
Returns the authenticated user's profile.

**Response 200:**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "id": "665f...",
    "firebaseUid": "abc123",
    "email": "user@example.com",
    "displayName": "Alice",
    "role": "member",
    "isActive": true
  }
}
```

---

## Events

### `POST /api/events`
Create a new event.

**Request:**
```json
{
  "title": "Team Sync",
  "description": "Weekly sync meeting",
  "location": "Conference Room A",
  "startAt": "2026-04-01T09:00:00.000Z",
  "endAt": "2026-04-01T10:00:00.000Z",
  "visibility": "shared",
  "ignoreConflicts": false
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": { "_id": "...", "title": "Team Sync", "lifecycle": "upcoming", ... }
}
```

**Error 409 (conflict):**
```json
{
  "success": false,
  "message": "Event conflicts with 1 existing event(s): \"Stand-up\" (2026-04-01T08:30:00Z – 2026-04-01T09:30:00Z). Pass ignoreConflicts=true to bypass.",
  "code": "EVENT_CONFLICT"
}
```

---

### `GET /api/events`
List events (created by user OR user is invited to).

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 20, max 100) |
| `search` | string | Full-text search on title/description/location |
| `location` | string | Regex filter on location |
| `status` | `upcoming\|ongoing\|past` | Lifecycle filter |
| `startFrom` | ISO datetime | Events starting on or after |
| `startTo` | ISO datetime | Events starting on or before |

**Response 200:**
```json
{
  "success": true,
  "message": "Events retrieved",
  "data": [...],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```

---

### `GET /api/events/:id`
Get a single event. Caller must be creator or invitee.

**Response 200:** Event object.  
**Error 403:** Not creator or invitee.  
**Error 404:** Event not found.

---

### `PATCH /api/events/:id`
Update an event. Caller must be creator or admin.

**Request (partial):**
```json
{ "title": "Updated Title", "startAt": "2026-04-01T10:00:00.000Z" }
```

---

### `DELETE /api/events/:id`
Soft-delete an event. Caller must be creator or admin.  
**Response:** 204 No Content.

---

### `POST /api/events/:id/invite`
Invite users by email list.

**Request:**
```json
{ "emails": ["alice@example.com", "bob@example.com"] }
```

**Response 201:**
```json
{
  "success": true,
  "message": "Invitations processed",
  "data": [
    { "email": "alice@example.com", "status": "invited", "invitationId": "..." },
    { "email": "bob@example.com", "status": "duplicate" }
  ]
}
```

---

### `GET /api/events/:id/attendees`
List invitees with RSVP statuses. Caller must be creator or invitee.

**Response 200:** Paginated list of invitation objects with populated user info.

---

## Invitations

### `GET /api/invitations`
List the calling user's received invitations (paginated).

---

### `POST /api/invitations/:id/respond`
Respond to an invitation.

**Request:**
```json
{ "status": "attending" }
```
Valid values: `attending`, `maybe`, `declined`.

**Response 200:** Updated invitation object.  
**Error 403:** Not the invitee.

---

## AI

### `POST /api/ai/parse-event`
Parse natural language into structured event fields.

**Request:**
```json
{ "text": "Lunch with Sarah at The Bistro next Friday at noon for 1 hour" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Event parsed from text",
  "data": {
    "title": "Lunch with Sarah",
    "location": "The Bistro",
    "startAt": "2026-03-06T12:00:00.000Z",
    "endAt": "2026-03-06T13:00:00.000Z",
    "confidence": 0.92,
    "missingFields": []
  }
}
```

**Error 503:** OPENAI_API_KEY not configured.

---

### `POST /api/ai/suggest-times`
Find free time slots in a date range.

**Request:**
```json
{
  "title": "Design Review",
  "durationMinutes": 60,
  "dateRangeStart": "2026-04-01T00:00:00.000Z",
  "dateRangeEnd": "2026-04-07T23:59:59.000Z",
  "timezone": "America/New_York"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Time suggestions generated",
  "data": [
    {
      "startAt": "2026-04-01T08:00:00.000Z",
      "endAt":   "2026-04-01T09:00:00.000Z",
      "explanation": "Early morning Tuesday – good for focus work."
    },
    ...
  ]
}
```

---

## Health

### `GET /health`
No authentication required.

**Response 200 (ok):**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "uptime": 3600,
  "services": { "database": "connected" }
}
```

**Response 503 (degraded):**
```json
{ "success": false, "status": "degraded", "services": { "database": "disconnected" } }
```

---

## Error Codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Zod schema validation failed |
| 400 | `INVALID_DATE_RANGE` | startAt ≥ endAt |
| 401 | — | Missing or invalid Firebase token |
| 403 | `INSUFFICIENT_ROLE` | User lacks required role |
| 403 | — | Resource access denied |
| 404 | — | Resource not found |
| 409 | `EVENT_CONFLICT` | Overlapping event detected |
| 409 | — | Duplicate invitation |
| 429 | — | Rate limit exceeded |
| 503 | `AI_UNAVAILABLE` | OPENAI_API_KEY missing |
| 503 | `AI_API_ERROR` | OpenAI request failed |
