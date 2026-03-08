# 部署指南

本文档介绍如何在 **2核 CPU / 2GB 内存** 的极限环境下部署博客系统。

---

## 系统要求

### 最低配置

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 2 核 |
| 内存 | 2 GB | 4 GB |
| 磁盘 | 20 GB SSD | 50 GB SSD |
| 网络 | 1 Mbps | 5 Mbps |

### 软件依赖

- Node.js 18+ (推荐使用 20 LTS)
- MongoDB 5.0+
- PM2 (生产进程管理)

---

## 内存预算分配

总内存：2 GB，系统保留约 200 MB，可用约 1.8 GB。

| 组件 | 预算内存 | 说明 |
|------|----------|------|
| MongoDB | 512 MB | wiredTiger 缓存限制 |
| Node.js 主进程 | 150 MB | 应用程序 + 运行时 |
| LRU 缓存 | < 1 MB | 分析数据缓存 |
| Winston 日志 | ~2 MB | 日志缓冲区 |
| 系统预留 | 200 MB | OS + 其他进程 |
| **可用余量** | **~1.1 GB** | 峰值缓冲 |

---

## 安装步骤

### 1. 安装 Node.js

```bash
# 使用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 2. 安装 MongoDB

```bash
# Ubuntu 22.04
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. 配置 MongoDB（内存限制）

编辑 `/etc/mongod.conf`：

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5  # 限制 512MB

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1

security:
  authorization: enabled
```

重启 MongoDB：

```bash
sudo systemctl restart mongod
```

### 4. 创建数据库用户

```bash
mongosh admin -u admin -p
```

```javascript
use myblog
db.createUser({
  user: "bloguser",
  pwd: "your_secure_password",
  roles: [
    { role: "readWrite", db: "myblog" },
    { role: "dbAdmin", db: "myblog" }
  ]
})
```

### 5. 部署应用程序

```bash
# 克隆代码
git clone <your-repo> my-blog
cd my-blog

# 安装依赖
cd server
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库信息

# 构建
pnpm build

# 创建管理员
npx ts-node src/scripts/createAdmin.ts --yes
```

### 6. 使用 PM2 启动

```bash
# 全局安装 PM2
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'myblog-server',
    script: './dist/app.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    kill_timeout: 5000,
    listen_timeout: 10000,
    // 关键：限制 Node.js 内存
    node_args: '--max-old-space-size=180'
  }]
}
EOF

# 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Nginx 反向代理配置

```nginx
upstream blog_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
    
    # 静态文件（前端构建产物）
    location / {
        root /path/to/my-blog/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://blog_backend/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # SSE 日志流特殊配置
    location /api/admin/logs/stream {
        proxy_pass http://blog_backend/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

---

## 监控与维护

### 查看内存使用

```bash
# Node.js 进程
pm2 monit

# 或
ps aux | grep node

# MongoDB 内存
mongosh --eval "db.serverStatus().wiredTiger.cache"
```

### 日志轮转

```bash
# 查看 PM2 日志
pm2 logs

# 查看应用日志
tail -f logs/app-$(date +%Y-%m-%d).log

# 清空旧日志
pm2 flush
```

### 数据库维护

```bash
# 查看集合统计
mongosh myblog -u bloguser -p --eval "db.getCollectionNames().forEach(c => printjson(db[c].stats()))"

# 查看封顶集合状态
mongosh myblog -u bloguser -p --eval "db.articleevents.stats()"
```

---

## 故障排查

### 内存溢出

**现象**：进程被 PM2 重启

**诊断**：
```bash
pm2 logs --lines 100
dmesg | grep -i "out of memory"
```

**解决**：
1. 检查日志文件大小：`du -sh logs/`
2. 减少 `maxFiles` 保留天数
3. 增加 `max_memory_restart` 阈值（如有余量）

### MongoDB 连接失败

**诊断**：
```bash
# 测试连接
mongosh "mongodb://bloguser:password@localhost:27017/myblog?authSource=myblog"

# 查看连接数
mongosh --eval "db.serverStatus().connections"
```

### 高 CPU 占用

**诊断**：
```bash
# 找到高 CPU 进程
top -p $(pgrep -d',' node)

# PM2 详细监控
pm2 show myblog-server
```

**常见原因**：
- 大量并发请求 → 启用 Nginx 限流
- 复杂聚合查询 → 检查分析 API 缓存命中率

---

## 性能验证

运行内置验证脚本：

```bash
cd server
npx ts-node src/scripts/validate-optimization.ts
```

预期输出：
```
[OK]   内存使用: 145 MB (目标 < 200 MB)
[OK]   API 响应: 23 ms (目标 < 100 ms)
[OK]   Capped Collections: 已创建
[OK]   Dependencies: 全部安装
```
