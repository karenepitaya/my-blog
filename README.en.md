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
- MongoDB (authentication required)

---

## Quick Start (Local Development)

### 1) Install MongoDB and Start Service

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

### 2) Configure MongoDB Authentication (Required for Security)

**⚠️ This project requires MongoDB authentication. You must create a database user first.**

#### Option A: First-time Setup (No Admin Account)

If your MongoDB is freshly installed with authentication enabled (`authorization: enabled`) but no users created yet, you'll see `Command createUser requires authentication` error. You need to **temporarily disable authentication** to create the first admin:

**Step 1: Edit MongoDB Config**

```bash
# Ubuntu/macOS
sudo nano /etc/mongod.conf

# Windows (open with Notepad or VS Code)
notepad "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"
```

Find the `security` section and comment out or remove:
```yaml
# Comment out these lines
# security:
#   authorization: enabled
```

**Step 2: Restart MongoDB**

```bash
# Ubuntu
sudo systemctl restart mongod

# macOS
brew services restart mongodb-community

# Windows (Administrator PowerShell)
net stop MongoDB
net start MongoDB
```

**Step 3: Create Users (No auth required now)**

```bash
mongosh

# Create app database user (recommended, least privilege)
use myblog
db.createUser({
  user: "bloguser",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "myblog" }]
})

# Also create an admin user (for managing other databases)
use admin
db.createUser({
  user: "admin",
  pwd: "your_admin_password",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})
```

**Step 4: Re-enable Authentication**

Edit config file, uncomment:
```yaml
security:
  authorization: enabled
```

Restart MongoDB service.

**Step 5: Verify Connection**

```bash
# Test app user
mongosh myblog -u bloguser -p your_secure_password --authenticationDatabase myblog

# Test admin
mongosh -u admin -p your_admin_password --authenticationDatabase admin
```

#### Option B: Already Have Admin Account

If you already have an admin account, login and create the app user:

```bash
# Login as admin
mongosh -u admin -p your_admin_password --authenticationDatabase admin

# Create app user
use myblog
db.createUser({
  user: "bloguser",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "myblog" }]
})
```

> 💡 **About authSource**: Use the database where the user was created. For users created in `myblog`, use `authSource=myblog`; for users created in `admin`, use `authSource=admin`.

### 3) Configure Server Environment Variables

```bash
# Copy environment template
copy server\.env.example server\.env

# Edit .env file, fill in database authentication info
MONGO_USERNAME=bloguser
MONGO_PASSWORD=your_secure_password
MONGO_AUTH_SOURCE=myblog  # If user created in admin db, change to admin
```

### 4) Install Dependencies

```bash
pnpm -C server install
pnpm -C admin install
pnpm -C frontend install
```

### 5) Start Server

```bash
pnpm -C server dev
```

Server runs at `http://localhost:3000`.

**After first start, create an admin account:**

The default admin account is already configured in `.env` (`ADMIN_USERNAME` and `ADMIN_PASSWORD`), just run:

```bash
cd server
npx ts-node src/scripts/createAdmin.ts --yes
```

To use custom credentials, add parameters (higher priority than env vars):
```bash
npx ts-node src/scripts/createAdmin.ts --yes --username myadmin --password mypass123
```

### 6) Configure Admin & Frontend (Optional)

```bash
# Admin
copy admin\.env.example admin\.env.local
# Default config works

# Frontend  
copy frontend\.env.example frontend\.env.local
# Default config works
```

### 7) Start All Services

```bash
pnpm -C server dev      # http://localhost:3000
pnpm -C admin dev       # http://localhost:3001
pnpm -C frontend dev    # http://localhost:4321
```

> 💡 **Network issues?** If developing on VM/remote server, see [Development Network Guide](docs/DEVELOPMENT_NETWORK.md).

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

## Security Configuration

This project **requires MongoDB authentication by default** to prevent unauthorized access. To explicitly disable (not recommended, for special test environments only):

```bash
# Add to .env
MONGO_AUTH_ENABLED=false
```

---

## Troubleshooting

### MongoDB Connection Failed

**Error**: `MONGO_USERNAME is required for security reasons.`
- **Cause**: Database authentication info not configured
- **Fix**: Follow step 2 to create a user and configure in .env

**Error**: `Authentication failed.`
- **Cause**: Wrong username/password or incorrect authSource
- **Fix**: Check MONGO_USERNAME, MONGO_PASSWORD, and MONGO_AUTH_SOURCE

### View MongoDB Logs

```bash
# Windows
type "C:\Program Files\MongoDB\Server\8.2\log\mongod.log"

# macOS/Linux
tail -f /var/log/mongodb/mongod.log
```

---

## Documentation

- Server: `server/README.en.md`
- Admin: `admin/README.en.md`
- Frontend: `frontend/README.en.md`
- API: `docs/API.en.md`
- Deployment: `docs/DEPLOYMENT.en.md`
