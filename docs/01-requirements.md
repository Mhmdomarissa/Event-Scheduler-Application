# Event Scheduler Application – Requirements

**Version:** 5.0.0  
**Date:** 2026-03-01  
**Status:** Implemented

---

## 1. Overview

The Event Scheduler Application is a production-grade backend API that allows authenticated users to create, manage, and share calendar events with full RSVP support and AI-assisted scheduling.

---

## 2. Functional Requirements

### 2.1 Authentication & User Management

| ID | Requirement |
|----|-------------|
| F-01 | System authenticates users via Firebase ID tokens (Bearer JWT). |
| F-02 | Users are created on first login via upsert (firebaseUid + email). |
| F-03 | `GET /api/auth/me` returns the caller's profile and role. |
| F-04 | Roles: `member` (default) and `admin`. |
| F-05 | Deactivated accounts (isActive=false) receive 403. |

### 2.2 Event Management

| ID | Requirement |
|----|-------------|
| F-10 | `POST /api/events` – create an event with title, description, location, startAt, endAt, visibility. |
| F-11 | `GET /api/events` – list events the caller created OR is invited to. |
| F-12 | `GET /api/events/:id` – get a single event (creator or invitee only). |
| F-13 | `PATCH /api/events/:id` – update event (creator or admin only). |
| F-14 | `DELETE /api/events/:id` – soft delete (creator or admin only). |
| F-15 | Events support `visibility: "private" | "shared"`. |
| F-16 | Events can be searched by title (full-text), date range, location, and lifecycle status. |
| F-17 | `startAt` must be before `endAt`; both must be ISO-8601 strings. |
| F-18 | Title must be at least 2 characters. |
| F-19 | Conflict detection: creating/updating checks for overlapping events by the same owner; returns 409 unless `ignoreConflicts=true`. |
| F-20 | Lifecycle computed in real-time: `upcoming` / `ongoing` / `past` (not stored). |

### 2.3 Invitation & RSVP

| ID | Requirement |
|----|-------------|
| F-30 | `POST /api/events/:id/invite` – invite one or more email addresses. |
| F-31 | Invitations work for users who don't have an account yet; linked on first login. |
| F-32 | No duplicate invitations: compound unique index on (eventId, email). |
| F-33 | `GET /api/events/:id/attendees` – list invitees with RSVP statuses. |
| F-34 | `GET /api/invitations` – list calling user's received invitations. |
| F-35 | `POST /api/invitations/:id/respond` – RSVP: `attending` / `maybe` / `declined`. |
| F-36 | RSVP status never stored globally on event; only per-invitation. |

### 2.4 AI Features

| ID | Requirement |
|----|-------------|
| F-40 | `POST /api/ai/parse-event` – parse natural language into structured event fields. Output never auto-saved. |
| F-41 | Output validated with Zod before returning to client. |
| F-42 | 503 returned if OPENAI_API_KEY is not configured. |
| F-43 | `POST /api/ai/suggest-times` – find top 3 free time slots in a date range. |
| F-44 | Free-slot logic is pure algorithmic (no LLM required). |
| F-45 | Optional AI explanation appended to each slot if OPENAI_API_KEY is set. |

---

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF-01 | All responses use standard envelope `{ success, message, data, meta? }`. |
| NF-02 | All inputs validated with Zod (body, query, params). |
| NF-03 | Request logger records method / path / status / latency / userId (no tokens). |
| NF-04 | Rate limiting: general (100/15min), AI (20/15min), auth (30/15min), admin (200/15min). |
| NF-05 | Helmet configured for API-only with CSP `default-src 'none'`. |
| NF-06 | CORS restricted to ALLOWED_ORIGINS; deny-all in production if unset. |
| NF-07 | Graceful shutdown on SIGTERM / SIGINT. |
| NF-08 | `GET /health` returns 200 (ok) or 503 (degraded) based on DB state. |
| NF-09 | TypeScript strict mode. |
| NF-10 | MongoDB connection with 5-retry back-off. |
