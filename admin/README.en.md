# Admin Console

[中文](README.md)

This admin app talks directly to the `server` APIs.

---

## Requirements

- Node.js 18+
- pnpm
- `server` running at `http://localhost:3000`

---

## Setup

### 1) Install deps

```bash
pnpm install
```

### 2) Env (optional)

Copy `admin/.env.example` → `admin/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3) Start dev server

```bash
pnpm dev
```

Default port: `http://localhost:3001`

---

## Auth (HttpOnly Cookie)

Server sets HttpOnly cookies on login; frontend doesn’t store tokens.  
Requests include `credentials: 'include'` (already handled in code).

Key endpoints:
- Admin login: `POST /api/admin/auth/login`
- Admin logout: `POST /api/admin/auth/logout`

---

## Docs

- Env example: `admin/.env.example`
- Backend service: `server/README.en.md`
- API doc: `docs/API.en.md`
- Deployment: `docs/DEPLOYMENT.en.md`
