# Server Scripts

These scripts are intended for local development / testing. Do not run destructive scripts in production.

## How To Run

From `server/` so `.env` is loaded:

```bash
cd server
pnpm ts-node src/scripts/init.ts --help
```

## Env Vars

Scripts load `server/.env`. Either set `MONGO_URI`, or use the split variables:

- `MONGO_USERNAME`
- `MONGO_PASSWORD`
- `MONGO_HOST`
- `MONGO_PORT`
- `MONGO_DBNAME`

Also required:

- `JWT_SECRET`

Optional for `createAdmin.ts`:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## init.ts (recommended entry)

```bash
pnpm ts-node src/scripts/init.ts --create-admin
pnpm ts-node src/scripts/init.ts --reset-db
pnpm ts-node src/scripts/init.ts --reset-db --delete-only
```

## clearDatabase.ts

```bash
pnpm ts-node src/scripts/clearDatabase.ts
pnpm ts-node src/scripts/clearDatabase.ts --delete-only
```

## createAdmin.ts

```bash
pnpm ts-node src/scripts/createAdmin.ts
pnpm ts-node src/scripts/createAdmin.ts --username admin --password "passw0rd"
```

Notes:
- The system supports **exactly one** admin account.
- `createAdmin.ts` will refuse to create a second admin if one already exists.

## purgePendingDeleteUsers.ts

Hard deletes users whose deletion grace period has expired.

```bash
pnpm ts-node src/scripts/purgePendingDeleteUsers.ts
pnpm ts-node src/scripts/purgePendingDeleteUsers.ts --yes
```

## purgePendingDeleteCategories.ts

Hard deletes categories whose deletion grace period has expired.

```bash
pnpm ts-node src/scripts/purgePendingDeleteCategories.ts
pnpm ts-node src/scripts/purgePendingDeleteCategories.ts --yes
```

## purgePendingDeleteArticles.ts

Hard deletes articles whose deletion grace period has expired (also deletes linked `ArticleContent`).

```bash
pnpm ts-node src/scripts/purgePendingDeleteArticles.ts
pnpm ts-node src/scripts/purgePendingDeleteArticles.ts --yes
```

## exportFrontendContent.ts

Exports published articles from MongoDB into the `frontend/` content folder format (dry-run by default).

```bash
pnpm ts-node src/scripts/exportFrontendContent.ts --help
pnpm ts-node src/scripts/exportFrontendContent.ts
pnpm ts-node src/scripts/exportFrontendContent.ts --yes
pnpm ts-node src/scripts/exportFrontendContent.ts --yes --out-dir ../frontend/src/content/posts/_generated
```
