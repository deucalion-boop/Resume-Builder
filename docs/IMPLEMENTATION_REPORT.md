# Production-hardening implementation report

## Scope and preservation

This pass continued the existing Next.js 16 application in place. Routes,
layouts, resume models, editor architecture, dashboard behavior, public pages,
PDF pipeline, Supabase integration, and Prisma business logic were preserved.
The repository already contained normalized resume-section CRUD, Zod validation,
revision-aware autosave/conflict handling, local offline recovery, drag-and-drop,
undo/redo, server-side resume listing, public analytics, role-protected admin
services, and responsive Ocean/Blue Horizon presentation.

## Implemented in this pass

### Critical production blockers

- Replaced process-local-only throttling with an atomic Upstash Redis REST/Lua
  limiter. Local/test retains deterministic memory behavior; Vercel Production
  fails closed.
- Converted every protected caller to await the distributed limiter.
- Added strict production environment validation and a documented public/server
  secret boundary.
- Added Next.js instrumentation, structured error events, provider-neutral
  monitoring ingestion, critical security webhooks, and a database health probe.
- Added nonce-based per-request CSP, removed `unsafe-inline` from `script-src`,
  retained required development `unsafe-eval`, and passed the nonce to
  `next-themes`.
- Tightened CSRF same-origin validation to compare the full origin and hardened
  callback redirects against protocol-relative and backslash URL parsing.
- Added defense-in-depth session revocation: application revocation timestamp,
  Supabase Auth session-row removal when permitted, global self sign-out, and
  Auth bans for suspended/deleted identities.
- Added a Supabase-aware migration that creates the photo bucket and explicit
  owner/folder RLS policies for INSERT/SELECT/UPDATE/DELETE.
- Reworked self-deletion into soft deletion with configurable retention,
  recoverability, scheduled purge, session invalidation, and administrator
  last-account protection.
- Added a protected, constant-time-secret-checked Vercel Cron purge worker with
  monitored retryable failures.
- Added cursor-based Supabase Storage V2 pagination for platform storage
  analytics and deletion cleanup.
- Added an operator runbook for Supabase Auth, providers, SMTP, templates,
  Storage verification, monitoring, alerts, backups, restore drills, deploys,
  and rollback.

### High-impact operations and administration

- Added a configurable 1–365 day deleted-account retention setting.
- Added non-blocking Resend notifications for support acknowledgements/replies,
  account lifecycle actions, and self-deletion confirmation.
- Added spreadsheet-formula-safe CSV exports for users, support tickets,
  security events, and administrator audit logs. Existing analytics CSV remains
  available.
- Added a production health endpoint with database reachability, latency,
  release, and no secret/internal topology exposure.
- Expanded CI with an isolated PostgreSQL service, migration deployment,
  `TEST_DATABASE_URL`, and Chromium/Firefox/WebKit installation.
- Expanded Playwright projects to desktop Chromium, desktop Firefox, desktop
  WebKit, and mobile Chromium, with an overridable external-server base URL.

## Database changes

Migration `20260729030000_production_hardening`:

- adds nullable `User.purgeScheduledAt`;
- adds `(status, purgeScheduledAt)` index for the purge worker;
- creates/updates `resume-photos` only when the Supabase Storage schema exists;
- restricts size and MIME types; and
- installs idempotent ownership policies.

The conditional Storage block keeps ordinary PostgreSQL test databases
compatible.

## Verification evidence

- `npx prisma generate` — passed
- `npx prisma validate` — passed
- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run test` — 10 passed, 1 database integration test skipped because the
  local shell did not provide `TEST_DATABASE_URL`
- `npm run build` — optimized Next.js production build passed
- Playwright production server, desktop Chromium — passed
- Playwright production server, mobile Chromium — passed
- Combined final browser run — 9 passed, 3 intentional project/credential skips

Authenticated administrator E2E remains guarded by `E2E_ADMIN_TEST=1` and
dedicated Supabase test credentials. Firefox and WebKit are configured and
installed in CI; they were not installed/executed in this local shell.

## External actions still required

Repository code cannot create or verify production provider accounts. Before
launch, an operator must:

- add every production environment variable;
- configure Supabase email confirmation, Google/GitHub OAuth, redirect URLs,
  session limits, SMTP, and email templates;
- run `prisma migrate deploy` against a reviewed production backup;
- provision Upstash and Resend;
- configure monitoring ingestion, alert destinations, and uptime probes;
- enable Supabase backups/PITR and Storage-object backups;
- execute cross-account Storage RLS tests;
- execute authenticated E2E against isolated test services; and
- perform and record a restore drill.

## Remaining product-expansion backlog

The production blockers above are complete in repository scope. The following
large product expansions from the request remain separate implementation work
and should not be represented as completed:

- user-facing snapshot history browsing/restoration beyond the existing
  revision/conflict mechanism;
- guided external resume import with field mapping;
- full localization, locale switching, and admin-configurable timezone display;
- a complete user notification center and per-category preferences;
- administrator saved report schedules and delivery management;
- full bulk-selection UI/actions across every admin dataset;
- branding asset upload UI (settings currently store validated public URLs);
- exhaustive authenticated resume CRUD/PDF/admin E2E across all browser projects
  using dedicated Supabase and PostgreSQL test infrastructure.

These are intentionally left explicit rather than hidden behind partial mocks or
unsafe production shortcuts.
