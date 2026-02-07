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

复制 `server/.env.example` → `server/.env`，至少填写：

```
MONGO_USERNAME=...
MONGO_PASSWORD=...
MONGO_DBNAME=...
JWT_SECRET=...  # 强随机字符串
```

常用可选项：
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
