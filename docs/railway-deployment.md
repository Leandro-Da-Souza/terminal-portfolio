# Railway deployment — owner-operated steps

You perform every Railway account/resource change, deployment, production migration and seed. This implementation has not created Railway resources, changed your account or run production commands. Documentation was checked against official Railway and Prisma sources on **2026-10-24**; inspect the dashboard/current docs before acting.

## 1. Inspect the existing Express service

In your existing Railway project/environment, record the Express service's source branch, root directory, build/start commands, Node version, domain, region, replicas, health check and variables. Confirm which environment is production. Keep this service and its current domain; no hosting migration or second backend is needed. The repository does not prescribe a Railway-specific deployment file.

This workspace build needs `client`, `server`, `shared` and the root lockfile in the image. Compare your existing settings with these requirements before changing them:

| Setting                | Requirement                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| Working/root directory | Repository root, so workspace scripts and shared types are available                                  |
| Node                   | 24 LTS; locally tested on 24.16.0                                                                     |
| Install                | `npm ci` with build-time dev dependencies available (TypeScript, Prisma CLI)                          |
| Build                  | `npm run build`                                                                                       |
| Start                  | `npm start`                                                                                           |
| Listen                 | App uses Railway's `PORT` and binds `0.0.0.0`                                                         |
| Files retained         | `client/dist`, `server/dist`, `server/package.json`, runtime dependencies and generated Prisma client |
| Runtime write access   | `server/adminjs-assets` (disposable generated assets, not portfolio storage)                          |

`npm start` selects production mode. Neither build nor startup runs migrations/seeds. Keep any automatic deployment paused until you have completed the database/configuration steps for this release, or deploy the reviewed commit only after them. One backend replica and one PostgreSQL instance are proportionate initially. Review the [known dependency advisories](content-and-database.md#dependency-review-before-public-deployment-2026-10-25) before exposing the admin UI.

## 2. Create PostgreSQL with persistent storage

1. In that **same project and environment**, choose New → Database → PostgreSQL. Keep it in the backend's region. Use Railway's PostgreSQL template; note its actual PostgreSQL major/image version instead of assuming the newest one matches local development.
2. Open the new service's volume settings. Confirm a persistent volume is attached and that its mount path covers the actual PostgreSQL data directory (`PGDATA`). Keep the template's matching mount/PGDATA defaults; paths differ across image majors. A filesystem inside the container alone is not persistent storage. Record volume size and monitor free space.
3. Wait for healthy database startup. Leave Public Access/TCP proxy disabled for this deployment; private access and your maintenance tunnel suffice. Record the actual service name (examples below use `Postgres`). [Railway PostgreSQL setup and variables](https://docs.railway.com/databases/postgresql).
4. Enable scheduled backups and take a manual snapshot before later schema changes; follow [backups and restore](backups.md). A redeploy must keep this volume attached; never recreate/wipe it to resolve an application problem.

## 3. Connectivity and operator access

The backend should use PostgreSQL's **private hostname**, not `DATABASE_PUBLIC_URL`. Railway isolates private networks per environment and encrypts interservice traffic using WireGuard. This requires both services to share the project/environment. Local machines cannot resolve these private hostnames directly. [Private networking](https://docs.railway.com/networking/private-networking).

Use a current Railway CLI on your own machine for maintenance. Install/login according to the [official CLI guide](https://docs.railway.com/guides/cli), then from your reviewed checkout:

```bash
railway login
railway link
railway status
railway connect Postgres --environment production --tunnel-only
```

Select/replace the actual project, environment and service names. `--tunnel-only` opens an authenticated SSH tunnel and displays connection details; keep that terminal open and private. It does not require a public database proxy. Do not copy its credentials into issues/screenshots. [Official connect options](https://docs.railway.com/cli/connect).

In a **second Bash terminal**, enter a temporary subshell and paste the tunnel's operator URL at a hidden prompt:

```bash
bash
read -rsp 'Production tunnel operator DATABASE_URL: ' DATABASE_URL
printf '\n'
export DATABASE_URL
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user, version();'
```

Use the raw PostgreSQL URL provided by the tunnel (no Prisma-only `schema`/`pool_timeout` query parameters for `psql`). Confirm the target in both Railway and SQL before any mutation. This exported variable overrides the local `server/.env` without editing it. Use this shell only for the reviewed production maintenance steps; never run automated DB tests here. When finished, type `exit` to discard its variables and Ctrl+C the tunnel. Do not save the production URL in your development `.env`.

If the backend moves outside Railway later, the private hostname will no longer work. Prefer an authenticated private tunnel/VPN; otherwise deliberately enable a public TCP proxy and use TLS with trusted certificate verification for **both** Prisma and node-postgres (the session driver), restricted credentials and monitored access. A TCP proxy alone is not encryption. Prisma's and node-postgres's TLS options are not interchangeable; do not work around certificate failures with a global verification disable. This external-hosting path is not needed for your current deployment. [Prisma PostgreSQL connection/TLS options](https://www.prisma.io/docs/orm/v6/overview/databases/postgresql), [node-postgres SSL](https://node-postgres.com/features/ssl).

## 4. Apply reviewed migrations and seed — you run these

Use the operator tunnel shell above, on the exact reviewed commit that you will deploy. Install dependencies/generate locally first if needed (`npm ci`, `npm run db:generate`). No production service needs to run `migrate dev`, create a shadow database, or own a seed-on-start hook.

1. Read `server/prisma/migrations/*/migration.sql`. For the initial release it creates content/project/session tables, indexes and CHECK constraints. For subsequent releases take and verify a backup first. Keep old code running until this additive migration is ready.
2. Check status:

    ```bash
    npm run db:status
    ```

    Pending migrations on a new database are expected and may yield a nonzero exit code. Confirm they match the reviewed files.

3. Apply and seed sequentially, only continuing after each succeeds:

    ```bash
    npm run db:deploy
    npm run db:seed
    npm run db:status
    ```

    Expected on a new database: one initial migration, five sections and five projects inserted, then up-to-date status. Seed reruns insert only missing nonconflicting initial rows and never update CMS edits. Migrations record their history in `_prisma_migrations`. Keep migrations in Git, and apply the same files to each environment. [Prisma production migration workflow](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/development-and-production).

4. Inspect counts in the same operator shell:

    ```bash
    psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c 'SELECT count(*) FROM "ContentSection"; SELECT count(*) FROM "FeaturedProject";'
    npm run content:context -- --sections-only
    ```

    Expected: five of each initially and seeded text. The context command does not call GitHub or OpenAI.

**On failure:** stop; do not deploy the dependent app or run seeding after a failed migration. Check connectivity, role permissions, migration status and the failed migration's database log. Do not reset production or mark a migration applied just to silence an error. DDL may be partly applied; Prisma deploy does not automatically undo it. Restore into a separate database or complete/revert the failed steps deliberately, then use `prisma migrate resolve` only after reconciling actual state and history. [Prisma failed-migration recovery](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/patching-and-hotfixing). A failed seed transaction rolls back its inserts; fix the cause and rerun it. Share only redacted error details when troubleshooting.

## 5. Separate runtime and migration privileges

The database's bootstrap/owner account is an operator credential. Avoid keeping it in the running Express service. After migrations/seeding, create a restricted application role through `psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1` in your operator shell:

```sql
CREATE ROLE portfolio_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
\password portfolio_app
SELECT format('GRANT CONNECT ON DATABASE %I TO portfolio_app', current_database()) \gexec
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO portfolio_app;
GRANT SELECT, UPDATE ON TABLE "ContentSection" TO portfolio_app;
GRANT SELECT, INSERT, UPDATE ON TABLE "FeaturedProject" TO portfolio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE admin_session TO portfolio_app;
\q
```

`\password` prompts privately. These grants are for a dedicated, newly created portfolio database; assess other users before changing privileges on a shared database. Sections are fixed records, so runtime needs only reading/editing. Projects can be created/edited/hidden; sessions need deletion for logout/expiry. Runtime does not need migrations-table access, table creation, project deletion or database creation. Future migrations introducing tables must grant the intended privileges explicitly. Keep ownership/migration credentials available only to you for maintenance. A new role is provisioned once; on reruns inspect the existing role instead of recreating it. [PostgreSQL privileges](https://www.postgresql.org/docs/current/ddl-priv.html).

In PostgreSQL service variables, create a secret `APP_DATABASE_URL` using `portfolio_app`, its password, the private hostname/port and the existing database name. URI-encode special characters in user/password components. Keep the owner `DATABASE_URL` unchanged for operator access. In the Express service define:

```text
DATABASE_URL=${{Postgres.APP_DATABASE_URL}}
```

Substitute the actual service name. The usual `${{Postgres.DATABASE_URL}}` reference also resolves connectivity, but ordinarily uses the bootstrap role; the dedicated app reference above avoids that privilege. References track source variable changes and avoid copying secrets between services. Review/apply staged variable changes yourself. [Railway variable references](https://docs.railway.com/variables).

The internal connection relies on Railway's encrypted private network. If you enable PostgreSQL TLS as an additional layer, configure its trust chain for both clients and verify login as well as portfolio reads; do not blindly append public-TLS parameters to a working private URL.

## 6. Configure production admin and deploy the existing backend

Set these on the Express service, never as Vite/client variables:

| Variable               | Production value/purpose                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Reference to private application-role URL above                                          |
| `ADMIN_EMAIL`          | Your administrator login email                                                           |
| `ADMIN_PASSWORD_HASH`  | Literal output of local `npm run admin:password`; choose a production-only password      |
| `ADMIN_SESSION_SECRET` | Random generated secret, at least 32 characters; retain across deploys                   |
| `ADMIN_ORIGIN`         | Exact HTTPS origin, e.g. `https://portfolio.example.com`, with no path/query             |
| `TRUST_PROXY`          | `1` for the existing single Railway reverse-proxy hop; reassess if you add another proxy |
| `NODE_ENV`             | `production` (`npm start` also sets this)                                                |
| `PORT`                 | Railway-provided value; do not copy local 3001 over it                                   |
| `GITHUB_TOKEN`         | Optional server token for public repository API rate limits; minimum access needed       |
| `OPENAI_API_KEY`       | Your server key for live Machine Spirit requests; not needed for plain CMS reads         |

For individual Railway variable fields, paste the generated hash/secret value without the surrounding `.env` quotes or `NAME=` prefix. No `DB_*`, shadow URL or plaintext admin password is used by the runtime. Keep developer credentials and production credentials separate. Admin access is same-origin and authenticated; cookies use HttpOnly, SameSite=Lax and Secure in production, with persistent PostgreSQL sessions. Login loops commonly indicate wrong proxy/HTTPS settings, session-table grants, or a changed secret. Origin mismatch yields 403 on saves. There is no MFA; a second access gate can be added later if your threat model needs one.

Deploy the existing service yourself. Confirm the build generates Prisma Client and the start log appears only after AdminJS assets initialize. If assets 404, verify the writable non-hidden `server/adminjs-assets` path and retained runtime dependencies. If database reads fail, check both services' environment, private URL, app-role grants and migration status. Do not paste raw URLs into support logs.

Perform the [Railway QA checklist](manual-qa.md#railway-qa--performed-by-you-after-deployment): login, edit content, verify both consumers, then redeploy the backend and confirm edits and sessions survive. CMS edits invalidate the serving instance immediately; other replicas refresh within 30 seconds. **GitHub** metadata lookups and optional **paid OpenAI** queries are explicitly labelled there.

## 7. Costs and ongoing ownership

As checked on 2026-10-24, Hobby is $5/month with $5 included resource usage, Free has $1 monthly credit, and Pro is $20/month. Usage beyond included credit is billed. Listed rates: RAM $10/GB-month, CPU $20/vCPU-month, volume storage $0.15/GB-month, egress $0.05/GB. Your existing backend, new database, storage and backup consumption share the bill; a $5 plan is not a guaranteed $5 total. Measure actual usage after deployment instead of estimating from database row count. [Current plans/rates](https://docs.railway.com/pricing/plans).

Set a compute email alert below your chosen hard limit in Workspace Usage. A hard limit takes workloads offline; it is a budget boundary with an availability tradeoff. Review replica memory/CPU limits carefully, since overly low limits can crash the database. Private connectivity avoids unnecessary public egress. OpenAI charges are separate from Railway limits. [Cost controls](https://docs.railway.com/pricing/cost-control).

You own Railway configuration/deployments, database roles and secret rotation, migrations/seeding, budget alerts, capacity monitoring, backup schedules and successful restore drills. Keep track of the PostgreSQL image major and plan upgrades with a tested backup/restore path. Railway supplies the platform/database service; application data correctness, release decisions and proof that your backups restore remain yours.
