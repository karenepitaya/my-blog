# MultiTerm Blog（Monorepo）

[English](README.en.md)

本仓库包含 **Server / Admin / Frontend** 三端子项目：
- `server/`：Node.js + Express + MongoDB API 服务  
- `admin/`：React + Vite 管理后台  
- `frontend/`：Astro 前台站点  

---

## 目录结构

```
.
├─ server/       # API 服务
├─ admin/        # 管理后台
├─ frontend/     # 前台站点
├─ scripts/      # 本地一键启动/播种脚本（默认不进 Git）
└─ review-code/  # Review 产物（默认不进 Git）
```

---

## 运行环境

- Node.js 18+（建议 20+）
- pnpm
- MongoDB

---

## 快速开始（本地开发）

### 1) 安装依赖

```bash
pnpm -C server install
pnpm -C admin install
pnpm -C frontend install
```

### 2) MongoDB 安装与配置（首次使用必看）

如果你还没有安装 MongoDB，请先安装：
- **Windows**: https://www.mongodb.com/try/download/community
- **macOS**: `brew tap mongodb/brew && brew install mongodb-community`
- **Ubuntu**: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

安装完成后，**必须完成以下步骤才能启动 Server**：

#### Step 1: 启动 MongoDB 服务

```bash
# Windows (以管理员身份运行 PowerShell)
net start MongoDB

# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

#### Step 2: 选择配置方案

根据你的 MongoDB 是否启用了访问控制，选择以下**两种方案之一**：

<details>
<summary><b>方案 A：关闭访问控制（推荐本地开发）</b></summary>

这是最简单的方案，也是 MongoDB 默认配置。无需用户名密码，Server 可以直接连接。

**检查配置文件**（如果存在 `authorization: enabled`，请注释掉）：

- **Windows**: `C:\Program Files\MongoDB\Server\X.X\bin\mongod.cfg`
- **macOS**: `/usr/local/etc/mongod.conf` 或 `/opt/homebrew/etc/mongod.conf`
- **Ubuntu**: `/etc/mongod.conf`

确保配置文件**没有**以下内容（或将其注释掉）：
```yaml
# security:
#   authorization: enabled
```

**重启 MongoDB**（如果修改了配置）：
```bash
# Windows
net stop MongoDB && net start MongoDB

# macOS
brew services restart mongodb-community

# Ubuntu
sudo systemctl restart mongod
```

**配置 .env**（无需认证）：
```bash
MONGO_USERNAME=""              # 留空
MONGO_PASSWORD=""              # 留空
MONGO_DBNAME=myblog            # 数据库名称
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
```

> 💡 无需认证时，Mongoose 会自动忽略空用户名密码，直接连接。

</details>

<details>
<summary><b>方案 B：启用访问控制（需要创建用户）</b></summary>

如果你的 MongoDB 必须启用访问控制（如某些云版本），则需要创建用户：

**B1. 创建 root 用户**（利用 localhost exception）

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

**B2. 用 root 创建业务用户**

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

**配置 .env**：
```bash
MONGO_USERNAME=bloguser
MONGO_PASSWORD=your_password
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_AUTH_SOURCE=admin        # 重要：用户在 admin 库创建
```

</details>

#### Step 3: 配置 Server 环境变量

复制 `server/.env.example` → `server/.env`，根据你选择的方案填写：

**方案 A（无需认证）**：
```bash
PORT=3000
MONGO_USERNAME=""
MONGO_PASSWORD=""
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
JWT_SECRET=your_random_secret
```

**方案 B（需要认证）**：
```bash
PORT=3000
MONGO_USERNAME=bloguser
MONGO_PASSWORD=your_password
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_AUTH_SOURCE=admin
JWT_SECRET=your_random_secret

# JWT 密钥（用于登录验证，随意设置一个长字符串）
JWT_SECRET=your_super_secret_key_here_at_least_32_chars

# 管理员账号（首次启动后会自动创建）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

> 💡 **注意**：上面的配置使用**业务用户**（`bloguser`）连接，不是 root 用户。因为业务用户创建在 `myblog` 库，所以无需额外配置 `MONGO_AUTH_SOURCE`。

**⚠️ 常见问题**：如果启动时报 `Authentication failed`，检查：
1. 用户名/密码是否与 Step 3 创建的业务用户一致
2. `MONGO_DBNAME` 是否与 `use myblog` 的数据库名一致
3. MongoDB 服务是否已启动（`net start MongoDB` 或 `brew services list`）

**特殊情况**：如果你把业务用户创建在了 `admin` 数据库（而不是 `myblog`），需要在 `.env` 中额外添加：
```bash
MONGO_AUTH_SOURCE=admin
```

**Admin（可选）**  
复制 `admin/.env.example` → `admin/.env.local`：

```
VITE_API_BASE_URL=http://localhost:3000/api
```

**Frontend（可选）**  
复制 `frontend/.env.example` → `frontend/.env.local`：

```
PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 3) 启动开发服务

```bash
pnpm -C server dev
pnpm -C admin dev
pnpm -C frontend dev
```

默认端口：
- Server：`http://localhost:3000`
- Admin：`http://localhost:3001`
- Frontend：`http://localhost:4321`

---

## 认证说明（HttpOnly Cookie）

- 登录成功后由服务端写入 HttpOnly Cookie（前端不保存 token）。  
- 前端请求需带上 `credentials: 'include'`（已在 admin 中实现）。  

主要接口：
- 管理员登录：`POST /api/admin/auth/login`
- 管理员登出：`POST /api/admin/auth/logout`
- 作者登录：`POST /api/auth/login`
- 作者登出：`POST /api/auth/logout`

---

## 一键启动 + 播种数据（可重置 DB）

> ⚠️ `up -Yes` 会 **DROP collections**，清空数据库。

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-test-system.ps1 up -Yes
```

脚本说明：`scripts/README.md`

---

## 文档索引（中文 / English）

- Server：`server/README.md` / `server/README.en.md`
- Admin：`admin/README.md` / `admin/README.en.md`
- Frontend：`frontend/README.md` / `frontend/README.en.md`
- API：`docs/API.md` / `docs/API.en.md`
- 部署：`docs/DEPLOYMENT.md` / `docs/DEPLOYMENT.en.md`
- 环境变量示例：`server/.env.example`、`admin/.env.example`、`frontend/.env.example`
