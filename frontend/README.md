# 前台站点（Frontend）

[English](README.en.md)

Astro 构建的前台站点，默认通过 `PUBLIC_API_BASE_URL` 访问后端公开 API。

---

## 运行环境

- Node.js 18+
- pnpm

---

## 环境变量（可选）

复制 `frontend/.env.example` → `frontend/.env.local`：

```
PUBLIC_API_BASE_URL=http://localhost:3000/api
```

---

## 启动

```bash
pnpm install
pnpm dev
```

构建/预览：

```bash
pnpm build
pnpm preview
```

默认端口：`http://localhost:4321`

---

## 内容来源说明

- 文章内容来自 `frontend/src/content/posts`。  
- 若使用脚本播种并开启导出，生成内容会写入  
  `frontend/src/content/posts/_generated`。

---

## 相关文档

- 环境变量示例：`frontend/.env.example`
- 后端服务：`server/README.md`
- API 文档：`docs/API.md`
- 部署说明：`docs/DEPLOYMENT.md`
