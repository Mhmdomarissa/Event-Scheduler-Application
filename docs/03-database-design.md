# Database Design

**Version:** 5.0.0  
**Date:** 2026-03-01

---

## Collections

### `users`

Stores application users, created on first Firebase login.

```
{
  _id:          ObjectId,
  firebaseUid:  String  (unique, indexed),
  email:        String  (unique, lowercase, indexed),
  displayName:  String,
  role:         "member" | "admin"  (indexed),
  isActive:     Boolean  (indexed, default true),
  lastLoginAt:  Date,
  createdAt:    Date,
  updatedAt:    Date
}
```

**Indexes:**
- `{ firebaseUid: 1 }` unique
- `{ email: 1 }` unique
- `{ role: 1, isActive: 1 }` compound

---

### `events`

Stores events. RSVP data is not embedded (see design rationale in Invitation.ts).

```
{
  _id:          ObjectId,
  title:        String  (2–200 chars, text-indexed w/ weight 10),
  description:  String  (optional, 5000 chars max, text-indexed w/ weight 1),
  location:     String  (optional, 500 chars max, text-indexed w/ weight 5),
  startAt:      Date  (indexed),
  endAt:        Date  (indexed),
  createdBy:    ObjectId → users  (indexed),
  visibility:   "private" | "shared",
  isDeleted:    Boolean  (indexed, soft-delete flag),
  deletedAt:    Date  (set on soft delete),
  createdAt:    Date,
  updatedAt:    Date
}
```

**Indexes:**
- `{ createdBy: 1, isDeleted: 1 }` compound  — primary query pattern
- `{ startAt: 1, endAt: 1 }` — date-range queries & conflict detection
- `{ title: "text", description: "text", location: "text" }` text index w/ weights
- `{ isDeleted: 1 }` — to exclude soft-deleted docs

**Virtual fields (not stored):**
- `lifecycle` → computed from `startAt`/`endAt` vs `Date.now()`

---

### `invitations`

Stores per-user RSVP invitations.

**Design rationale – separate collection vs. embedding:**
1. `GET /api/invitations` queries across ALL events efficiently.
2. Popular events with thousands of invitees would breach the 16 MB document limit if embedded.
3. Atomic RSVP updates touch only the single invitation document.
4. Compound unique index `(eventId, email)` is trivially enforced.

```
{
  _id:             ObjectId,
  eventId:         ObjectId → events  (indexed),
  email:           String  (lowercase),
  inviteeUserId:   ObjectId → users  (sparse index; null until user signs up),
  invitedBy:       ObjectId → users,
  status:          "invited" | "attending" | "maybe" | "declined"  (indexed),
  respondedAt:     Date,
  createdAt:       Date,
  updatedAt:       Date
}
```

**Indexes:**
- `{ eventId: 1, email: 1 }` unique compound — duplicate-invite guard
- `{ inviteeUserId: 1 }` sparse — user's invitations lookup
- `{ status: 1 }` — filter by RSVP status
- `{ eventId: 1 }` — attendee list per event

---

## Entity-Relationship Diagram

```
users ──── (1:N) ──── events
  │                     │
  │                     │ (1:N)
  │                     ▼
  └── (1:N) ──── invitations ────── (N:1) ──── users
                  (email)                     (inviteeUserId, nullable)
```

---

## Conflict Detection Query

Overlap condition (standard Allen's interval algebra):
```
existingStart < newEnd  AND  existingEnd > newStart
```

MongoDB query:
```js
{
  createdBy:  userId,
  isDeleted:  false,
  startAt:    { $lt: newEnd },
  endAt:      { $gt: newStart }
}
```
