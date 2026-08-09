# Production operations

This runbook covers the configuration that cannot be safely committed to the
repository. Complete every production checklist item before directing traffic
to a deployment.

## Environment and secret boundary

Copy `.env.example` into the deployment provider and use different credentials
for Production, Preview, and local development. Production boot validates the
required environment when `VERCEL_ENV=production`; CI can exercise the same
gate with `STRICT_ENV_VALIDATION=true`.

Only these values are public:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ANALYTICS_HASH_SALT`,
`UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`, monitoring tokens, SMTP credentials,
and provider client secrets must never have a `NEXT_PUBLIC_` prefix. Rotate a
credential immediately if it was ever committed or exposed to a browser.

## Supabase Auth

In **Authentication → URL Configuration**:

- Site URL: the canonical HTTPS production origin.
- Redirect allow list:
  - `http://localhost:3000/auth/callback`
  - the exact Preview domains used for acceptance testing
  - `https://YOUR_PRODUCTION_DOMAIN/auth/callback`
- Do not add a broad wildcard for an unrelated domain.

In **Authentication → Providers**:

- Keep Email enabled, require email confirmation, and enable leaked-password
  protection.
- Add Google and GitHub client IDs/secrets, then copy Supabase's provider
  callback URL into each provider console.
- Keep the application callback as `/auth/callback`; the route accepts only
  root-relative, non-protocol redirects and exchanges the PKCE code server-side.

In **Authentication → Sessions**:

- Use a short JWT lifetime appropriate for the organization (15–60 minutes).
- Enable inactivity and maximum-lifetime controls when the Supabase plan allows
  them.
- Keep refresh-token reuse detection enabled.

In **Authentication → Email** configure a production SMTP provider. Verify SPF,
DKIM, and DMARC for the sender domain and set a monitored reply-to address.
Customize and test the Confirm signup, Reset password, Invite, Email change,
and Magic link templates. Every template link must use Supabase's
`ConfirmationURL` variable and resolve through an allowed application origin.
Test expiry, already-used links, and open-redirect attempts.

Session revocation has two layers. Application requests are immediately rejected
when their Auth `last_sign_in_at` predates `sessionsRevokedAt`; the lifecycle
service also removes that user's rows from `auth.sessions` when the database
role permits it. Self-deletion additionally invokes Supabase global sign-out,
and suspended/deleted identities are banned. Keep the JWT lifetime bounded
because a previously issued JWT remains cryptographically valid until `exp`
outside this application.

## Storage

Migration `20260729030000_production_hardening` creates the public
`resume-photos` bucket when the Supabase Storage schema exists and applies
INSERT, SELECT, UPDATE, and DELETE policies. Mutations require both:

- the first object-path segment equals `auth.jwt()->>'sub'`; and
- `owner_id = auth.uid()::text`.

The bucket accepts JPEG, PNG, and WebP up to 5 MiB. It is public because public
resume pages and generated PDFs need stable image URLs. Do not use it for
private documents. If photos become private, replace public URLs with short
signed URLs and update the PDF image-loading path before making the bucket
private.

After migration, verify in the Supabase SQL editor:

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'resume-photos';

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
```

Use two ordinary test accounts to confirm cross-folder insert, update, list, and
delete attempts return 403. Never put the service-role key in an upload client.

## Distributed rate limiting

Create one regional or global Upstash Redis database and set
`UPSTASH_REDIS_REST_URL` plus the standard `UPSTASH_REDIS_REST_TOKEN`. The
application executes one atomic Lua fixed-window command per protected request.
Local/test processes use an in-memory fallback. Vercel production fails closed
when configuration is absent or Redis is unavailable.

Monitor Upstash errors and `rate_limit_unavailable` events. Tune limits only
after examining legitimate traffic; use separate keys for login signals,
support, reporting, saves, downloads, public views, and administrator traffic.

## Monitoring and alerts

`instrumentation.ts` captures unhandled Next.js server errors with route and
release context. `MONITORING_INGEST_URL` can point to an internal collector,
Axiom/Better Stack HTTP source, or a Sentry relay; set
`MONITORING_INGEST_TOKEN` when required. Logs are structured JSON and deliberately
exclude request bodies, cookies, access tokens, and raw IP addresses.

Configure `SECURITY_ALERT_WEBHOOK_URL` for critical events. Alert on:

- repeated production boot/env validation failures;
- `rate_limit_unavailable`;
- retention purge failures;
- elevated 5xx rate or `/api/health` returning 503;
- critical unresolved `SecurityEvent` rows;
- Supabase Auth, Storage, and database latency/error spikes.

Create dashboards for p50/p95/p99 request latency, 4xx/5xx rate, database
latency, public views/downloads, storage bytes, active users, cron completion,
and error counts by release. Probe `/api/health` without caching from at least
two regions. The endpoint intentionally exposes no credentials or database
details.

## Retention, deletion, recovery, and backups

The administrator setting `accountRetentionDays` is 30 by default and supports
1–365 days. Account deletion now:

1. protects the last active administrator;
2. marks the profile `DELETED`;
3. records `deletedAt` and `purgeScheduledAt`;
4. revokes application and refresh sessions;
5. bans the Supabase identity; and
6. retains resumes and photos for authorized administrator recovery.

The protected Vercel cron calls `/api/cron/retention` daily with
`Authorization: Bearer $CRON_SECRET`. It processes 25 expired accounts per run,
removes Storage objects using cursor pagination, deletes the Auth identity, and
then cascades the Prisma profile. Failures remain queued and emit monitoring
events. Administrators can restore an account before the deadline; restoration
clears `purgeScheduledAt` and unbans Auth.

Backups are an infrastructure responsibility:

- Enable Supabase daily backups and Point-in-Time Recovery for the production
  project.
- Take an on-demand database backup before destructive migrations.
- Back up Storage objects separately using the Supabase S3 endpoint/rclone;
  database backups contain Storage metadata, not the object bytes.
- Encrypt exports, store them in a separate account/region, restrict restore
  permissions, and apply a documented retention schedule.
- Run a quarterly restore drill into an isolated project. Verify Auth provider
  configuration, database row counts, Storage object counts/checksums, RLS
  policies, and representative PDF downloads before declaring recovery
successful.

Product notifications (support acknowledgements/replies and administrator
account changes) use Resend's HTTPS API. Configure `RESEND_API_KEY` and a
verified `EMAIL_FROM` sender. Delivery failures emit `email_delivery_failed`
without rolling back the underlying account or support mutation.

Never test restoration against the production database. Record RPO, RTO,
operator, backup identifier, restore duration, validation evidence, and cleanup.

## Database and deploy procedure

Use a pooled runtime `DATABASE_URL` compatible with Prisma's adapter and a
direct/migration-capable URL where the provider requires it.

```bash
npm ci
npx prisma generate
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npm run lint
npm run typecheck
npm run test
npm run build
```

CI provisions an isolated PostgreSQL service, applies every migration, and
passes it only as `TEST_DATABASE_URL`/the CI runtime URL. It installs Chromium,
Firefox, and WebKit and exercises desktop plus mobile projects. Authenticated
E2E requires dedicated Supabase test credentials and `E2E_ADMIN_TEST=1`; never
enable the test bootstrap variables in Production.

Deploy a Preview first. Verify login/confirmation/reset/OAuth, upload isolation,
resume CRUD/autosave conflicts/offline recovery, public privacy, PDF output,
administrator role boundaries, audit logs, deletion/restoration, and the
retention job. Promote the exact tested commit, run migrations before traffic,
then observe errors, latency, and health for at least one normal traffic cycle.

## Rollback

Application rollback means redeploying the last known-good immutable Vercel
deployment. Database rollback means a forward corrective migration; never edit
an applied migration or run `migrate reset` in Production. When a migration
cannot be corrected forward within the incident RTO, stop writes, restore into
a new isolated database, validate it, rotate the application connection, and
retain the failed database for investigation.
