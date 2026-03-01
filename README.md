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

### Postman

1. Import `postman/EventScheduler_v5.postman_collection.json`
2. Import `postman/EventScheduler_v5.postman_environment.json`
3. Get a Firebase ID token (see collection description for instructions)
4. Set `FIREBASE_TOKEN` in the environment
5. Run the collection

### Bash Script

```bash
export FIREBASE_TOKEN="<your_id_token>"
export BASE_URL="http://localhost:3000"
chmod +x test-api.sh
./test-api.sh
```

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
