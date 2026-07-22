# PlayNext

Rate what you played. Organize your backlog. Discover what comes next.

PlayNext is a conversational game-tracking web app for swipe-based game discovery, personal library organization, ratings, reviews, statistics, and deterministic recommendations.

## Features

- Email/password sign up, sign in, sign out, password reset, and auth callback handling through Supabase Auth.
- Local demo mode when Supabase credentials are absent. Demo mode stores a session cookie and file-backed local library data without storing passwords.
- Swipe-based discovery cards with accessible button alternatives.
- Conversational rating flow with required half-point overall rating and optional category ratings/review.
- Library pages for all games, played, currently playing, want to play, dropped, favorites, and played but not rated.
- Game details pages at `/games/[slug]`.
- Dashboard and profile statistics with lightweight CSS charts.
- Deterministic recommendation scoring with explainable reasons.
- Search with debounced title search, filters, sorting, and URL query synchronization.
- Seeded provider with real demo artwork and optional IGDB provider when Twitch client credentials are configured.
- Supabase SQL migration with enums, constraints, indexes, triggers, and row-level security policies.

## Technology

- Next.js App Router, TypeScript strict mode, React, Tailwind CSS
- shadcn-style UI primitives built on Radix where useful
- Supabase Auth, Supabase PostgreSQL, `@supabase/ssr`
- Zod, React Hook Form
- Lucide icons
- Vitest, React Testing Library, Playwright
- ESLint, Prettier

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:8000`.

Without Supabase values, the app runs in local demo mode. For real authentication and database persistence, configure Supabase as below.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:8000
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code. It is only used server-side to sync global game metadata.

## Supabase Setup

1. Create a Supabase project.
2. Copy project URL into `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy anon public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copy service role key into `SUPABASE_SERVICE_ROLE_KEY` for server-only metadata sync.
5. Set `NEXT_PUBLIC_APP_URL` to your local or deployed app URL.
6. In Supabase Auth settings, add allowed redirect URLs:
   - `http://localhost:8000/auth/callback`
   - your production URL plus `/auth/callback`

## Database Migration

Run the migration in `supabase/migrations/202607180001_playnext_initial_schema.sql` using the Supabase SQL editor or CLI.

With Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Seed Data

Seed the demo catalog with:

```bash
supabase db reset
```

or run `supabase/seed.sql` in the SQL editor after applying the migration.

The app also has a built-in seeded provider, so local demo mode works even before Supabase is configured.

## Live Game Data APIs

IGDB is preferred for live catalog search and artwork. Create a Twitch Developer application, then add:

```env
IGDB_CLIENT_ID=your_twitch_client_id
IGDB_CLIENT_SECRET=your_twitch_client_secret
```

PlayNext exchanges those server-side credentials for an app access token and calls IGDB only from server routes. The client secret is never sent to the browser.

Provider order is IGDB, then the seeded catalog. If credentials are missing or IGDB is temporarily unavailable, PlayNext falls back to seeded data.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
npm run format
npm run format:check
```

Playwright uses port `3100` to avoid colliding with a local dev server on `8000`.

## Security Model

- Supabase Auth handles password storage and sessions.
- Middleware protects signed-in routes.
- Browser mutations go through validated server endpoints.
- Zod validates auth forms, ratings, statuses, profile updates, search params, and IGDB responses.
- User-owned tables have RLS policies scoped to `auth.uid()`.
- Global game metadata is readable to authenticated users but has no browser insert/update/delete policies.
- Server-side mutation routes include simple in-memory rate limiting.
- `SUPABASE_SERVICE_ROLE_KEY` is never used in client components.

## Testing

Current meaningful coverage includes:

- Recommendation scoring and exclusions.
- Rating validation.
- Status transitions.
- Statistics and gaming personality assignment.
- IGDB response normalization.
- Library status/rating integration behavior.
- A critical Playwright journey covering sign-in, discovery, played rating, played library, details page rating, backlog, and keyboard-only discovery through accessible buttons.

## Deployment

1. Configure environment variables in your hosting provider.
2. Apply Supabase migrations and seed data.
3. Build with `npm run build`.
4. Start with `npm run start` or deploy through a Next.js-compatible platform.

## Known Limitations

- Demo mode is for local development and stores library data in `.playnext-data/demo-store.json`.
- OAuth providers are not enabled by default.
- Recommendation templates are deterministic and do not call an AI API.
- Live IGDB metadata sync needs `SUPABASE_SERVICE_ROLE_KEY` if games are not already seeded in Supabase.

## Future Improvements

- Add OAuth provider configuration.
- Add user-controlled discovery reset.
- Add server-side pagination for very large Supabase libraries.
- Add richer recommendation tuning controls.
- Add optional AI-generated assistant copy behind a provider interface.
