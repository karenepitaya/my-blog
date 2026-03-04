# API Server

[中文](README.md)

Node.js + Express + MongoDB backend providing admin / author / public APIs.

---

## Requirements

- Node.js 18+
- pnpm
- MongoDB

---

## Env

### First-time Setup

**Quick Option (Recommended for Local Dev)**: Configure MongoDB without authentication (no `authorization: enabled`), then in `.env`:
```bash
MONGO_USERNAME=""
MONGO_PASSWORD=""
MONGO_DBNAME=myblog
```

**Full Option**: If you need MongoDB access control enabled, see detailed instructions in project root `README.md`.

### Configure .env

Copy `server/.env.example` → `server/.env`:

```bash
# Option A: No authentication (recommended for local dev)
MONGO_USERNAME=""
MONGO_PASSWORD=""
MONGO_DBNAME=myblog
JWT_SECRET=your_random_secret

# Option B: With authentication (MongoDB has access control enabled)
# MONGO_USERNAME=bloguser
# MONGO_PASSWORD=your_password
# MONGO_DBNAME=myblog
# MONGO_AUTH_SOURCE=admin
```

### Other Optional Config

- `PORT` (default 3000)
- `UPLOAD_DIR` (single path segment only; no `/` or `..`)

---

## Run

```bash
pnpm install
pnpm dev
```

Build / start:

```bash
pnpm build
pnpm start
```

---

## Auth (HttpOnly Cookie)

Server sets HttpOnly cookies on login; frontend doesn’t store tokens.  
Middlewares still accept `Authorization: Bearer ...` for compatibility/scripts.

Key endpoints:
- Admin login: `POST /api/admin/auth/login`
- Admin logout: `POST /api/admin/auth/logout`
- Author login: `POST /api/auth/login`
- Author logout: `POST /api/auth/logout`

---

## Local scripts

See `scripts/README.md` at repo root for bootstrap/seed helpers.

---

## Docs

- API doc: `docs/API.en.md`
- Deployment: `docs/DEPLOYMENT.en.md`
