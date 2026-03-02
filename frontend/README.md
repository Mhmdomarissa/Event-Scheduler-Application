# Event Scheduler — Frontend

Next.js 16 frontend for the Event Scheduler platform. Connects to the Express backend via REST API with Firebase Authentication.

**Live:** [event-scheduler-application-beta.vercel.app](https://event-scheduler-application-beta.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| State / Data | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Auth | Firebase JS SDK (email/password + Google OAuth) |
| Animation | Framer Motion |
| Date | date-fns |
| Notifications | Sonner |
| Theme | next-themes (dark / light / system) |

---

## Features

- **Landing Page** — 3D animated hero, feature cards, how-it-works section
- **Auth** — Email/password sign-in & sign-up, Google OAuth, forgot password
- **Dark / Light Mode** — System-aware toggle in the navbar
- **Dashboard** — Event list with search, status, location, and date-range filters + pagination
- **Event Detail** — Full event info, attendee list with RSVP badges, edit / delete / invite actions
- **Invitations** — View and respond to received invitations (Attending / Maybe / Declined), links to event detail
- **AI Planner** — Describe an event + date range -> get AI-suggested time slots -> one-click create
- **Profile Page** — Display name, email, role, account status, member-since, auth provider
- **Admin UI** — Admin badge in navbar, admins can manage any event (not just their own)

---

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project with Email/Password + Google auth enabled
- Deployed backend URL (Railway) or local backend on `http://localhost:3000`

### Install & Run

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

### Environment Variables (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `https://...up.railway.app`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
frontend/
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── login/               # Sign-in (email + Google)
│   ├── signup/              # Sign-up (email + Google)
│   ├── dashboard/           # Event list with filters
│   ├── events/[id]/         # Event detail + management
│   ├── invitations/         # RSVP inbox
│   ├── planner/             # AI time suggester
│   └── profile/             # User profile
├── components/
│   ├── landing/             # Hero, FeatureCards, HowItWorks, Footer
│   ├── layout/              # Navbar, AppShell
│   ├── shared/              # ThemeToggle, LoadingSkeleton, ErrorMessage, EmptyState, PageHeader
│   └── ui/                  # shadcn/ui primitives
├── features/
│   ├── auth/                # AuthProvider, useAuth
│   ├── events/              # services, hooks, EventCard, EventFormDialog, InviteDialog, etc.
│   ├── invitations/         # services, hooks
│   └── ai/                  # services, hooks
├── lib/
│   ├── api.ts               # Typed API client (auto Bearer token injection)
│   ├── firebase.ts          # Firebase init + auth helpers (email, Google, reset)
│   ├── env.ts               # Env var validation
│   └── utils.ts             # cn, statusConfig, rsvpConfig
├── types/index.ts           # Domain types (Event, Invitation, User, etc.)
└── proxy.ts                 # Next.js middleware (passthrough)
```

---

## Deployment (Vercel)

1. Import repo at [vercel.com](https://vercel.com) — set root directory to `frontend`
2. Add all `NEXT_PUBLIC_*` env vars in Vercel dashboard
3. Add your Vercel domain to the backend's `ALLOWED_ORIGINS` env var
4. Add your Vercel domain to Firebase Console -> Authentication -> Authorized domains