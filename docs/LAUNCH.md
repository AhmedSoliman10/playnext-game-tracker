# PlayNext Launch Checklist

Use this checklist when you are ready to promote the repository.

## GitHub

- Add repository topics:
  - `nextjs`
  - `react`
  - `typescript`
  - `supabase`
  - `tailwindcss`
  - `igdb`
  - `game-tracker`
  - `games`
  - `recommendation-system`
  - `app-router`
  - `shadcn-ui`
- Upload `public/social-preview.png` in repository settings under Social preview.
- Add the production demo URL to the repository Website field after deployment.
- Keep issues labeled with `good first issue`, `bug`, `enhancement`, and `help wanted`.

## Demo

- Deploy the seeded demo first so visitors can try the product without credentials.
- Add Supabase and IGDB environment variables after the demo is stable.
- Confirm `/discover`, `/search`, `/library`, and `/games/[slug]` work in production.

## Launch Copy

Short version:

```text
I built PlayNext, an open-source game tracker that uses swipe-based discovery, conversational ratings, personal libraries, and deterministic recommendations.

Built with Next.js, TypeScript, Supabase, Tailwind CSS, and IGDB.

Repo: https://github.com/AhmedSoliman10/playnext-game-tracker
Demo: https://playnext-game-tracker.vercel.app
```

Long version:

```text
PlayNext is an open-source web app for deciding what game to play next.

It lets you answer each game conversationally, rate played games, organize your backlog, and get explainable recommendations based on your ratings, favorite genres, platforms, and previous decisions.

The first version uses deterministic templates and recommendation scoring, so no AI API is required.
```

## Places to Share

- X/Twitter with a short demo clip.
- LinkedIn with the architecture and product angle.
- Reddit communities such as `r/nextjs`, `r/reactjs`, `r/webdev`, and game-dev-adjacent communities where self-promotion rules allow it.
- Dev.to article about the recommendation engine and IGDB provider.
- Product Hunt after a live demo is polished.
