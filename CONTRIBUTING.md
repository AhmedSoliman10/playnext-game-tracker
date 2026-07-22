# Contributing to PlayNext

Thanks for helping make PlayNext better. The project is young, so useful issues, focused pull requests, and clear bug reports all matter.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at `http://localhost:8000`.

Supabase and IGDB credentials are optional for most UI and recommendation work because the seeded provider and local demo mode work without secrets.

## Before You Open a Pull Request

Run the relevant checks:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
```

Run Playwright when your change touches auth, discovery, ratings, library, search, or navigation:

```bash
npm run test:e2e
```

## Pull Request Guidelines

- Keep PRs focused on one feature or fix.
- Include screenshots for UI changes.
- Add or update tests when business logic changes.
- Do not commit `.env.local`, logs, `.playnext-data`, build output, or credentials.
- Prefer existing patterns and small components over large rewrites.
- Explain user impact in the PR body.

## Good First Contributions

- Add recommendation reason templates.
- Improve responsive edge cases.
- Add provider normalization fixtures.
- Improve empty/loading/error states.
- Add accessibility tests around keyboard discovery.

## Project Architecture

- `src/app` contains routes and server-first App Router pages.
- `src/components` contains UI and interaction components.
- `src/lib/games` contains provider abstractions, IGDB integration, and seed data.
- `src/lib/recommendations` contains deterministic scoring.
- `src/lib/server` contains persistence and server-only helpers.
- `src/lib/validation` contains Zod schemas.
- `supabase` contains migrations and seed SQL.
- `tests` contains unit, integration, and Playwright coverage.

## Security

Report security issues privately when possible. See [SECURITY.md](SECURITY.md).
