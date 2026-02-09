# Titus 2:4 Company

A premium faith-based women's community app — built for Caribbean women under 31 interested in or in marriage. Teaching what is good, together.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS with custom warm amber-gold theme
- **Backend:** Supabase (Auth, Database, Storage, Realtime)
- **Routing:** React Router (HashRouter) — 14 routes
- **Icons:** Lucide React
- **Dates:** date-fns
- **PWA:** Mobile-first with Add to Home Screen support

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key
3. Run `supabase/schema.sql` in the Supabase SQL Editor to create all tables, policies, triggers, and seed data

### 3. Run the dev server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.

## Features

- **Authentication** — Email/password with auto-profile creation
- **Onboarding** — Guided setup with photo, location, prayer focus
- **Community Feed** — Posts with images, reactions (🙏❤️🤲), threaded comments
- **Prayer Wall** — Anonymous requests, "I'm praying" responses, answered prayer tracking
- **Events** — RSVP system (Coming/Maybe/No), reminders, attendance tracking
- **Bible Study** — Multi-day reading plans with enrollment, daily reflections
- **Photo Gallery** — Albums with photo upload and lightbox viewer
- **Direct Messages** — Private conversations between members
- **Resources** — Teaching articles and videos curated by leaders
- **Directory** — Browse community members
- **Search** — Global search across posts, people, events, resources, prayers
- **Notifications** — Real-time in-app notifications with unread badges
- **Badges** — 14 achievement milestones auto-awarded by activity
- **Admin Dashboard** — Post/prayer moderation, attendance, pastoral follow-up notes
- **Dark/Light Theme** — Persisted per-user preference
- **Realtime** — Supabase subscriptions for live data updates

## Design

- **Typography:** Playfair Display (display) + DM Sans (body)
- **Palette:** Warm amber-gold with coral accents on deep dark/cream surfaces
- **Effects:** Glassmorphism, ambient gradient glows, staggered animations
- **Mobile-first:** PWA-ready with bottom navigation and safe area support

## Project Structure

```
src/
├── components/     Reusable UI components
├── context/        AppContext (global state + actions)
├── hooks/          Custom React hooks
├── lib/            Supabase client, image utils, helpers
├── types/          TypeScript type definitions
├── views/          Route-level page components
├── App.tsx         Router + Provider
├── main.tsx        Entry point
└── index.css       Global styles + theme variables
```

## Licence

Private — Titus 2:4 Company
