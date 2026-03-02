# Event Scheduler Application — Frontend

Full-featured Next.js frontend for the Event Scheduler v5 API.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| State / Data | @tanstack/react-query v5 |
| Forms | React Hook Form + Zod |
| Auth | Firebase Authentication (email/password) |
| Animation | Framer Motion |
| Date utilities | date-fns |
| Notifications | Sonner |

## Features

- **Landing page** — 3D animated hero, feature cards, how-it-works section
- **Authentication** — Firebase email/password sign-in, middleware-protected routes
- **Dashboard** — Event list with search, status, location and date-range filters
- **Event detail** — Full event info, attendees list with RSVP status, edit/delete/invite (owner only)
- **Invitations** — View and respond to received invitations (Attending / Maybe / Declined)
- **AI Planner** — Input event title + duration + date range → AI-generated time slot suggestions → one-click create

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A Firebase project with Email/Password auth enabled
- The deployed backend URL (Railway or local)

### 2. Install dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment variables

Create `.env.local` in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=https://event-scheduler-application-production.up.railway.app
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

> **Get your Firebase App ID**: Firebase Console → Project Settings → Your apps → Web app → App ID

### 4. Run in development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── login/page.tsx       # Sign-in
│   ├── dashboard/page.tsx   # Event list
│   ├── events/[id]/page.tsx # Event detail
│   ├── invitations/page.tsx # RSVP inbox
│   └── planner/page.tsx     # AI time suggester
├── components/
│   ├── landing/             # Hero, FeatureCards, HowItWorks, Footer
│   ├── layout/              # Navbar, AppShell
│   └── shared/              # LoadingSkeleton, ErrorMessage, EmptyState, PageHeader
├── features/
│   ├── auth/                # AuthProvider, useAuth
│   ├── events/              # services, hooks, EventCard, EventFormDialog, etc.
│   ├── invitations/         # services, hooks
│   └── ai/                  # services, hooks
├── lib/
│   ├── api.ts               # Typed API client (auto token injection)
│   ├── firebase.ts          # Firebase init + auth helpers
│   ├── env.ts               # Env var validation
│   └── utils.ts             # cn, date helpers, statusConfig, rsvpConfig
├── types/
│   └── index.ts             # All domain types (Event, Invitation, etc.)
└── middleware.ts             # Route protection
```

## Deployment (Vercel)

1. Push the `frontend/` folder to GitHub (or a monorepo)
2. Import the project at [vercel.com](https://vercel.com)
3. Set the **root directory** to `frontend`
4. Add all `NEXT_PUBLIC_*` env vars in Vercel → Settings → Environment Variables
5. After deploy, add your Vercel domain to Railway's `ALLOWED_ORIGINS` env var

## API

Production backend: `https://event-scheduler-application-production.up.railway.app`

Health check: `/health`

All API calls are proxied through `lib/api.ts` which automatically injects the Firebase ID token as a `Bearer` header.

