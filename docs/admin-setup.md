# Admin and MySQL setup

The admin console, catalogue edits, uploaded product images, audit records, and buyer quote enquiries use MySQL. Admin passwords are hashed with Node's `scrypt`; the browser receives only an HTTP-only session cookie. No public admin registration route exists.

## Configure MySQL

The server needs a reachable MySQL 8 database and a private connection string. For local setup, put `MYSQL_URL` in the ignored `.env.local` file; in deployment, add it as a server-side environment variable. Example format:

```text
mysql://app_user:strong-password@db-host:3306/om_food
```

Do not prefix it with `VITE_` or commit it to source control. The application uses the `mysql2` Node driver, so deploy to a Node.js runtime with outbound access to the MySQL host (for example, Vercel Node Functions). The default Cloudflare Workers runtime cannot open a regular MySQL TCP connection.

Run the idempotent schema and catalogue setup once:

```sh
npm run db:migrate:mysql
```

The migration creates the tables needed by the site and inserts the existing product catalogue if it is not already present. Back up the database before applying schema changes to a database that contains existing data.

## Provision the first admin

Choose an email address you control and generate a unique password of at least 16 characters. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` alongside `MYSQL_URL` in `.env.local`, or set all three as private deployment environment variables, then run:

```sh
npm run db:provision-admin
```

The script reads `MYSQL_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. It creates or resets that email as an active owner. Do not paste the password into source code, commit it, or share it in a chat. The admin signs in at `/admin/login`; accounts are provisioned by an operator and there is no public sign-up.

After login, verify product edits publish to the catalogue, image uploads return from `/api/media/:id`, and enquiry status changes persist. Confirm the quote form inserts enquiries and rejects repeat submissions within 60 seconds. Five failed sign-ins for the same email trigger a 15-minute lockout. The session cookie is HTTP-only, SameSite=Lax, and Secure in production, with a 12-hour lifetime.

## Roles and scope

The schema supports owner, manager, editor, sales, and viewer roles. Product edits are limited to owner/manager/editor; enquiry status changes are limited to owner/manager/sales. The current dashboard covers catalogue editing, enquiry review, WhatsApp follow-up, and recent activity. Other site content and admin-user management do not have dashboard editors yet.
