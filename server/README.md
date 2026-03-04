# API 服务（Server）

[English](README.en.md)

Node.js + Express + MongoDB 后端服务，提供 admin / author / public API。

---

## 运行环境

- Node.js 18+
- pnpm
- MongoDB（默认配置，无需认证）

---

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量（默认配置即可直接运行）
copy .env.example .env

# 3. 启动服务
pnpm dev
```

Server 将在 `http://localhost:3000` 启动。

**首次启动后，创建管理员账号：**

```bash
npx ts-node src/scripts/createAdmin.ts --yes --username admin --password admin123
```

---

## 环境变量

复制 `.env.example` → `.env`，默认配置无需修改即可本地开发：

```bash
PORT=3000
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_USERNAME=        # 本地开发留空
MONGO_PASSWORD=        # 本地开发留空
JWT_SECRET=dev_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

**如需启用 MongoDB 认证**（生产环境），设置：
```bash
MONGO_USERNAME=your_user
MONGO_PASSWORD=your_pass
MONGO_AUTH_SOURCE=admin
```

---

## 可用脚本

```bash
# 创建管理员
npx ts-node src/scripts/createAdmin.ts --username admin --password admin123

# 清空数据库（开发调试用）
npx ts-node src/scripts/clearDatabase.ts --yes

# 导出前端内容
npx ts-node src/scripts/exportFrontendContent.ts --out-dir ../frontend/src/content/posts/_generated
```

---

## 构建与部署

```bash
# 构建
pnpm build

# 生产运行
pnpm start
```

---

## 认证说明

登录成功后服务端写入 HttpOnly Cookie，前端无需保存 token。  
主要接口：
- 管理员登录：`POST /api/admin/auth/login`
- 作者登录：`POST /api/auth/login`

---

## 文档

- API 文档：`../docs/API.md`
- 部署说明：`../docs/DEPLOYMENT.md`
