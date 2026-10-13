# Deploying Tally

Three independently hosted pieces:

| Piece | Host | What runs there |
| --- | --- | --- |
| `apps/web` | Vercel | Next.js 16 front end, talks to the API from the browser |
| `apps/api` | Render | Express API, holds the database credentials and the session secret |
| PostgreSQL | Neon | The only stateful component |

The web and API deploy separately and share nothing but a URL and a cookie, so
either can be redeployed without the other.

---

## Read this first: the domain decides whether sign-in works

The browser classifies a request to `api.example.com` from `example.com` as
**same-site**, and a request to `tally-api.onrender.com` from
`tally.vercel.app` as **cross-site**. That distinction is entirely about the
registrable domain — it has nothing to do with CORS, and `credentials:
"include"` does not override it.

Sessions here live in a cookie, so the classification decides everything:

| Setup | Cookie setting | Result |
| --- | --- | --- |
| `tally.example.com` + `api.tally.example.com` | `SameSite=Lax` | Works everywhere. Strictest option. |
| `tally.vercel.app` + `tally-api.onrender.com` | `SameSite=None; Secure` | Works in Chrome and Firefox. **Safari blocks it.** |

`SameSite=Lax` cookies are simply not attached to cross-site fetches. If you
deploy on the default `*.vercel.app` / `*.onrender.com` hostnames and leave the
cookie at `lax`, sign-in appears to succeed and then every following request
looks signed out — the API sees no cookie and answers 401. This is the single
most common way this deployment fails.

The API picks `none` automatically when `NODE_ENV=production`, so the default
hostnames work. **If you can point a domain you own at both services, do that
first** and set `COOKIE_SAME_SITE=lax`: Safari's third-party cookie blocking
otherwise logs out every Safari user, and iOS browsers are all Safari.

---

## Step 1 — Neon

1. Create a project. Choose the region closest to both your users and your
   Render region — Frankfurt (`aws-eu-central-1`) is the usual choice for
   East Africa, and Render has a Frankfurt region to match.
2. Create the database (Neon's default `neondb` is fine; the schema is applied
   by migrations, not by hand).
3. From **Connect**, copy **two** connection strings:
   - the **pooled** one — the host contains `-pooler` — for `DATABASE_URL`
   - the **direct** one, for `DATABASE_URL_UNPOOLED`
4. Make sure each ends with `?sslmode=require` (Neon includes it; if you paste a
   bare URL, add it). `verify-full` is stricter and also works — the API
   defaults to it for any non-local host that does not state an `sslmode`.

Migrations run over the **direct** URL. Neon's pooled endpoint is PgBouncer in
transaction mode and cannot hold the session that DDL and advisory locks need.
The API itself uses the **pooled** URL, which is what survives serverless
connection churn.

Apply the schema from a workstation:

```bash
export DATABASE_URL='postgres://…-pooler…?sslmode=require'   # pooled host
export DATABASE_URL_UNPOOLED='postgres://…?sslmode=require'  # direct host
bun run db:migrate
```

There is no drift expected: `apps/api/drizzle/` holds migrations `0000`–`0002`
plus their snapshots, and `apps/api/src/db/schema.ts` matches the newest one.
`bun run db:generate` should report nothing to generate.

Load demo data only if you want it — `bun run db:seed` creates a demo creator
with a random password. Promote an existing account to admin by setting
`ADMIN_EMAIL` to its address and running `bun run admin:promote`.

---

## Step 2 — Render (API)

**Repository root is the service root.** Do not set a root directory to
`apps/api`: the lockfile and the workspace live at the top, and building from
the package folder makes Bun resolve dependencies without them.

| Setting | Value |
| --- | --- |
| Runtime | Node, with `BUN_VERSION=1.3.14` |
| Build command | `bun install --frozen-lockfile && bun run --cwd apps/api build` |
| Start command | `bun run --cwd apps/api start` |
| Health check path | `/health` |
| Region | same continent as Neon |

`bun.lock` pins the dependency graph, and the root `package.json` pins Bun
itself, so the build is reproducible. If Bun turns out not to be selectable,
`node apps/api/dist/server.js` runs the same compiled output on Node 22.

Environment variables:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** URL, `?sslmode=require` |
| `WEB_ORIGIN` | Vercel URL(s), comma-separated — see step 4 |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `true` |
| `COOKIE_SAME_SITE` | `none` on default hostnames, `lax` on a shared domain |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | a real mailbox provider |
| `FEATURED_POLL_CHARGE_MINOR` | `10000`, or your price |
| `ADMIN_EMAIL` | optional |

**Do not skip SMTP.** Registration sends a verification email, and with
`NODE_ENV=production` and no SMTP configuration the mailer throws rather than
printing to the console — so sign-up returns a 500 and nobody can create an
account. Login also requires a verified address, so an unconfigured mailer
means the app has no way in at all.

Run migrations as a **pre-deploy command** (`bun run --cwd apps/api db:migrate`)
so a broken migration fails the release instead of shipping code against a
schema it does not match. Pre-deploy commands need a paid instance type; on the
free plan run the migration from a workstation before deploying, as in step 1.

Free instances sleep after 15 minutes idle and take a few seconds to wake. That
is fine for a demo and wrong for anything people rely on.

---

## Step 3 — Vercel (web)

1. Import the repository.
2. **Root Directory: `apps/web`.** Vercel detects the workspace from the root
   lockfile and installs there, so no other build setting needs changing.
   Framework preset is detected as Next.js.
3. Environment variable, for **Production, Preview and Development**:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_BASE_URL` | `https://<your-render-service>.onrender.com/api/v1` |

Note the `/api/v1` suffix, and note the scheme: `https`, not `http`. Do not add a
trailing slash — request paths are appended directly to this value, so a trailing
slash produces `//polls`.

`NEXT_PUBLIC_*` is inlined into the JavaScript bundle **at build time**. Changing
the API URL requires a redeploy of the web app; setting it later has no effect
on an already-built deployment.

---

## Step 4 — Point them at each other

1. Deploy the API once so Render assigns its hostname.
2. Set `WEB_ORIGIN` on Render to the web app's origin(s). This is an allowlist
   for both CORS and the cookie-write origin check, so a missing entry means
   403s on every write:

   ```
   https://tally.vercel.app,https://*.vercel.app
   ```

   Exact entries first, wildcards after. A `*` matches exactly one hostname
   label, which covers Vercel's per-branch preview hostnames without letting the
   pattern reach a domain you do not control. The first entry without a `*` is
   the one verification and password-reset emails link back to.
3. Redeploy the API so the new origin list is picked up.
4. Deploy the web app, then walk the checklist below.

---

## Verification checklist

- `https://<api>/health` returns `{"status":"ok"}`.
- `https://<api>/ready` returns `{"status":"ready"}` — this one actually queries
  Neon, so a green `/health` with a failing `/ready` means the database URL,
  TLS, or the pooled endpoint is wrong.
- Register an account and receive the verification email. A 500 here is almost
  always missing SMTP configuration.
- Sign in, then open DevTools → Application → Cookies. The session cookie must
  read `Secure` and `SameSite=None` (or `Lax` on a shared domain) and be present
  on `tally_session`. If it is missing after a reload, the cookie policy does
  not match the deployment shape — see the section at the top.
- Reload a dashboard page while signed in: the session must survive.
- Cast a vote. A 403 `INVALID_ORIGIN` means `WEB_ORIGIN` is wrong.
- Check the browser console for CORS errors on a preflight — a failed
  `OPTIONS` is the same allowlist problem.
- Create a poll, publish it, and confirm it appears on the public list.

---

## Operational notes

- **Rotate nothing into the browser.** The web bundle carries only
  `NEXT_PUBLIC_API_BASE_URL`. Every secret lives on Render.
- **Redeploy order.** Migrations are written to be additive, so deploying the
  API first is always safe. Deploy the API before the web app when an endpoint
  changes shape.
- **Neon suspends idle computes.** The first request after a quiet spell pays a
  few hundred milliseconds. `/ready` is the endpoint that wakes it.
- **Backups.** Neon's history window is the recovery story; verify the plan's
  retention matches what you are willing to lose, and test a restore before you
  need one.
- **Payment is not wired.** M-Pesa/Daraja is unimplemented by design: intents
  stay `created` with `provider: "not_configured"`, and polls that charge voters
  are refused with 402. Featured polls therefore cannot be published, since
  publishing one requires a settled creator charge. Deploy with that
  understanding, or finish the billing integration first.