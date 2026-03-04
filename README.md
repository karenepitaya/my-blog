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

### 2) 启动 MongoDB

如果你还没有安装 MongoDB：
- **Windows**: https://www.mongodb.com/try/download/community
- **macOS**: `brew tap mongodb/brew && brew install mongodb-community`
- **Ubuntu**: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

启动服务：

```bash
# Windows (以管理员身份运行 PowerShell)
net start MongoDB

# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

> 💡 MongoDB 默认无需认证即可本地连接。

### 3) 配置并启动 Server

```bash
# 复制环境变量文件（默认配置即可运行）
copy server\.env.example server\.env

# 启动 Server
pnpm -C server dev
```

完成！Server 会在 `http://localhost:3000` 启动。

**首次启动后，创建管理员账号：**

```bash
cd server
npx ts-node src/scripts/createAdmin.ts --yes --username admin --password admin123
```

### 4) 配置 Admin & Frontend（可选）

```bash
# Admin
copy admin\.env.example admin\.env.local
# 默认配置即可

# Frontend  
copy frontend\.env.example frontend\.env.local
# 默认配置即可
```

### 5) 启动所有服务

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

## 启用 MongoDB 认证（可选）

如果你需要启用 MongoDB 访问控制（如生产环境）：

```bash
# 1. 进入 MongoDB Shell
mongosh

# 2. 创建管理员用户
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: [ "userAdminAnyDatabase", "readWriteAnyDatabase" ]
})

# 3. 启用认证（编辑 mongod.conf，添加）
security:
  authorization: enabled

# 4. 修改 server/.env
MONGO_USERNAME=admin
MONGO_PASSWORD=password
MONGO_AUTH_SOURCE=admin
```

---

## 文档索引

- Server：`server/README.md`
- Admin：`admin/README.md`
- Frontend：`frontend/README.md`
- API：`docs/API.md`
- 部署：`docs/DEPLOYMENT.md`
