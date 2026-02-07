# 部署说明（简版）

[English](DEPLOYMENT.en.md)

> 生产环境默认 **同域同源**（同域名下 `/api`、`/admin`、`/` 路径反代）。  
> 生产环境不启用 CORS，请按此拓扑部署。

---

## 构建

```bash
pnpm -C server build
pnpm -C admin build
pnpm -C frontend build
```

构建产物：
- `server/dist/`
- `admin/dist/`
- `frontend/dist/`（Node adapter，包含 `dist/server/entry.mjs` 与 `dist/client`）

---

## 运行（示例）

**Server（API）**

```bash
pnpm -C server start
```

**Frontend（Astro Node）**

```bash
node frontend/dist/server/entry.mjs
```

**Admin（静态文件）**

将 `admin/dist` 交给任意静态服务器或反向代理。

---

## 推荐 Nginx 反代（同域）

```nginx
server {
  listen 80;
  server_name example.com;

  # API
  location /api/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # Admin 静态资源（admin/dist）
  location /admin/ {
    alias /path/to/admin/dist/;
    try_files $uri /index.html;
  }

  # Frontend（Astro Node 服务）
  location / {
    proxy_pass http://127.0.0.1:4321/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## 认证与 HTTPS

- 生产环境 Cookie 使用 `Secure`，需 HTTPS 才会写入。  
- 前端请求必须带 `credentials: 'include'`。  

---

## 关键环境变量（Server）

见 `server/.env.example`，重点：
- `JWT_SECRET`：强随机字符串  
- `UPLOAD_DIR`：单一目录名（无 `/` 或 `..`）  
- `PUBLIC_BASE_URL`：用于上传资源的绝对 URL 生成

