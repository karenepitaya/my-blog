# 管理后台（Admin）

[English](README.en.md)

本项目为管理后台前端，直接调用 `server` 的 API。

---

## 运行环境

- Node.js 18+
- pnpm
- 需要 `server` 运行在 `http://localhost:3000`

---

## 启动

### 1) 安装依赖

```bash
pnpm install
```

### 2) 环境变量（可选）

复制 `admin/.env.example` → `admin/.env.local`：

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3) 启动开发

```bash
pnpm dev
```

默认端口：`http://localhost:3001`

---

## 认证说明（HttpOnly Cookie）

后端登录成功后会写入 HttpOnly Cookie，前端不保存 token。  
请求需带 `credentials: 'include'`（已在代码中处理）。

主要接口：
- 管理员登录：`POST /api/admin/auth/login`
- 管理员登出：`POST /api/admin/auth/logout`

---

## 相关文档

- 环境变量示例：`admin/.env.example`
- 后端服务：`server/README.md`
- API 文档：`docs/API.md`
- 部署说明：`docs/DEPLOYMENT.md`
