# Project notes for Claude

Embassy of Higeria (Washington, D.C.) digital services portal — **demonstration only**. See README.md and docs/ARCHITECTURE.md.

## Commands
- `npm run db:local` — local PostgreSQL on :5433 (embedded-postgres, no Docker). Keep it running in its own terminal.
- `npm run dev` · `npm run build` · `npm test` (tests spin up their own Postgres on :5434)
- `npx prisma migrate dev --name <change>` after editing prisma/schema.prisma

## Rules
- Never invent official facts (names, contacts, fees, processing times, requirements, policies). Use clearly labelled placeholders; content has `isPlaceholder` flags.
- Payments are confirmed ONLY by verified Stripe webhooks (src/lib/payments.js). Never trust client amounts or redirects.
- All API routes use `route()` from src/lib/http.js (origin/CSRF check + error handling) and guards from src/lib/rbac.js.
- Never pass secrets (e.g. passwordHash) or functions from server components to client components.
- Uploaded documents are private: access only via /api/documents/:id/url (signed, expiring, audited).
- Do not run `prisma migrate reset` or other destructive DB commands without explicit user consent.
