# Schedula — Event Scheduler Application

> A production-grade full-stack event scheduling platform with AI-powered planning, real-time RSVP management, and role-based access control.

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://event-scheduler-application-beta.vercel.app)
[![Live Backend](https://img.shields.io/badge/Backend-Railway-purple?logo=railway)](https://event-scheduler-application-production.up.railway.app/health)

---

## Live Demo

| Service  | URL |
|----------|-----|
| Frontend | [event-scheduler-application-beta.vercel.app](https://event-scheduler-application-beta.vercel.app) |
| Backend  | [event-scheduler-application-production.up.railway.app](https://event-scheduler-application-production.up.railway.app/health) |

**Demo accounts** — sign up with any email/password, or use Google OAuth on the frontend.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@test.com` | `mkmkpoiu` |
| **Member** | _(sign up with any email — accounts are created instantly)_ | |

> The admin account has full access: edit, delete, and invite on any event. Sign up as a new user to test the member experience.

---

## Features

### Core
- **Event Management** — Create, edit, soft-delete events with title, description, location, date/time, and visibility (private / shared)
- **Conflict Detection** — Automatic overlap detection with 409 response; opt-in `ignoreConflicts` bypass
- **Smart Filtering** — Search by title (full-text), date range, location, and lifecycle status (upcoming / ongoing / past)
- **Invitation System** — Invite users by email (works even before they sign up); compound unique index prevents duplicates
- **RSVP** — Attendees respond with Attending / Maybe / Declined; status tracked per-invitation
- **Pagination** — Cursor-based pagination on all list endpoints

### AI-Powered
- **Natural Language Parsing** — `POST /api/ai/parse-event` converts free-text like _"Team standup every Monday 10am for 30 min at Room 3"_ into structured event fields using OpenAI
- **Smart Time Suggestions** — `POST /api/ai/suggest-times` finds optimal free slots in a date range using pure algorithmic analysis, with optional AI-generated explanations
- **AI Planner UI** — Frontend page where users describe an event, pick a date range, and get AI-suggested time slots with one-click event creation

### Security & Infrastructure
- **Firebase Authentication** — Email/password + Google OAuth; backend validates Firebase JWTs with revocation check
- **RBAC** — `member` and `admin` roles; admins can edit/delete/invite on any event
- **Helmet + CSP** — `default-src 'none'` for API-only backend
- **CORS** — Deny-all in production unless explicitly allowed
- **Rate Limiting** — Tiered limits: general (100/15m), AI (20/15m), auth (30/15m), admin (200/15m)
- **Input Validation** — Zod schemas on every endpoint (body, query, params)
- **Request Logging** — Winston with sensitive-field redaction; no tokens logged
- **Graceful Shutdown** — Handles SIGTERM/SIGINT cleanly

### Frontend
- **Modern Stack** — Next.js 16 App Router + Tailwind CSS v4 + shadcn/ui
- **Dark / Light Mode** — System-aware theme toggle on every page
- **Responsive** — Mobile-first design with collapsible navigation
- **Real-time Data** — React Query with automatic caching, retry logic, and optimistic updates
- **Google OAuth** — One-click Google sign-in alongside email/password
- **Profile Page** — View account details, role, auth provider, member-since date
- **Admin UI** — Admin badge, ability to manage any event from the detail page

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui v4 |
| **State / Data** | TanStack React Query v5, React Hook Form, Zod |
| **Auth (Client)** | Firebase JS SDK (email/password + Google OAuth) |
| **Animation** | Framer Motion |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | MongoDB Atlas + Mongoose ODM |
| **Auth (Server)** | Firebase Admin SDK (JWT verification) |
| **AI** | OpenAI API (gpt-4o-mini) |
| **Deployment** | Vercel (frontend) + Railway (backend) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                      │
│  Next.js 16 · React Query · Firebase JS SDK · shadcn/ui  │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS (Bearer token)
┌────────────────────────▼─────────────────────────────────┐
│                    Backend (Railway)                      │
│  Express 5 · TypeScript · Firebase Admin · Zod · Winston  │
│                                                           │
│  Routes → Controllers → Services → Repositories → DB     │
└───────────┬───────────────────────────────────┬──────────┘
            │                                   │
   ┌────────▼────────┐                ┌─────────▼─────────┐
   │  MongoDB Atlas   │                │   OpenAI API      │
   │  (Event, User,   │                │   (NL parsing,    │
   │   Invitation)    │                │    explanations)   │
   └─────────────────┘                └───────────────────┘
```

### Backend Source Structure

```
backend/src/
├── config/          # database.ts, firebase.ts
├── models/          # User, Event, Invitation (Mongoose schemas + indexes)
├── repositories/    # DB access layer
├── services/        # Business logic (event, invitation, ai)
├── controllers/     # HTTP layer
├── routes/          # Express routers
├── middleware/       # authenticate, requireRole, validate, rateLimiter, requestLogger
├── utils/           # AppError, asyncHandler, response, pagination, date, logger, schemas
├── app.ts           # Express app setup
└── server.ts        # HTTP server + graceful shutdown
```

### Frontend Source Structure

```
frontend/
├── app/             # Next.js pages (landing, login, signup, dashboard, events, invitations, planner, profile)
├── components/      # UI components (layout, landing, shared, ui)
├── features/        # Feature modules (auth, events, invitations, ai) — services + hooks + components
├── lib/             # API client, Firebase init, env config, utilities
└── types/           # TypeScript domain types
```

---

## API Overview

All endpoints (except `/health`) require a valid Firebase ID token in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (200 ok / 503 degraded) |
| `GET` | `/api/auth/me` | Current user profile + role |
| `POST` | `/api/events` | Create event |
| `GET` | `/api/events` | List events (owned + invited); supports search, filters, pagination |
| `GET` | `/api/events/:id` | Get event detail |
| `PATCH` | `/api/events/:id` | Update event (owner or admin) |
| `DELETE` | `/api/events/:id` | Soft delete (owner or admin) |
| `POST` | `/api/events/:id/invite` | Invite by email list |
| `GET` | `/api/events/:id/attendees` | Attendee list with RSVP status |
| `GET` | `/api/invitations` | My received invitations |
| `POST` | `/api/invitations/:id/respond` | RSVP: attending / maybe / declined |
| `POST` | `/api/ai/parse-event` | NL → structured event fields |
| `POST` | `/api/ai/suggest-times` | Find optimal free time slots |

Full API contract with request/response schemas: [docs/06-api-contract.md](docs/06-api-contract.md)

---

## Local Setup

### Prerequisites

- Node.js >= 20
- A Firebase project with Authentication enabled (Email/Password + Google)
- MongoDB (local or Atlas connection string)
- (Optional) OpenAI API key for AI features

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID
npm install
npm run dev          # starts on http://localhost:3000 with hot-reload
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local — set all NEXT_PUBLIC_* variables
npm install
npm run dev          # starts on http://localhost:3000
```

### Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` or `production` (default: development) |
| `PORT` | No | HTTP port (default: 3000) |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | One of two | Stringified service-account JSON |
| `FIREBASE_PROJECT_ID` | One of two | Firebase project ID (for ADC / emulator) |
| `ALLOWED_ORIGINS` | Recommended | Comma-separated CORS origins |
| `OPENAI_API_KEY` | No | Enables AI features; endpoints return 503 if missing |
| `OPENAI_MODEL` | No | OpenAI model name (default: `gpt-4o-mini`) |
| `LOG_LEVEL` | No | Winston log level (default: `debug` dev / `info` prod) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend URL (Railway or localhost) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | **Yes** | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | **Yes** | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | **Yes** | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | **Yes** | Firebase app ID |

> **Note:** `NEXT_PUBLIC_*` variables are embedded in the client bundle at build time. They are _not_ secrets — they are the same public keys you'd put in a `<script>` tag. Server secrets (service accounts, OpenAI keys) live only in the backend `.env`.

---

## Testing

### Postman Collection

The `postman/` folder contains a comprehensive collection covering all 13 endpoints with **25+ automated assertions**.

#### Setup

1. Import `postman/EventScheduler_v5.postman_collection.json` into Postman
2. Import `postman/EventScheduler_v5.postman_environment.json`
3. Set these environment variables:

| Variable | Value |
|----------|-------|
| `firebase_api_key` | Your Firebase Web API key |
| `admin_email` / `admin_password` | Credentials of a user with `role: "admin"` |
| `member_email` / `member_password` | Credentials of a regular user |

4. Run folders top-to-bottom: **Health -> Auth -> Events -> Invitations -> AI -> Teardown**

Tokens are auto-refreshed via a collection-level pre-request script. All other variables (`event_id`, `invitation_id`, etc.) are auto-populated by test scripts.

> **Promote a user to admin:**
> ```bash
> mongosh event-scheduler --eval "db.users.updateOne({email:'admin@example.com'},{\$set:{role:'admin'}})"
> ```

### Bash Integration Script

```bash
export TOKEN="<admin_firebase_id_token>"
export MEMBER_TOKEN="<member_firebase_id_token>"
export BASE_URL="https://event-scheduler-application-production.up.railway.app"
chmod +x test-api.sh && ./test-api.sh
```

Outputs color-coded `[PASS]` / `[FAIL]` / `[SKIP]` results with a final summary.

---

## Deployment

### Backend -> Railway

1. Connect your GitHub repo to [Railway](https://railway.com)
2. Set root directory to `backend`
3. Add all backend env vars (see table above)
4. Set `ALLOWED_ORIGINS` to include your Vercel frontend URL
5. Railway auto-builds on push via `npm run build` + `npm start`

### Frontend -> Vercel

1. Import the repo at [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add all `NEXT_PUBLIC_*` env vars
4. Vercel auto-deploys on push

---

## Security Notes

- **No secrets in version control** — all `.env*` files are gitignored; `.env.example` files provide templates
- **Firebase JWT verification** with token revocation check on every request
- **Helmet** with strict CSP (`default-src 'none'`) for API-only backend
- **CORS** explicitly locked to allowed origins in production
- **Rate limiting** with separate tiers per endpoint category
- **Zod validation** on all inputs — no unvalidated data reaches business logic
- **Sensitive-field redaction** in all log output (passwords, tokens, keys)
- **Soft delete** — events are never physically removed from the database

---

## Documentation

| Document | Description |
|----------|-------------|
| [Requirements](docs/01-requirements.md) | Functional + non-functional requirements |
| [Database Design](docs/03-database-design.md) | Schemas, indexes, relationships |
| [Security](docs/04-security.md) | Auth, CORS, rate limiting, validation, logging |
| [API Contract](docs/06-api-contract.md) | Full endpoint specs with request/response schemas |

---

## How AI Tools Were Used

This project used AI assistance (GitHub Copilot / Claude) during development for:

- **Code scaffolding** — generating boilerplate for Express routes, Mongoose models, React components, and shadcn/ui layouts
- **Debugging** — diagnosing deployment issues (CORS configuration, Next.js env var inlining, Firebase auth flows)
- **Documentation** — drafting README sections, API contract tables, and inline code comments
- **Testing** — building the Postman collection with automated pre-request scripts and assertions

All AI-generated code was reviewed, tested, and adapted to fit the project's architecture. The core business logic (conflict detection, invitation linking, RBAC checks, AI prompt engineering) was designed and validated by the developer.

---

## License

MIT