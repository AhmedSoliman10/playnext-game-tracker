# Security Policy

## Supported Versions

The `main` branch is the only supported version while PlayNext is early-stage.

## Reporting a Vulnerability

Please do not open a public issue for vulnerabilities involving credentials, authentication bypass, unsafe data access, or private user data.

If GitHub private vulnerability reporting is enabled for the repository, use that. Otherwise, contact the repository owner directly through GitHub.

Include:

- affected route or file
- steps to reproduce
- expected impact
- whether credentials or user data are exposed

## Security Expectations

- Do not commit `.env.local`, API keys, Supabase service role keys, IGDB secrets, local logs, or database passwords.
- Do not use the Supabase service role key in browser code.
- Keep user-owned data scoped by authenticated user ID.
- Validate external provider responses before use.
- Prefer server routes for mutations and secret-backed integrations.

## Current Protections

- Supabase Auth for password/session handling.
- RLS policies for user-owned tables.
- Server-side validation through Zod.
- Server-only IGDB secret usage.
- Basic mutation rate limiting.
- Demo mode that avoids custom password storage.
