# Isolated MySQL staging validation

This procedure is for a disposable, isolated staging database only. It does not
configure production and does not migrate legacy data. Keep Supabase available
until staging tests and a source-to-target reconciliation are explicitly
approved.

## Prerequisites and variables

- MySQL 8.0-compatible server with a dedicated empty database named
  `om_food_staging` (or another clearly non-production name).
- Node.js version from the project toolchain and `npm ci`.
- `MYSQL_URL`: connection URL used by the schema migration and application.
  Put it in an ignored `.env.local` or inject it through the shell; never paste
  the value into logs, tickets, or this repository.
- `MYSQL_TEST_URL`: optional separate URL for future database-backed test
  runners. It must identify a disposable test database and must never point to
  production. Current Vitest coverage is mocked and does not consume this
  variable.

The migration account needs `CREATE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE`,
and `REFERENCES` privileges scoped to the staging database. The runtime account
needs only the operations used by the app: `SELECT`, `INSERT`, `UPDATE`, and
`DELETE`; media writes also require `INSERT`. Keep migration/provisioning
credentials separate from runtime credentials when the host supports it.

## Prepare and run

1. Create a new, empty staging database and a dedicated user through the MySQL
   administrator interface. Do not point these instructions at production.
2. Add `MYSQL_URL` to ignored `.env.local`; confirm the selected database name
   is the staging database without printing the URL.
3. Run `npm ci`, then `npm run db:migrate:mysql`. The migration uses
   `CREATE TABLE IF NOT EXISTS`, verifies all nine tables, their columns,
   engines, indexes, unique constraints, and foreign keys, then records
   `001_initial`. MySQL DDL can implicitly commit: failure may leave some
   tables created, but the version is not recorded until verification and seed
   operations succeed. Correct a reported mismatch with a reviewed additive
   migration; do not drop or recreate tables.
4. Run `npm test`, `npx tsc --noEmit`, and `npm run build`. These validate
   application logic but do not prove MySQL connectivity.
5. Run `npm run db:migrate:mysql` a second time. Confirm it passes without
   duplicating seed products or migration records. Inspect `schema_migrations`
   for exactly one `001_initial` row and check that the nine expected tables
   exist.
6. If a MySQL integration runner is added, set `MYSQL_TEST_URL` to a second
   disposable database and require the runner to refuse a database name that
   is not explicitly marked for tests. Do not reuse the legacy import target
   or any production URL.

Migration schema tables: `schema_migrations`, `admin_users`, `admin_sessions`,
`admin_login_attempts`, `products`, `quote_inquiries`, `quote_rate_limits`,
`admin_activity_logs`, and `admin_media`.

## Existing behavior and retention

Products use `draft`, `published`, and `archived` status. Archiving changes the
status and removes a product from public catalogue queries; it preserves its
row, slug, image URL, and audit context. There is no physical product-delete
operation. This avoids breaking references and losing history. No retention
period or purge policy is established in the application. `admin_media` blobs
are retained until a separately reviewed cleanup policy exists; deleting them
could break published product images. The only declared foreign key is
`admin_sessions.admin_id -> admin_users.id ON DELETE CASCADE`.

Media is public only while a `published` product references the exact local
URL `/api/media/<id>`. Uploads not referenced by a published product (including
draft and archived product media) return 404. Do not store private documents in
`admin_media`; the table is intended for product images.

## Current verification boundary

Unit tests in `src/test` use mocked MySQL handlers. No test in that suite is a
real MySQL integration test. A real staging result requires running the
migration twice and exercising login/session, product archive, quote insert,
rate limiting, and media access against the isolated server. Record server
version, database name (not URL), migration output, test command/output, and
row counts. Never include credentials or customer fields in the report.
