# 网络问题快速解决指南

> 遇到问题？按场景查找解决方案

---

## 症状速查表

| 症状 | 原因 | 快速解决 |
|------|------|----------|
| 页面能打开，登录失败 | Cookie Domain 不匹配 | 后端设置 `HOST=localhost` |
| 浏览器报 CORS 错误 | Origin 不被允许 | 添加 `DEV_CORS_ORIGINS` |
| 无法连接后端 | 端口未监听或防火墙 | 检查 `HOST` 和防火墙 |
| 字体加载失败 | 字体服务器 CORS | 使用 CDN 字体或代理 |

---

## 场景 1：VS Code + 虚拟机登录失败

**配置**：
```bash
# server/.env.local
echo "HOST=localhost" > server/.env.local
```

**重启后端**：
```bash
cd server && pnpm dev
```

---

## 场景 2：宿主机访问虚拟机 IP

**步骤 1：防火墙**
```bash
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

**步骤 2：后端配置**
```bash
# server/.env.local
HOST=0.0.0.0
DEV_CORS_ORIGINS=http://192.168.139.129:3001
```

**步骤 3：前端配置**
```bash
# admin/.env.local
VITE_API_PROXY_TARGET=http://192.168.139.129:3000
```

**步骤 4：访问**
```
http://192.168.139.129:3001
```

---

## 检查清单

```bash
# 1. 后端是否运行
curl http://localhost:3000/api/health

# 2. 后端监听地址
ss -tlnp | grep 3000
# 期望: 127.0.0.1:3000 (localhost) 或 0.0.0.0:3000 (外部访问)

# 3. 前端代理配置
cat admin/.env.local | grep VITE_API

# 4. CORS 测试
curl -H "Origin: http://localhost:3001" \
     http://localhost:3000/api/profile -v 2>&1 | grep "Access-Control"
```
