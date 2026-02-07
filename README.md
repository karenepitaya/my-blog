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

### 2) 配置环境变量

**Server（必须）**  
复制 `server/.env.example` → `server/.env`，至少填写：

```
MONGO_USERNAME=...
MONGO_PASSWORD=...
MONGO_DBNAME=...
JWT_SECRET=...  # 强随机字符串
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
