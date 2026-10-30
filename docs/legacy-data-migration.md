# Legacy data migration

The locally committed legacy schema defines `public.quote_inquiries` and `public.quote_inquiry_rate_limits`. Only `quote_inquiries` contains business records. It has no status field, so imported records receive the MySQL default status `new`; IDs, UTC creation timestamps (to microsecond precision), consent, and inquiry fields are preserved. Rate-limit rows are temporary protection state and are intentionally not copied.

The local application catalogue is code-backed and the legacy migrations contain no product or media tables. This does not prove that no records exist in the hosted Supabase project or an external media service. Obtain a source row count and media inventory before declaring reconciliation complete.

## Quote inquiry importer

An authorized operator should export from the legacy provider's read-only SQL/table export interface. First record the source count with `SELECT count(*) FROM public.quote_inquiries;`, then export this ordered result as CSV (include the header row):

```sql
SELECT id, created_at, full_name, company_name, business_email, phone, country,
       product_interest, required_quantity, packaging_preference, destination,
       delivery_timeline, message, privacy_consent
FROM public.quote_inquiries
ORDER BY created_at, id;
```

Use a read-only source credential where the provider permits it. Store the downloaded file directly in access-controlled, encrypted storage. Do not attach it to email, upload it to a public/shared drive, or commit it. Export only these fields:

| Legacy field | MySQL field | Handling |
| --- | --- | --- |
| `id` | `id` | Preserve UUID; duplicate IDs must have identical row contents. |
| `created_at` | `created_at` | Normalize to UTC and preserve up to six fractional digits. |
| `full_name` | `full_name` | Preserve, maximum 120 characters. |
| `company_name` | `company_name` | Preserve, maximum 160 characters. |
| `business_email` | `business_email` | Preserve, maximum 255 characters. |
| `phone` | `phone` | Preserve, maximum 40 characters. |
| `country` | `country` | Preserve, maximum 100 characters. |
| `product_interest` | `product_interest` | Preserve, maximum 120 characters. |
| `required_quantity` | `required_quantity` | Preserve, maximum 120 characters. |
| `packaging_preference` | `packaging_preference` | Preserve, maximum 200 characters. |
| `destination` | `destination` | Preserve, maximum 200 characters. |
| `delivery_timeline` | `delivery_timeline` | Preserve, maximum 120 characters. |
| `message` | `message` | Preserve, maximum 3000 characters. |
| `privacy_consent` | `privacy_consent` | Accept only boolean `true` or `false`. |

The importer validates the historical fields against the MySQL schema, handles quoted CSV fields, prints counts only, and defaults to a dry run. It refuses conflicting target rows; skips already-identical rows; and wraps writes in one MySQL transaction when `--apply` is supplied. The source rate-limit table is not exported or changed. Do not include customer names, emails, phone numbers, or message contents in audit notes. Restrict access to the operator and remove temporary copies after approved reconciliation, following the organization's retention policy. Reconcile exported and imported counts; investigate any difference and compare a privacy-safe digest generated inside the restricted environment. Never log row content. A successful importer exit is not itself proof of source-to-target reconciliation.

Keep the export in the ignored `private-migration-data/` directory or outside the repository. Set `MYSQL_URL` in an ignored local `.env.local` file or a secure process environment:

- `MYSQL_URL`

Use a dedicated non-production MySQL database first. The target database name must match the explicit argument, which prevents accidental writes to a differently named database:

```sh
node scripts/import-legacy-inquiries.mjs --input=private-migration-data/quote_inquiries.csv --target-database=om_food_staging
node scripts/import-legacy-inquiries.mjs --input=private-migration-data/quote_inquiries.csv --apply --target-database=om_food_staging
```

The first command connects to MySQL to compare existing records, but performs no writes. The second writes only missing inquiry IDs. This importer has not been run because no legacy export or MySQL credentials are available here.

Synthetic unit coverage exercises duplicate IDs, conflicting source and target records, invalid dates, empty files, quoted CSV fields, dry runs, simulated interruption/rollback, and repeat runs using mocks. These are not actual MySQL tests. Before any production cutover, record the source inquiry count, run a dry run against a staging copy, apply there, and reconcile counts and a privacy-safe hash/count report. Investigate all conflicts before retrying. No real export has been supplied or imported, so no inquiry data is claimed migrated. Media migration remains separate because no source media schema or object-store inventory is available locally.
