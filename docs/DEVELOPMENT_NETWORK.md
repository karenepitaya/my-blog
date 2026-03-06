# 开发网络配置指南

本文档帮助开发者根据不同开发环境配置网络，解决跨域、Cookie、端口访问等问题。

## 快速开始

### 场景：VS Code 远程开发 + 端口转发（最常见）

**症状**：页面能打开，但登录失败

**解决**：
```bash
# server/.env.local
HOST=localhost
```

**原理**：统一使用 `localhost` 避免 Cookie Domain 不匹配（`localhost` ≠ `127.0.0.1`）

---

### 场景：直接通过 IP 访问虚拟机

```bash
# 1. 开放防火墙
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload

# 2. server/.env.local
HOST=0.0.0.0
DEV_CORS_ORIGINS=http://192.168.1.100:3001

# 3. admin/.env.local
VITE_API_PROXY_TARGET=http://192.168.1.100:3000
```

---

## 环境变量参考

### 后端 (`server/.env.local`)

| 变量 | 说明 | 示例 |
|------|------|------|
| `HOST` | 监听地址 | `localhost`, `0.0.0.0`, `127.0.0.1` |
| `DEV_CORS_ORIGINS` | 额外允许的 CORS Origin | `http://192.168.1.100:3001` |

### 前端 (`admin/.env.local`)

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_PROXY_TARGET` | API 代理目标 | `http://localhost:3000` |
| `VITE_API_BASE_URL` | API 基础路径 | `/api` (使用代理) |

---

## 详细方案

### 方案 1：VS Code 端口转发（推荐）

适用于：代码在虚拟机，浏览器在宿主机

```
┌──────────────┐      VS Code 转发       ┌─────────────┐
│   宿主机      │  localhost:3001 ─────▶ │   虚拟机     │
│  (浏览器)     │                        │  (代码/服务) │
└──────────────┘                        └─────────────┘
```

配置：
- 后端：`HOST=localhost`
- 前端：默认配置即可

---

### 方案 2：IP 直接访问

适用于：手机调试、团队共享、前端在宿主机直接访问

```
┌──────────────┐      http://192.168.x.x    ┌─────────────┐
│   宿主机      │  ◀──────────────────────▶ │   虚拟机     │
│  (浏览器)     │                           │  (代码/服务) │
└──────────────┘                           └─────────────┘
```

配置：
- 后端：`HOST=0.0.0.0`, `DEV_CORS_ORIGINS=http://IP:3001`
- 前端：`VITE_API_PROXY_TARGET=http://IP:3000`
- 防火墙：开放 3000/3001 端口

---

## 常见问题

### Q: 为什么 Cookie 会失效？

A: 浏览器对 `localhost` 和 `127.0.0.1` 视为不同域名。后端在 `127.0.0.1` 设置的 Cookie，浏览器在 `localhost` 不会发送。

**解决**：统一使用 `localhost`

### Q: 为什么需要 `DEV_CORS_ORIGINS`？

A: 后端默认只允许 `localhost:3001` 等本地 Origin。通过 IP 访问时需要额外添加允许的 Origin。

### Q: 为什么字体加载失败？

A: 自托管字体服务器如果没有 CORS 头，浏览器会阻止加载。

**解决**：
1. 配置字体服务器允许跨域
2. 或使用 Vite 代理字体请求（已配置）
3. 或改用 CDN 字体
