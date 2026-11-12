# Architecture & Implementation Plan

> **Demonstration platform.** This application is not an officially authorized website of the
> Government of the Republic of Higeria. It must not accept real applications, personal data,
> or payments until embassy authorities have approved it and verified all official content.

## 1. Starting point

The project directory was empty (only an empty `Claude.md`). Tooling available: Node 20, npm 10,
Git. No PostgreSQL or Docker, so local development and tests use the `embedded-postgres`
package, which runs a real PostgreSQL server from npm. Production uses any managed PostgreSQL
service (Neon, Supabase, RDS, Vercel Postgres, etc.).

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router, JavaScript), React 19 |
| Styling | Tailwind CSS 3, Lucide React icons |
| Forms | React Hook Form + Zod (the same schemas run on client and server) |
| Database | PostgreSQL + Prisma ORM (migrations in `prisma/migrations`) |
| Auth | Custom session auth: bcrypt (cost 12) password hashes, random 256-bit session tokens stored **hashed** in the DB, `HttpOnly` + `Secure` + `SameSite=Lax` cookies |
| Authorization | Role-based (APPLICANT, STAFF, ADMIN, SUPER_ADMIN) + fine-grained permissions + department scoping for staff |
| Payments | Stripe Checkout (redirect) + signature-verified webhooks, idempotent event processing |
| File storage | Driver abstraction: `s3` (private S3 / R2 / any S3-compatible bucket, short-lived presigned URLs) or `local` (private directory outside `public/`, HMAC-signed expiring download links) |
| Email | Nodemailer (SMTP: Resend, Postmark, SES, SendGrid, etc.); a `console` transport is used in development |
| Tests | Vitest, run against a real PostgreSQL (embedded) and real Stripe signature verification |
| Hosting | Vercel (or any Node host) + managed Postgres + S3-compatible private bucket |

## 3. Layout

```
prisma/            schema, migrations, seed (placeholder content clearly labelled)
src/app/(site)/    public pages: home, about, offices, passport, visa, news, faq, contact, track
src/app/(auth)/    login, register
src/app/dashboard/ applicant portal (applications, payments, notifications)
src/app/admin/     staff/admin dashboard (RBAC-protected)
src/app/api/       route handlers (all mutations and data access)
src/components/    shared UI (layout, forms, uploads, admin widgets)
src/lib/           prisma, auth, rbac, storage, email, stripe, validation, rate-limit, audit
tests/             Vitest integration tests
```

## 4. Key flows

**Applications.** Applicant (signed in) → choose category → multi-step wizard (draft auto-saved
via `PATCH /api/applications/:id`) → upload documents (validated server-side) → review →
`POST /api/applications/:id/submit` (full Zod validation and a required-documents check; a
reference number is generated; status moves to `PAYMENT_PENDING`) → `POST /api/payments/checkout`
creates a Stripe Checkout Session from **server-side** fee configuration → Stripe → webhook
`checkout.session.completed` → payment `SUCCEEDED`, application `PAYMENT_CONFIRMED`, receipt
number, email and notification sent. The success page only *reads* the status from the
database and never trusts query parameters.

**Status tracking.** Public `/track` requires the reference number **plus** the applicant's
email **and** date of birth. It is rate-limited and returns only the status, never personal data.

**Uploads.** `multipart/form-data` → size limit → magic-byte sniffing (JPEG/PNG/PDF only; the
declared MIME type and extension are ignored) → PDFs containing JavaScript, launch actions or
embedded files are rejected → stored under a random key (`applications/<appId>/<uuid>.<ext>`)
in private storage → the DB stores metadata and a SHA-256 hash. Downloads go through
`/api/documents/:id/url`, which checks ownership or staff permission, writes an audit log entry,
and returns a link that expires in 5 minutes.

**Payments.** Card data never touches the server. Webhooks verify the signature against the raw
body. Each Stripe event ID is recorded in a `StripeEvent` table with a unique constraint, so a
replayed event cannot be processed twice. The paid amount and currency are compared with the
stored expected amount before an application is marked paid.

## 5. Security controls

HTTPS/HSTS, CSP and hardened headers; Origin-checked mutating API requests (CSRF); Prisma
parameterized queries (SQL injection); React escaping and no `dangerouslySetInnerHTML` on user
content (XSS); DB-backed rate limiting (works across serverless instances); account lockout
after repeated failed logins; session expiry and revocation; audit logs for all staff actions
and document access; secrets only in environment variables; private storage; data-retention
purge script (`npm run retention:purge`).

## 6. Roadmap (build order)

1. Scaffold, Tailwind design system, Prisma schema + migration, seed
2. Auth (register/login/logout/sessions), RBAC, rate limiting, audit
3. Public site: layout, home, about, offices, news, FAQ, contact, legal pages, SEO
4. Application categories, wizard, drafts, document uploads
5. Submission, reference numbers, tracking
6. Stripe Checkout, webhooks, receipts
7. Applicant dashboard + notifications + emails
8. Admin dashboard: overview, applications, payments, offices, content, FAQs, inquiries, users, audit
9. Tests, README, `.env.example`
