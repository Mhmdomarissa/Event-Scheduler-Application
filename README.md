# Event Scheduler Application – Version 5

Production-grade **Node.js + Express 5 + TypeScript + MongoDB + Firebase Auth** backend with RBAC, AI scheduling features, validation, logging, and security hardening.

---

## Architecture

```
Routes → Controller → Service → Repository → DB (Mongoose)
```

```
backend/src/
├── config/          # database.ts, firebase.ts
├── models/          # User, Event, Invitation (Mongoose schemas + indexes)
├── repositories/    # DB access layer (user, event, invitation)
├── services/        # Business logic (event, invitation, ai)
├── controllers/     # HTTP layer (event, invitation, ai, auth)
├── routes/          # Express routers
├── middleware/      # authenticate, requireRole, validate, rateLimiter, requestLogger
├── utils/           # AppError, asyncHandler, response, pagination, date, logger, schemas
├── app.ts           # Express app (helmet, cors, routes, error handler)
└── server.ts        # HTTP server + graceful shutdown
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or provide a connection string
- Firebase project with Authentication enabled
- (Optional) OpenAI API key for AI features

### Setup

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI, FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID
npm install
```

### Development

```bash
npm run dev
# Server starts on http://localhost:3000 (hot-reload via ts-node-dev)
```

### Production build

```bash
npm run build   # tsc → dist/
npm start       # node dist/server.js
```

### Type-check only

```bash
npm run type-check  # tsc --noEmit
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` or `production` (default: development) |
| `PORT` | No | HTTP port (default: 3000) |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | One of two | Stringified service account JSON |
| `FIREBASE_PROJECT_ID` | One of two | Used with Application Default Credentials |
| `ALLOWED_ORIGINS` | Recommended | Comma-separated CORS origins |
| `OPENAI_API_KEY` | No | Enables AI features; returns 503 if missing |
| `OPENAI_MODEL` | No | OpenAI model (default: `gpt-4o-mini`) |
| `LOG_LEVEL` | No | Winston log level (default: `debug` in dev, `info` in prod) |

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no auth) |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/events` | Create event |
| GET | `/api/events` | List events (mine + invited) |
| GET | `/api/events/:id` | Get event |
| PATCH | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Soft delete event |
| POST | `/api/events/:id/invite` | Invite by email list |
| GET | `/api/events/:id/attendees` | List attendees + RSVP |
| GET | `/api/invitations` | My invitations |
| POST | `/api/invitations/:id/respond` | RSVP (attending/maybe/declined) |
| POST | `/api/ai/parse-event` | NL → structured event fields |
| POST | `/api/ai/suggest-times` | Find free time slots |

Full API contract: [docs/06-api-contract.md](docs/06-api-contract.md)

---

## Testing

### Postman Collection (v5 – production-ready)

The collection lives in `postman/` and covers all 13 endpoints across 6 folders:
**Health → Auth → Events → Invitations → AI → Teardown**

#### Import

1. Open Postman → **File → Import** → select `postman/EventScheduler_v5.postman_collection.json`
2. **File → Import** again → select `postman/EventScheduler_v5.postman_environment.json`
3. Select **Event Scheduler v5** from the environment dropdown (top-right corner)

#### Required environment variables

| Variable | Where to get it |
|----------|-----------------|
| `firebase_api_key` | Firebase console → Project Settings → General → **Web API Key** (not the service-account key) |
| `admin_email` / `admin_password` | Credentials of a user with `role: "admin"` in MongoDB |
| `member_email` / `member_password` | Credentials of a regular (non-admin) user |

All other variables (`admin_token`, `member_token`, `event_id`, `invitation_id`, …) are
auto-populated by the collection's pre-request and test scripts – you never need to set them
manually.

> **Promote a user to admin**
> ```bash
> mongosh event-scheduler --eval \
>   "db.users.updateOne({email:'admin@example.com'},{\$set:{role:'admin'}})"
> ```

#### Token refresh

A collection-level pre-request script automatically refreshes both tokens before each request
using the Firebase REST sign-in endpoint:
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={{firebase_api_key}}
```
Tokens are cached with a 55-minute validity window (5-minute safety buffer). You can also
paste tokens directly into `admin_token` / `member_token` and leave the credentials blank.

#### Run order

Run the folders **top-to-bottom** (the default Collection Runner order):
`Health → Auth → Events → Invitations → AI → Teardown`

The Teardown folder deletes test data and unsets all auto-populated variables.

#### pm.test coverage (25+ assertions)

- Auth 401/200, admin-only 403 guards
- Event create 201, conflict 409, `ignoreConflicts` bypass 201
- List / search / date-range / status filter 200
- Get one 200, 404 after delete
- Update 200, unauthorized 403
- Invite 200, attendees list 200
- RSVP attending / maybe / declined 200, wrong-user 403
- AI parse 200|503, AI suggest shape validation
- Teardown soft-delete + 404 confirmation

---

### Bash integration test script (`test-api.sh`)

A `curl`-based script that reproduces the same flows without Postman.

#### Prerequisites

You need **two Firebase ID tokens** – one for an admin user and one for a regular member.

**Get a token via the Firebase REST API:**
```bash
curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<WEB_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword","returnSecureToken":true}' \
  | python3 -m json.tool | grep idToken
```

#### Run

```bash
export TOKEN="<admin_firebase_id_token>"
export MEMBER_TOKEN="<member_firebase_id_token>"
export BASE_URL="http://localhost:3000"   # optional, this is the default
export MEMBER_EMAIL="member@example.com" # optional, used as invite target

chmod +x test-api.sh
./test-api.sh
```

The script prints coloured `[PASS]` / `[FAIL]` / `[SKIP]` lines, a final summary, and exits
`0` if all assertions pass or `1` if any fail.

---

## Firebase ID Token (Development)

```js
// In a browser console with Firebase JS SDK:
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
const cred = await signInWithEmailAndPassword(getAuth(), 'user@example.com', 'password');
const token = await cred.user.getIdToken();
console.log(token); // use as Bearer token
```

Or use the [Firebase Auth REST API](https://firebase.google.com/docs/reference/rest/auth):
```bash
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<WEB_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","returnSecureToken":true}'
```

---

## Security Highlights

- Firebase JWT verification with revocation check
- Helmet with `Content-Security-Policy: default-src 'none'`
- CORS deny-all in production unless `ALLOWED_ORIGINS` is set
- Tiered rate limiting (general / AI / auth / admin)
- Zod validation on all body, query, and param inputs
- Winston logger with recursive redaction of sensitive fields
- Soft delete (events are never physically removed)
- Conflict detection with 409 + bypass flag

## Documentation

- [Requirements](docs/01-requirements.md)
- [Database Design](docs/03-database-design.md)
- [Security](docs/04-security.md)
- [API Contract](docs/06-api-contract.md)
