# Terminal Portfolio

A TypeScript portfolio with a Web Components terminal, Express backend, GitHub project metadata and an OpenAI-powered Machine Spirit. PostgreSQL stores editable portfolio text and project curation; AdminJS provides the authenticated editor.

## Local startup

Use Node 24 LTS (tested on 24.16.0), npm and a running local PostgreSQL database. Run commands from the repository root. The root `package-lock.json` controls workspace installs.

```bash
npm ci
npm run db:generate
```

Keep your existing `server/.env`. On a new checkout, copy `server/.env.example` to `server/.env` and replace its placeholders. Only `DATABASE_URL` supplies database credentials. Root `.env` is not loaded. Shell variables take precedence over `server/.env` in both Prisma CLI and Express.

```bash
npm run db:deploy
npm run db:seed
npm run admin:password
```

Copy the generated hash and session secret privately into `server/.env`, set `ADMIN_EMAIL`, and keep `ADMIN_ORIGIN=http://localhost:3001`, `PORT=3001`, `TRUST_PROXY=0` locally. The password prompt does not echo input. No default admin account/password is provided.

```bash
npm run build
npm run dev
```

Open the terminal at **http://localhost:3001/** and the editor at **http://localhost:3001/admin**. The development backend serves the built frontend; rebuild after frontend changes. `npm start` is for production and requires an HTTPS admin origin.

## Validation and documentation

```bash
npm test
npm run test:db
npm exec --workspace server -- playwright install chromium
npm run test:browser
```

Automated tests use injected GitHub/OpenAI fixtures. Database/browser tests create and remove a random schema on a loopback PostgreSQL server and never seed the development schema. Their database role needs `CREATE` on the local database. Browser installation requires internet access, but the browser tests block external requests.

- [Manual QA: setup, editor, terminal, failure recovery and Railway checks](docs/manual-qa.md)
- [Content architecture, schema, compatibility and migration workflow](docs/content-and-database.md)
- [Railway deployment: steps for you to perform](docs/railway-deployment.md)
- [Backups and restore practice](docs/backups.md)

Railway provisioning, configuration, deployment, production migrations and production seeding remain manual owner operations. Neither startup nor build migrates or seeds a database.
