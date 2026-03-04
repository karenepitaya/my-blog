# API Service (Server)

[中文](README.md)

Node.js + Express + MongoDB backend service providing admin / author / public APIs.

---

## Requirements

- Node.js 18+
- pnpm
- MongoDB (default config, no auth required)

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file (defaults work out of the box)
copy .env.example .env

# 3. Start server
pnpm dev
```

Server runs at `http://localhost:3000`.

**After first start, create an admin account:**

```bash
npx ts-node src/scripts/createAdmin.ts --yes --username admin --password admin123
```

---

## Environment Variables

Copy `.env.example` → `.env`. Default config works for local development:

```bash
PORT=3000
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_USERNAME=        # Empty for local dev
MONGO_PASSWORD=        # Empty for local dev
JWT_SECRET=dev_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

**To enable MongoDB authentication** (production):
```bash
MONGO_USERNAME=your_user
MONGO_PASSWORD=your_pass
MONGO_AUTH_SOURCE=admin
```

---

## Available Scripts

```bash
# Create admin user
npx ts-node src/scripts/createAdmin.ts --username admin --password admin123

# Clear database (for development)
npx ts-node src/scripts/clearDatabase.ts --yes

# Export frontend content
npx ts-node src/scripts/exportFrontendContent.ts --out-dir ../frontend/src/content/posts/_generated
```

---

## Build & Deploy

```bash
# Build
pnpm build

# Production
pnpm start
```

---

## Authentication

After login, server sets an HttpOnly Cookie. Frontend doesn't need to store tokens.  
Main endpoints:
- Admin login: `POST /api/admin/auth/login`
- Author login: `POST /api/auth/login`

---

## Documentation

- API docs: `../docs/API.en.md`
- Deployment: `../docs/DEPLOYMENT.en.md`
