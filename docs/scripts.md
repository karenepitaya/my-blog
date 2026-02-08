# Server Scripts

## clear-database
Interactive MongoDB reset utility.
- Default behavior: drop all collections (documents + indexes).
- Optional: `--delete-only` to delete documents but keep indexes.
- Safety: requires explicit confirmation token (`DROP <dbName>`); `--yes` skips confirmation (dangerous).

## create-admin
Interactive admin creation helper.
- Supports CLI args or prompts without echoing passwords.
- Requires a second confirmation token (`CREATE <username>`).
- Idempotent: exits if the user already exists.

## export-frontend-content
Exports published articles into the frontend content format.
- Default is dry-run; use `--yes` to write files.
- `--out-dir` overrides the output directory.

## export-frontend-site-config
Exports `SystemConfig.frontend` to `frontend/src/site.config.ts` for build-time usage.
- Route B (publish-on-deploy) expects this to run before building the frontend.
- `--out` overrides the output path.

## init
Orchestrates safe operational scripts.
- `--reset-db` runs database cleanup (default drops collections).
- `--delete-only` keeps indexes when paired with `--reset-db`.
- `--create-admin` runs the admin creation flow.
- `--yes` skips the init confirmation (still passed to `clearDatabase`).

## purge-pending-delete-articles
Purges articles whose deletion grace period has expired.
- Deletes both Article meta and ArticleContent.
- `--yes` skips confirmation.

## purge-pending-delete-categories
Purges categories whose deletion grace period has expired.
- `--yes` skips confirmation.

## purge-pending-delete-users
Purges users whose deletion grace period has expired.
- Hard delete via MongoDB deleteMany.
- Only targets `status=PENDING_DELETE` with `deleteScheduledAt <= now`.
- Consider retention rules if you add user-owned content later.
