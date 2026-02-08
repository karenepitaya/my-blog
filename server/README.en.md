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

Copy `server/.env.example` → `server/.env` and set:

```
MONGO_USERNAME=...
MONGO_PASSWORD=...
MONGO_DBNAME=...
JWT_SECRET=...  # strong random string
```

Optional:
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
