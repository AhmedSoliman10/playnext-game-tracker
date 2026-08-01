# Playnira rebrand checklist

Canonical product identity:

- Product name: `Playnira`
- Tagline: `Your games. Your journey.`
- App/package slug: `playnira`
- Repository slug: `playnira-game-tracker`
- Recommended custom domain: `playnira.app`
- Fallback Vercel domain: `https://playnira-game-tracker.vercel.app`
- Suggested sender mailbox: `playnira.app.mail@gmail.com`

## Codebase

- Update visible UI copy, metadata, social previews, email templates, tests, and docs.
- Update local-only cookies/cache/data names:
  - `playnira_demo_user`
  - `playnira_oauth_next`
  - `.playnira-data/`
  - `PLAYNIRA_FORCE_DEMO`
- Keep old production cookies working only if you intentionally need a migration window.

## GitHub

- Rename the repository to `playnira-game-tracker`.
- Update the repository description, social preview image, topics, and homepage URL.
- Reconnect or verify Vercel's GitHub integration after the rename.
- Check all README and launch-document links after GitHub finishes redirecting the old repo URL.

## Vercel

- Rename the Vercel project to `playnira-game-tracker` if available.
- Set production domain to either:
  - `https://playnira.app` after buying the domain, or
  - `https://playnira-game-tracker.vercel.app` if using the generated Vercel URL.
- Update `NEXT_PUBLIC_APP_URL` in Vercel for Production, Preview, and Development.
- Redeploy after changing `NEXT_PUBLIC_APP_URL`.

## Supabase Auth URLs

In Supabase Auth URL Configuration, update:

- Site URL:
  - `https://playnira.app` or `https://playnira-game-tracker.vercel.app`
- Redirect URLs:
  - `https://playnira.app/auth/callback`
  - `https://playnira.app/auth/confirm`
  - `https://playnira.app/auth/confirm/signup`
  - `https://playnira.app/auth/confirm/reset`
  - `https://playnira-game-tracker.vercel.app/auth/callback`
  - `https://playnira-game-tracker.vercel.app/auth/confirm`
  - `https://playnira-game-tracker.vercel.app/auth/confirm/signup`
  - `https://playnira-game-tracker.vercel.app/auth/confirm/reset`
  - `http://localhost:8000/auth/callback`
  - `http://localhost:8000/auth/confirm`
  - `http://localhost:8000/auth/confirm/signup`
  - `http://localhost:8000/auth/confirm/reset`

Keep previous-brand URLs temporarily only while existing email links may still be in inboxes.

## Supabase email templates

Update template sender/display text from the old name to `Playnira`.

Use app confirmation links that route through:

- `/auth/confirm/signup`
- `/auth/confirm/reset`

## Discord

In the Discord Developer Portal:

- Rename the Discord application to `Playnira`.
- Replace the app icon with `public/playnira-discord-app-icon.png`.
- Keep the Discord OAuth redirect URL as the Supabase callback URL:
  - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`

In Supabase Discord provider settings:

- Keep Discord enabled.
- Verify Client ID and Client Secret.
- Enable Manual Linking for account connection from Settings.

## Email / SMTP

- Create or rename the Gmail sender account to `playnira.app.mail@gmail.com`.
- Update deployment env vars:
  - `SMTP_USER=playnira.app.mail@gmail.com`
  - `SMTP_FROM="Playnira <playnira.app.mail@gmail.com>"`
- Keep `SMTP_PASSWORD` as a Gmail app password, never the normal account password.

## External provider dashboards

- IGDB/Twitch developer app name: rename to `Playnira` if the dashboard allows it.
- Steam Web API key notes/user-agent are already app-branded in code; no dashboard rename is required unless you use a named Steam publisher/app page.

## Local machine

- Rename the local project folder to `Playnira`.
- After the folder rename, reopen the terminal in the new path and run:

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```
