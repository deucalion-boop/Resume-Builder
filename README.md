# Resumly

A production-oriented resume builder built with Next.js App Router, TypeScript, Tailwind CSS, Prisma Postgres, Supabase Auth/Storage, TanStack Query, React Hook Form, Zod, Framer Motion, dnd-kit, and `@react-pdf/renderer`.

The repository currently uses **Next.js 16.2** and **Prisma 7.9**. This intentionally keeps the newer versions installed by the starter while preserving the requested App Router architecture.

## Included

- Email/password, Google, and GitHub authentication through Supabase
- Server-verified sessions, protected routes through `proxy.ts`, and per-resource ownership checks
- Normalized Prisma schema for all resume sections, users, customization, publishing, and analytics events
- Multiple resumes with create, duplicate, delete, search, sort, completion, and autosave
- Responsive editor with a live ATS preview and keyboard-enabled drag-and-drop section ordering
- Clarity, Modern, and Executive templates with font, color, spacing, and visibility controls
- Supabase Storage profile image upload
- Browser PDF generation, print styles, and public share links
- Dashboard, analytics, profile settings, themes, skeleton-friendly visual system, and Sonner notifications
- Interactive no-account demo at `/demo/resumes/demo-resume/edit`
- Isolated role-protected administration workspace at `/admin`
- User lifecycle management with suspension, recovery, session revocation, soft deletion, restoration, and administrator-role safeguards
- Public resume moderation, report handling, suspicious-traffic signals, link controls, template availability, and moderation history
- Platform analytics with daily/weekly/monthly views, conversion, storage usage, measured database latency, and CSV exports
- Runtime settings for branding, favicon, SEO, registration, OAuth buttons, uploads, fonts, colors, sections, maintenance, and policies
- Security events, failed-login monitoring, rate-limit events, immutable administrator audit logs, FAQs, announcements, and support tickets

## Local setup

1. Copy `.env.example` to `.env` and fill in your Prisma Postgres and Supabase values.
2. In Supabase Auth, enable Email, Google, and GitHub providers.
3. Add these callback URLs in Supabase:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_VERCEL_DOMAIN/auth/callback`
4. Apply the migrations; the production-hardening migration creates and locks down the `resume-photos` bucket when run against Supabase.
5. Generate the Prisma client and apply the schema:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The public demo works without Supabase configuration; authenticated routes require the Supabase variables.

The initial seed reads `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, and
`DEFAULT_ADMIN_NAME`, creates or upgrades that account to `ADMIN`, and is
idempotent. It also requires `SUPABASE_SERVICE_ROLE_KEY`, which must remain a
server-only environment variable. The administrator is required to change the
seed password at first login.

## Administrator workspace

After changing the seeded password, administrators are routed to `/admin`.
The admin area has a dedicated layout and does not reuse the normal user
dashboard shell.

- `/admin/users` — account search, filtering, lifecycle, role, recovery, and activity
- `/admin/moderation` — reports, public-link controls, suspicious activity, and templates
- `/admin/analytics` — platform metrics and CSV export
- `/admin/settings` — global application configuration
- `/admin/security` — security events and administrator audit history
- `/admin/support` — tickets, internal notes, FAQs, and announcements
- `/admin/account` — the signed-in administrator’s own profile and password

Every administrator Route Handler independently verifies the Supabase session,
active Prisma profile, and `ADMIN` role. Mutation payloads are allow-listed
with Zod, same-origin checked, rate limited, and written to `AdminAuditLog`.
The service-role key is imported only by server-only modules.

## Supabase storage policies

The repository migration applies ownership-aware policies for insert, select,
update, and delete. Profile images remain public because resume PDFs and public
links need stable URLs. See [Production operations](docs/PRODUCTION_OPERATIONS.md)
for the exact verification and cross-account isolation tests.

## Vercel deployment

- Import the repository into Vercel.
- Add every variable from `.env.example` for Production, Preview, and Development as appropriate.
- Keep the build command as `npm run build`.
- Run `npx prisma migrate deploy` against the production database before the first release and after schema changes.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical production origin.
- Add the Vercel callback URL to Supabase Auth and the Google/GitHub provider consoles.

`proxy.ts` uses the Next.js 16 convention (the previous `middleware.ts` name is deprecated). Every mutation also authenticates and checks ownership independently; the proxy is not treated as the security boundary.

The full Supabase Auth/SMTP/OAuth setup, distributed-rate-limit configuration,
monitoring, retention, backups, restore drills, deployment order, and rollback
procedure are documented in [Production operations](docs/PRODUCTION_OPERATIONS.md).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma validate
npm run test:e2e
```

`npm run test:e2e` runs against the built production server, so run
`npm run build` first. Database integration tests require a separate
`TEST_DATABASE_URL`; they are skipped rather than touching a development or
production database when it is absent.

The public demo is intentionally stored locally and does not send data to Supabase or Prisma. It is useful for design review and product tours, but production resume persistence always uses an authenticated server endpoint.
