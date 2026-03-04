# MultiTerm Blog (Monorepo)

[中文](README.md)

This repository contains three sub-projects: **Server / Admin / Frontend**:
- `server/`: Node.js + Express + MongoDB API service  
- `admin/`: React + Vite admin dashboard  
- `frontend/`: Astro frontend site  

---

## Directory Structure

```
.
├─ server/       # API service
├─ admin/        # Admin dashboard
├─ frontend/     # Frontend site
├─ scripts/      # Local startup/seed scripts (git-ignored by default)
└─ review-code/  # Review artifacts (git-ignored by default)
```

---

## Requirements

- Node.js 18+ (recommended 20+)
- pnpm
- MongoDB

---

## Quick Start (Local Development)

### 1) Install Dependencies

```bash
pnpm -C server install
pnpm -C admin install
pnpm -C frontend install
```

### 2) Start MongoDB

If you haven't installed MongoDB yet:
- **Windows**: https://www.mongodb.com/try/download/community
- **macOS**: `brew tap mongodb/brew && brew install mongodb-community`
- **Ubuntu**: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

Start the service:

```bash
# Windows (run PowerShell as Administrator)
net start MongoDB

# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

> 💡 MongoDB defaults to no authentication for local connections.

### 3) Configure & Start Server

```bash
# Copy environment file (default config works out of the box)
copy server\.env.example server\.env

# Start Server
pnpm -C server dev
```

Done! Server runs at `http://localhost:3000`.

**After first start, create an admin account:**

```bash
cd server
npx ts-node src/scripts/createAdmin.ts --yes --username admin --password admin123
```

### 4) Configure Admin & Frontend (Optional)

```bash
# Admin
copy admin\.env.example admin\.env.local
# Default config works

# Frontend  
copy frontend\.env.example frontend\.env.local
# Default config works
```

### 5) Start All Services

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

## Authentication (HttpOnly Cookie)

- After login, server sets an HttpOnly Cookie (frontend doesn't store token).  
- Frontend requests need `credentials: 'include'` (already implemented in admin).  

Main endpoints:
- Admin login: `POST /api/admin/auth/login`
- Admin logout: `POST /api/admin/auth/logout`
- Author login: `POST /api/auth/login`
- Author logout: `POST /api/auth/logout`

---

## One-Command Startup + Seed Data (Can Reset DB)

> ⚠️ `up -Yes` will **DROP collections** and clear the database.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-test-system.ps1 up -Yes
```

Script docs: `scripts/README.md`

---

## Enable MongoDB Authentication (Optional)

If you need to enable MongoDB access control (e.g., for production):

```bash
# 1. Enter MongoDB Shell
mongosh

# 2. Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: [ "userAdminAnyDatabase", "readWriteAnyDatabase" ]
})

# 3. Enable auth (edit mongod.conf, add)
security:
  authorization: enabled

# 4. Modify server/.env
MONGO_USERNAME=admin
MONGO_PASSWORD=password
MONGO_AUTH_SOURCE=admin
```

---

## Documentation

- Server: `server/README.en.md`
- Admin: `admin/README.en.md`
- Frontend: `frontend/README.en.md`
- API: `docs/API.en.md`
- Deployment: `docs/DEPLOYMENT.en.md`
