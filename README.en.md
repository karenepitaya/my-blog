# MultiTerm Blog (Monorepo)

[中文](README.md)

This repo includes **Server / Admin / Frontend**:
- `server/`: Node.js + Express + MongoDB API service  
- `admin/`: React + Vite admin console  
- `frontend/`: Astro public site  

---

## Structure

```
.
├─ server/       # API service
├─ admin/        # Admin console
├─ frontend/     # Public site
├─ scripts/      # Local bootstrap/seed scripts (git-ignored)
└─ review-code/  # Review artifacts (git-ignored)
```

---

## Requirements

- Node.js 18+ (20+ recommended)
- pnpm
- MongoDB

---

## Quick Start (Local Dev)

### 1) Install deps

```bash
pnpm -C server install
pnpm -C admin install
pnpm -C frontend install
```

### 2) Env config

**Server (required)**  
Copy `server/.env.example` → `server/.env` and set:

```
MONGO_USERNAME=...
MONGO_PASSWORD=...
MONGO_DBNAME=...
JWT_SECRET=...  # strong random string
```

**Admin (optional)**  
Copy `admin/.env.example` → `admin/.env.local`:

```
VITE_API_BASE_URL=http://localhost:3000/api
```

**Frontend (optional)**  
Copy `frontend/.env.example` → `frontend/.env.local`:

```
PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 3) Run dev

```bash
pnpm -C server dev
pnpm -C admin dev
pnpm -C frontend dev
```

Default ports:
- Server: `http://localhost:3000`
- Admin: `http://localhost:3001`
- Frontend: `http://localhost:4321`

---

## Auth (HttpOnly Cookie)

- Server sets HttpOnly cookies on login (frontend doesn’t store tokens).
- Frontend requests must use `credentials: 'include'` (already in admin).

Main endpoints:
- Admin login: `POST /api/admin/auth/login`
- Admin logout: `POST /api/admin/auth/logout`
- Author login: `POST /api/auth/login`
- Author logout: `POST /api/auth/logout`

---

## One‑click bootstrap + seed (DB reset)

> ⚠️ `up -Yes` **drops collections** and wipes DB data.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-test-system.ps1 up -Yes
```

See `scripts/README.md` for details.

---

## Docs index (中文 / English)

- Server: `server/README.md` / `server/README.en.md`
- Admin: `admin/README.md` / `admin/README.en.md`
- Frontend: `frontend/README.md` / `frontend/README.en.md`
- API: `docs/API.md` / `docs/API.en.md`
- Deployment: `docs/DEPLOYMENT.md` / `docs/DEPLOYMENT.en.md`
- Env examples: `server/.env.example`, `admin/.env.example`, `frontend/.env.example`
