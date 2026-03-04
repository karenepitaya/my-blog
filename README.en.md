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

### 2) MongoDB Installation & Setup (Required for First-time Users)

If you haven't installed MongoDB yet:
- **Windows**: https://www.mongodb.com/try/download/community
- **macOS**: `brew tap mongodb/brew && brew install mongodb-community`
- **Ubuntu**: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

**You MUST complete the following steps before starting the Server:**

#### Step 1: Start MongoDB Service

```bash
# Windows (run PowerShell as Administrator)
net start MongoDB

# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

#### Step 2: Choose Configuration

Choose **one of the following two options** based on whether your MongoDB has access control enabled:

<details>
<summary><b>Option A: Disable Access Control (Recommended for Local Dev)</b></summary>

This is the simplest option and MongoDB's default. No username/password needed, Server connects directly.

**Check config file** (if `authorization: enabled` exists, comment it out):

- **Windows**: `C:\Program Files\MongoDB\Server\X.X\bin\mongod.cfg`
- **macOS**: `/usr/local/etc/mongod.conf` or `/opt/homebrew/etc/mongod.conf`
- **Ubuntu**: `/etc/mongod.conf`

Make sure the config **does NOT** have (or comment out):
```yaml
# security:
#   authorization: enabled
```

**Restart MongoDB** (if you modified config):
```bash
# Windows
net stop MongoDB && net start MongoDB

# macOS
brew services restart mongodb-community

# Ubuntu
sudo systemctl restart mongod
```

**Configure .env** (no auth):
```bash
MONGO_USERNAME=""              # empty
MONGO_PASSWORD=""              # empty
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
```

> 💡 With empty username, Mongoose will connect without authentication.

</details>

<details>
<summary><b>Option B: Enable Access Control (Requires User Creation)</b></summary>

If your MongoDB must have access control (e.g., some cloud versions), create users:

**B1. Create root user** (using localhost exception)

```javascript
use admin
db.createUser({
  user: "myroot",
  pwd: "root_password",
  roles: [ 
    { role: "userAdminAnyDatabase", db: "admin" },
    "readWriteAnyDatabase"
  ]
})
```

**B2. Create app user with root**

```javascript
db.auth("myroot", "root_password")
use myblog
db.createUser({
  user: "bloguser",
  pwd: "your_password",
  roles: [
    { role: "readWrite", db: "myblog" },
    { role: "dbAdmin", db: "myblog" }
  ]
})
```

**Configure .env**:
```bash
MONGO_USERNAME=bloguser
MONGO_PASSWORD=your_password
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_AUTH_SOURCE=admin        # Required: user created in admin database
```

</details>

#### Step 3: Configure Server Environment Variables

Copy `server/.env.example` → `server/.env`, choose based on your setup:

**Option A (No auth)**:
```bash
PORT=3000
MONGO_USERNAME=""
MONGO_PASSWORD=""
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
JWT_SECRET=your_random_secret
```

**Option B (With auth)**:
```bash
PORT=3000
MONGO_USERNAME=bloguser
MONGO_PASSWORD=your_password
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_AUTH_SOURCE=admin
JWT_SECRET=your_random_secret

# JWT secret (for authentication, use any long random string)
JWT_SECRET=your_super_secret_key_here_at_least_32_chars

# Admin account (auto-created on first startup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

> 💡 **Note**: The above configuration uses the **app user** (`bloguser`), not the root user. Since the app user was created in the `myblog` database, no additional `MONGO_AUTH_SOURCE` configuration is needed.

**⚠️ Common Issues**: If you get `Authentication failed` on startup, check:
1. Username/password match the app user created in Step 3
2. `MONGO_DBNAME` matches the database name in `use myblog`
3. MongoDB service is running (`net start MongoDB` or `brew services list`)

**Special Case**: If you created the app user in the `admin` database (instead of `myblog`), add to `.env`:
```bash
MONGO_AUTH_SOURCE=admin
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
