# Backups and restore practice

You perform these operations. Use the production operator tunnel/shell from the [deployment guide](railway-deployment.md#3-connectivity-and-operator-access). Never overwrite the edited development database to test a backup.

## Configure Railway backups

1. In PostgreSQL → Backups, enable daily snapshots (six-day retention), plus weekly (one month) or monthly (three months) if desired. Take a manual snapshot before schema changes and wait for completion.
2. Keep a protected offsite logical dump too: deleting/wiping a volume can delete its associated backups. Railway snapshot storage is billed incrementally at volume rates.
3. For tighter recovery windows, consider Railway PITR. It archives WAL and base backups to a bucket; storage/egress costs apply. Confirm the first backup/archive is healthy before relying on it.
4. A volume restore is an owner-triggered staged change: select a dated backup, inspect the restored volume change, then deploy it. It restores that service's data to the snapshot time, potentially losing newer edits. First capture the current state if possible and plan downtime.

[Railway's current backup and restore guide](https://docs.railway.com/guides/postgres-backups-restores).

## Make a portable logical backup

Prerequisites: PostgreSQL client utilities of the server's major version (or a compatible newer `pg_dump`), an operator connection, and private storage outside this repository. The following runs in the temporary Bash shell with the raw tunnel `DATABASE_URL` already set. Choose a unique dated filename and replace the example path with your backup directory:

```bash
umask 077
mkdir -p "$HOME/portfolio-backups"
PORTFOLIO_BACKUP_FILE="$HOME/portfolio-backups/portfolio-$(date -u +%Y%m%dT%H%M%SZ).dump"
PGDATABASE="$DATABASE_URL" pg_dump --format=custom --no-owner --no-acl --file="$PORTFOLIO_BACKUP_FILE"
pg_restore --list "$PORTFOLIO_BACKUP_FILE"
```

Expected: successful exit, a nonempty archive with ContentSection, FeaturedProject, admin_session and migration-history entries. Do not treat `--list` alone as proof of recoverability. Keep this file encrypted/protected offsite; sessions are sensitive. No password is placed in the literal command/history. The environment still contains credentials, so use your private machine/session.

Custom-format dumps capture a consistent database snapshot and support `pg_restore`; roles are cluster-level objects and are not included by `pg_dump`. `--no-owner --no-acl` avoids copying ownership/grants into a different environment. [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html).

## Restore drill into a separate empty database

1. Create a new empty scratch database on a compatible PostgreSQL major, separate from production and development. For a local role you control, replace `YOUR_LOCAL_ROLE`:

    ```bash
    createdb -h 127.0.0.1 -U YOUR_LOCAL_ROLE -W portfolio_restore_check
    ```

2. Read that scratch database's raw URL privately. Confirm identity before restoring:

    ```bash
    read -rsp 'Scratch restore database URL: ' PORTFOLIO_RESTORE_URL
    printf '\n'
    PGDATABASE="$PORTFOLIO_RESTORE_URL" psql -X -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user;'
    pg_restore --dbname="$PORTFOLIO_RESTORE_URL" --exit-on-error --single-transaction --no-owner --no-acl "$PORTFOLIO_BACKUP_FILE"
    PGDATABASE="$PORTFOLIO_RESTORE_URL" psql -X -v ON_ERROR_STOP=1 -c 'SELECT count(*) FROM "ContentSection"; SELECT count(*) FROM "FeaturedProject"; SELECT "key", length(body) FROM "ContentSection" ORDER BY "key";'
    ```

    Expected: restoration succeeds atomically; counts and chosen known text markers match the backup. Do not add `--clean` to target a database with wanted data. [PostgreSQL pg_restore options](https://www.postgresql.org/docs/current/app-pgrestore.html).

3. With dependencies installed, verify the restored migration history and shared context from the repository root:

    ```bash
    DATABASE_URL="$PORTFOLIO_RESTORE_URL" npm run db:status
    DATABASE_URL="$PORTFOLIO_RESTORE_URL" npm run content:context -- --sections-only
    ```

    Expected: up-to-date migrations for the backed-up commit and restored text. A newer checkout can legitimately have pending migrations; first validate against the backup's recorded commit. Context inspection here makes no GitHub/OpenAI requests.

4. For a real recovery, restore into a new production database/service, re-create the runtime role/grants from the deployment guide, validate against a compatible app version, and switch the backend's database reference yourself. Test both content reads and admin saves before allowing edits. Rotate the admin session secret to invalidate restored sessions. Retain the old database until you have confirmed recovery and any desired newer content reconciliation.
5. Record backup time, source PostgreSQL version, Git commit, restore test date, counts and results in your private operations notes. Verify periodically and after schema changes. A backup script or successful upload without a restore test is incomplete evidence.

If restoration fails, stop and keep the original database and archive intact. Check client/server versions, disk space, privileges and the first reported error. Do not seed over a failed restore to make it appear complete. Database backups do not preserve Railway configuration or server secrets; keep those separately in your password manager/private operations records.
