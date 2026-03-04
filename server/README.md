# API 服务（Server）

[English](README.en.md)

Node.js + Express + MongoDB 后端服务，提供 admin / author / public API。

---

## 运行环境

- Node.js 18+
- pnpm
- MongoDB

---

## 环境变量

### 首次使用必看

**快速方案（推荐本地开发）**：将 MongoDB 配置为无需认证（无 `authorization: enabled`），然后在 `.env` 中：
```bash
MONGO_USERNAME=""
MONGO_PASSWORD=""
MONGO_DBNAME=myblog
```

**完整方案**：如需启用 MongoDB 访问控制，请参考项目根目录 `README.md` 的详细配置步骤。

### 配置 .env

复制 `server/.env.example` → `server/.env`：

```bash
# 方案 A：无需认证（推荐本地开发）
MONGO_USERNAME=""
MONGO_PASSWORD=""
MONGO_DBNAME=myblog
JWT_SECRET=your_random_secret

# 方案 B：需要认证（MongoDB 启用了访问控制）
# MONGO_USERNAME=bloguser
# MONGO_PASSWORD=your_password
# MONGO_DBNAME=myblog
# MONGO_AUTH_SOURCE=admin
```

### 其他可选配置

- `PORT`（默认 3000）
- `UPLOAD_DIR`（单一目录名，禁止包含 `/` 或 `..`）

---

## 启动

```bash
pnpm install
pnpm dev
```

构建/运行：

```bash
pnpm build
pnpm start
```

---

## 认证说明（HttpOnly Cookie）

登录成功后服务端写入 HttpOnly Cookie，前端无需保存 token。  
中间件仍兼容 `Authorization: Bearer ...`（仅作为兼容/脚本用途）。

主要接口：
- 管理员登录：`POST /api/admin/auth/login`
- 管理员登出：`POST /api/admin/auth/logout`
- 作者登录：`POST /api/auth/login`
- 作者登出：`POST /api/auth/logout`

---

## 本地脚本

`scripts/` 目录提供一键启动/播种脚本（默认不进 Git）。  
详见根目录 `scripts/README.md`。

---

## 文档

- API 文档：`docs/API.md`
- 部署说明：`docs/DEPLOYMENT.md`
