# Manual QA

Run shell commands from the repository root in Bash. Terminal commands below are typed into the portfolio's browser terminal, not your shell. These checks deliberately edit local content; keep copies of text you want to restore.

**External-service labels:** **[GitHub]** means the check can call GitHub (including rate-limited API reads). **[OpenAI charge]** means an actual OpenAI request can incur a charge. Unlabelled content/editor checks need neither service. Automated tests use fixtures, never live GitHub or OpenAI.

## Local QA

### 1. Initial setup and a fresh database

Prerequisites: Node 24 LTS, npm, PostgreSQL running locally, a modern browser, and the ignored `server/.env` containing your local `DATABASE_URL`. The local role must be able to create tables; automated database tests also need database CREATE privilege for temporary schemas. `psql`, `createdb` and `pg_dump` are useful PostgreSQL client tools. Never use production credentials for these local checks.

The supplied local database has already had the migration and initial seed applied during implementation. To repeat the **fresh-database** check, create a separate empty local database rather than resetting your edited one. For example, using your existing local role and replacing `YOUR_LOCAL_ROLE`:

```bash
createdb -h 127.0.0.1 -U YOUR_LOCAL_ROLE -W portfolio_qa
```

Temporarily change only the database-name component of `DATABASE_URL` in `server/.env` to `portfolio_qa`. Keep a private copy of your previous value to restore after QA. If starting from an already empty supplied database, skip this creation step. The production database is never a QA target.

1. Confirm the environment file is ignored and untracked:

    ```bash
    git check-ignore server/.env
    git ls-files server/.env
    ```

    Expected: the first command prints the path; the second prints nothing. Do not print the file contents. Check for inherited shell `DATABASE_URL` without printing its value: `test -n "${DATABASE_URL+x}" && echo 'Shell DATABASE_URL overrides the file'`. Unset an unintended override with `unset DATABASE_URL`.

2. Install and generate from the root workspace:

    ```bash
    npm ci
    npm run db:generate
    npm run db:deploy
    npm run db:seed
    npm run db:status
    ```

    Expected on an empty database: the initial migration applies, seed reports **5 sections and 5 projects inserted**, and status says the schema is up to date. On the existing initialized database, seed should report **0 and 0**, preserving your changes. Do not run `migrate reset` or `db push`.

3. Generate your own administrator credentials:

    ```bash
    npm run admin:password
    ```

    Enter and confirm a password of 12–256 characters; input is hidden. Privately copy its generated `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` into `server/.env`. Set `ADMIN_EMAIL` to your chosen email. Keep the hash as a literal value; do not paste it unquoted into a shell command because it contains dollar signs. Set these local values:

    ```dotenv
    ADMIN_ORIGIN=http://localhost:3001
    PORT=3001
    TRUST_PROXY=0
    ```

    Expected: secrets stay server-side. Blank/placeholders are not working login credentials. GitHub/OpenAI keys are optional for basic CMS QA; remove placeholder key values if you are not configuring those services.

4. Build and start:

    ```bash
    npm run build
    npm run dev
    ```

    Keep this shell running. Open **http://localhost:3001/** and **http://localhost:3001/admin** in separate tabs. Use `localhost` consistently: `127.0.0.1` is a different Origin and will be rejected on admin saves with this configuration. Expected: the usual terminal boots, admin redirects to `/admin/login`, and your credentials open the editor. Startup gives a clear configuration error if the admin variables are missing. `npm start` enables production secure cookies and requires HTTPS; use `npm run dev` for this HTTP QA.

5. Run `about`, `skills`, `experience`, `contact`, then `projects`. Expected: original Leandro portfolio text and the following initial list. In AdminJS, open Content Sections and confirm five records, including `interests` (used by Machine Spirit). Open Featured Projects and confirm all five are featured:

    | Number | Display name       | GitHub identity                     |
    | ------ | ------------------ | ----------------------------------- |
    | 1      | ComboForge         | leandro-da-souza/comboforge         |
    | 2      | Terminal Portfolio | leandro-da-souza/terminal-portfolio |
    | 3      | Plantera Mera      | leandro-da-souza/examensarbete      |
    | 4      | Airbean            | leandro-da-souza/airbean            |
    | 5      | Grammer Assistant  | null-inc/grammer-assistant          |

    This list check does not call GitHub. For an already edited database, compare with AdminJS instead of expecting original text/order.

### 2. Edit every content section and inspect shared context

1. In AdminJS, open each of `about`, `skills`, `experience`, `contact` and `interests`, choose Edit, and append this text to its Body (replace SECTION with that section's key):

    ```text
    QA SECTION first line

      QA indented second line
    ```

    Save each record. Expected: success notice, persisted body, no editable key/id. Line breaks, blank lines and two leading spaces remain intact. A blank/whitespace-only body must show a validation error and retain the last saved value. Plain text containing `<b>QA</b>` should display literally, not become bold HTML.

2. Rerun the corresponding `about`, `skills`, `experience`, `contact` commands. Wait for the existing typing animation to finish before assessing output. Expected: the new text and whitespace appear immediately on this backend. Old terminal history remains unchanged. There is intentionally no `interests` command.

3. In another shell, run:

    ```bash
    npm run content:context -- --sections-only
    ```

    Expected: ABOUT, PERSONAL INTERESTS, EXPERIENCE, SKILLS and CONTACT all contain the saved QA markers and line breaks. This invokes the same context builder used before OpenAI requests, with projects omitted. It calls neither GitHub nor OpenAI and starts with a fresh content cache.

4. **[GitHub; no OpenAI charge]** To include current curated projects as well:

    ```bash
    npm run content:context
    ```

    Expected: the same sections plus featured projects with their stored numbers and GitHub metadata (or an explicit unavailable marker). Hidden projects are omitted.

5. **Optional [GitHub] [OpenAI charge]:** enter `machine-spirit` in the browser terminal, then ask about a QA marker you added. Expected: streamed response can refer to updated content; model wording is nondeterministic. Enter `exit` to leave the mode. Entering/exiting the mode alone does not call OpenAI. The app limits actual queries to five per hour per IP. The deterministic context command above is the primary content check.

### 3. Project creation, names, order and visibility

1. In Featured Projects choose New. Enter Owner `octocat`, Repo `Hello-World`, Display Name `QA Repository`, Position `6` (or another unused positive number if 6 is occupied). Leave Featured unchecked and Save. Expected: saved identity becomes lowercase; the new project is hidden and absent from `projects`.
2. Edit it, check Featured and Save. Run `projects`. Expected: `[6] QA Repository` appears (use your chosen number throughout). **[GitHub]** Run `project 6` and `project qa repository`: both select the same record and show the same metadata. Numeric selection uses the displayed position, not list index.
3. Change Display Name to `QA Renamed`. Save and rerun `projects`; expect the new name. **[GitHub]** `project qa renamed` selects it, while `project qa repository` says `Project not found.`. Spaces, capitalization and punctuation are normalized for name lookup.
4. To swap it with initial position 2, first ensure 100 is unused (including hidden rows). Move QA Renamed from 6 to 100 and Save; move Terminal Portfolio from 2 to 6 and Save; move QA Renamed from 100 to 2 and Save. Expected: `projects` is numerically ordered and no save permits duplicate positions. **[GitHub]** `project 2` selects QA Renamed and `project 6` selects Terminal Portfolio. Restore their original positions with the same temporary-slot method if desired.
5. Uncheck Featured for QA Renamed and Save. Expected: absent from `projects`; both its number and name now return `Project not found.`. Other numbers remain unchanged; gaps are expected. Check Featured again and Save; it reappears at its reserved number. Finish by hiding the QA repository if you do not want it public. The CMS deliberately has no Delete action.
6. Try saving Position `0`, `-1`, `1.5`, an empty value, and an existing number (including a hidden row's number). Try Owner `https://github.com/octocat`, Repo `owner/repo`, and a whitespace-only display name. Expected: a field error or browser input validation, no database change. Valid positions must be positive whole numbers. Restore valid values to continue.
7. Try New with the same owner/repo in different capitalization and an unused position. Expected: an owner/repository conflict and no duplicate row. The owner/repo pair, not just repo, is unique. Two different owners may have the same repo name.
8. Temporarily give two visible projects the same display name. Run `project <that name>`: expect the ambiguity message asking for a number. **[GitHub]** Each distinct displayed number must still select exactly one record. Restore the names afterward.

### 4. GitHub metadata and unavailable repositories

1. **[GitHub]** Run `project 1` (or another known working project) and compare its description, topics under Technologies, and Repository URL with that repository on GitHub. Expected: GitHub supplies all three. AdminJS has no description/topics/URL override fields. A repository with no description/topics can legitimately show a placeholder/empty list.
2. **[GitHub]** Edit the QA repository to use Repo `portfolio-qa-repository-that-does-not-exist-20261024`, retain a valid owner, and make it featured. `projects` still lists its curated name; its `project <number>` output says GitHub metadata is temporarily unavailable. Run another known project's detail command; it must still work.
3. Restore `hello-world`. Expected: recovery on the next lookup unless that identity already has a cached failed read; then wait 31 seconds and retry. Successful GitHub metadata can remain cached for five minutes. CMS name/order/visibility edits are independent of the metadata cache. A server restart clears both caches. Private repositories are deliberately treated as unavailable even if your token can read them.
4. Hide the QA repository when done. Tokens remain only in `server/.env` or server environment variables. An absent token can use public GitHub reads with lower rate limits; an invalid placeholder token can cause all metadata lookups to fail.

### 5. Authentication and sessions

1. In an incognito window visit `http://localhost:3001/admin/resources/ContentSection`. Expected: redirect to `/admin/login`; no content form. Run these requests in a shell with no cookies:

    ```bash
    curl -i http://localhost:3001/admin/api/resources/ContentSection/actions/list
    curl -i -X POST http://localhost:3001/admin/api/resources/ContentSection/records/about/edit \
      -H 'Origin: http://localhost:3001' -H 'Content-Type: application/json' \
      --data '{"body":"unauthorized change"}'
    ```

    Expected: HTTP 302 to login for both. Rerun `about`: no unauthorized change. A POST without the Origin header returns 403 even before authentication.

2. Try incorrect credentials once, then your correct credentials. Expected: invalid-credentials feedback followed by a working editor. Ten login attempts within 15 minutes trigger rate limiting; avoid exhausting it accidentally during other QA.
3. While logged in, inspect browser developer tools → Application/Storage → Cookies. Expected: `portfolio_admin`, HttpOnly, SameSite Lax, Path `/admin`, about eight hours expiry. Secure is intentionally absent on local HTTP. Inspecting browser scripts/storage must not reveal server credentials.
4. Stop only the backend with Ctrl+C and restart `npm run dev` using the same env values. Reload a protected admin page in the original browser. Expected: still authenticated because sessions are in PostgreSQL. Closing a browser that clears cookies or changing the session secret invalidates this check.
5. Choose Logout (or visit `http://localhost:3001/admin/logout`). Revisit the protected page. Expected: login required; the old session is invalidated. A wrong-Origin write must fail with 403:

    ```bash
    curl -i -X POST http://localhost:3001/admin/api/resources/ContentSection/records/about/edit \
      -H 'Origin: https://untrusted.example' -H 'Content-Type: application/json' \
      --data '{"body":"cross-origin change"}'
    ```

    Direct forbidden actions such as deletion can return an AdminJS error notice with HTTP 200 when authenticated; check the notice and unchanged record, not just status. Automated integration tests cover this behavior.

### 6. Restart persistence and safe seed reruns

1. Save an unmistakable text marker in About. Rename one **initial** project's display name and change its position to an unused value; record its old settings. Optionally change its repo temporarily to verify stable seed identity. Expected: saved changes are visible in AdminJS and `projects`.
2. Stop/restart the backend. Expected: text, name, identity, position and visibility survive. Session persistence is covered above.
3. With the same local `DATABASE_URL`, run:

    ```bash
    npm run db:seed
    npm run db:seed
    ```

    Expected: both report 0 sections and 0 projects inserted when all initial rows still exist. Your changed seed record remains changed, with no extra copy of its old identity. The five section rows and current project row count stay constant. Seeds never update existing CMS records. Restore any temporary repository identity before testing live GitHub again.

### 7. Database outage, caches and recovery — local only

This machine has a `postgresql.service` systemd unit. These commands affect every database on that local PostgreSQL service; finish other local database work first. Do not run this procedure against Railway.

1. While PostgreSQL and the backend are healthy, run `about` and `projects` to warm both 30-second content caches.
2. Stop the local database:

    ```bash
    sudo systemctl stop postgresql.service
    ```

    Immediately rerun those commands. Expected: a still-warm cache may respond normally for the remainder of its 30 seconds. An admin page/save may fail immediately because sessions require PostgreSQL independently of content caching.

3. Wait at least 31 seconds after the last successful database read; run `about` and `projects` again. Expected: `Portfolio content is temporarily unavailable. Please try again.`. In browser Network tools the command response is HTTP 503, with no credentials/SQL details. Existing output remains on screen. `help`, themes and clear still work locally. A missing GitHub response does not mask this content-store error. Do not run an AI query just to test this; unit tests already verify DB failure prevents OpenAI calls.
4. Restore the database:

    ```bash
    sudo systemctl start postgresql.service
    systemctl is-active postgresql.service
    ```

    Expected: `active`. Retry `about` and `projects` and reload AdminJS; no backend restart should be needed. Failed reads are not cached. Saved edits remain. If your PostgreSQL runs in a container/on another OS, use its matching stop/start commands instead of systemd. Always restore the database before proceeding.

### 8. Terminal regressions and automated checks

1. Run `help`, `about`, `skills`, `experience`, `contact`, `projects`, `project` without an argument, `project 99999`, an unknown command, `theme`, `theme invalid`, `theme rust`, `theme matrix`, `theme frost`, then `clear`. Expected: familiar output/messages, theme changes and cleared history display. **[GitHub]** A valid project detail lookup also retains its description/topics/repository layout.
2. Use ArrowUp/ArrowDown through command history and Tab on `abo`; expect completion to `about`. Click terminal background to focus, observe typing/scrolling, check contact links, and resize to a narrow/mobile viewport. Expected: terminal layout, styling and interactions stay intact; links open correctly. Following external links contacts those sites.
3. Enter `exit` in normal mode and click Reboot. Expected: shutdown/reboot animation and a usable terminal. Enter `machine-spirit`, then `exit` without asking a question. Expected: mode appearance changes and returns without an OpenAI request. An optional actual question is **[GitHub] [OpenAI charge]** as described earlier.
4. Run the focused checks:

    ```bash
    npm test
    npm run test:db
    npm exec --workspace server -- playwright install chromium
    npm run test:browser
    ```

    Expected: all pass, no live GitHub/OpenAI calls, development content unchanged. Playwright's browser installation downloads Chromium; install OS browser libraries if Playwright reports missing prerequisites. Database tests create/drop only their own random schema, even when you are editing local development content. They refuse remote database hosts. Never run them while a production database is forwarded to localhost.

5. Restore desired local text/projects through AdminJS, or retain the QA database separately. If you switched databases in step 1, restore the original local `DATABASE_URL` and restart the backend. Seed reruns are not a way to reset edited content.

## Railway QA — performed by you after deployment

Prerequisites: complete the [Railway deployment guide](railway-deployment.md), your manual production migration/seed, HTTPS domain, production admin credentials, and [backup setup/restore drill](backups.md). Substitute your actual HTTPS origin for `https://YOUR-DOMAIN` below. Do not run local outage tests on production.

1. Open `https://YOUR-DOMAIN/` and run `about` and `projects`. Expected: database-backed content and initial projects (or your saved curation). Your migration status check should show up to date. Inspect service logs for generic database/session errors; do not publish raw connection variables.
2. Visit `https://YOUR-DOMAIN/admin` logged out. Expected: HTTPS login. Log in and verify Content Sections/Featured Projects load; in browser cookie tools confirm Secure, HttpOnly, SameSite Lax and `/admin`. If login loops, check exact `ADMIN_ORIGIN`, HTTPS, `TRUST_PROXY=1`, session-table privileges and a stable secret.
3. Save a harmless About marker and change a display name. Rerun `about` and `projects`: expect the edit immediately on the saving instance, within 30 seconds across replicas. **[GitHub]** Check `project <number>` and `project <name>` select the same current record. Verify all GitHub fields still come from GitHub.
4. Verify Machine Spirit shares those edits without a charge using `npm run content:context -- --sections-only` from the temporary **production maintenance shell/tunnel** described in the deployment guide. A command against your normal local `.env` verifies only local content. **[GitHub; no OpenAI charge]** Omit `--sections-only` to inspect current project context too. **Optional [GitHub] [OpenAI charge]:** ask a real browser Machine Spirit question.
5. Redeploy the existing Express service yourself, keeping PostgreSQL's volume and all secrets unchanged. Expected: saved text/curation survive and the existing valid admin session still works. Run `about`/`projects` again after deployment. No startup migration or seed runs automatically.
6. If you intentionally rerun the production seed, do so yourself using the deployment guide's operator shell. Expected: no overwrites or duplicate seed records. Restore the harmless QA edits through AdminJS afterward.
7. Logout, then revisit protected pages in the original and incognito windows; expected: authentication required. Repeat the logged-out curl checks from local QA with your HTTPS origin substituted; expected: redirects/403 and unchanged content.
8. Confirm scheduled backups exist, an offsite logical dump is protected, and the [restore drill](backups.md) has been tested against a separate empty database. Review Railway usage, email alert and hard-limit settings; a hard billing limit can take services offline. You own ongoing credentials, access, billing, backup verification and production migration decisions.
