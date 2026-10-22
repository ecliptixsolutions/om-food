# OM Food and Spices LLP

Existing TanStack Start application, continued without replacing the homepage or shared design.

## Local development

Use Node.js and the existing lockfile: `npm ci`, then `npm run dev`.
Run `npm run build`, `npx tsc --noEmit`, and `npm test` before release.
On Windows PowerShell with restricted script execution, use `npm.cmd` and `npx.cmd`.
The existing Lovable/Nitro configuration builds a Cloudflare worker. Use the connected Lovable project for publishing, or configure the generated `.output/server/wrangler.json` for the intended Cloudflare account. No deployment was performed in this continuation.

## Server configuration

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server-only secrets in Lovable Cloud. Never use a VITE prefix for the privileged key.
Apply the two existing SQL migrations in `drizzle/migrations` to the connected database, in order. They create inquiry storage, RLS and the service-role-only rate-limit function. Verify grants and policies in that environment.
The form validates requests on the server, rejects a filled honeypot, and uses the existing database rate limit. The `cf-connecting-ip` header must be supplied by a trusted Cloudflare proxy; do not expose the origin to arbitrary spoofed requests. Outside that environment, configure a trusted client-address source before launch. Missing client addresses share the fallback rate limit.
Success means a database insert was accepted. Email notifications are NOT configured. Arrange a secure server-side email integration or a monitored database inbox before collecting real buyer inquiries. Do not interpret database storage as an emailed notification.

## Content and SEO

Set `VITE_SITE_URL` to the official HTTPS origin before building. Until then canonical URLs and `/sitemap.xml` use `https://example.com`. Add the final absolute sitemap URL to `public/robots.txt` after confirming the domain.
Product descriptions live in `src/lib/product-catalog.ts`; categories are explicitly described as proposed inquiry topics, not guaranteed inventory. Confirm availability before marketing them as available products.
The existing photographs were preserved. Distinct verified photography is still needed for minced onion, granules and powder; current images are shared illustrative dehydrated ingredients. Confirm image licenses. Replace the temporary wordmark/favicon with approved company branding if supplied. Social preview SVG is a draft; export a PNG/JPEG before social launch for wider crawler compatibility.
Privacy and terms pages are prominently marked drafts. Business approval, retention/access procedures and provider review remain required. WhatsApp links use the requested business number 918140712205. Confirm the business WhatsApp account is active before launch. No analytics are configured.

## Verification and outstanding work

See `roadmap.md` for the continuation report. No credentials were exposed, migrations applied, buyer inquiry sent, or public deployment performed during this continuation.

## Floating enquiry and WhatsApp

The left Quick Enquiry dialog collects exactly name, email and phone, validates them locally, and opens WhatsApp directly from the Submit action. Visitors must press Send in WhatsApp. A fallback link and entered values remain visible if a popup is blocked; no message delivery is claimed. This widget does not use the quote backend or save/email leads. Existing server-backed quote forms are unchanged.

All WhatsApp actions use `src/lib/whatsapp.ts` for the number and URL encoding. The floating button, contact details and product-specific WhatsApp links share this destination. No API key, WhatsApp API, email service or database migration is needed for this handoff. The icon source and CC0 license are recorded in `public/whatsapp-license.txt`.

The hero's visible arrow/dot/play control panel has been removed. Autoplay remains 2200 ms with 600 ms rolling transitions. Focus the carousel and press Space to pause/resume, or Left/Right to navigate. Reduced motion pauses autoplay initially and disables sliding animation; Space can explicitly resume nonanimated changes.
