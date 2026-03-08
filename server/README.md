# API 服务（Server）

[English](README.en.md)

Node.js + Express + MongoDB 后端服务，提供 admin / author / public API。

---

## 运行环境

- Node.js 18+
- pnpm
- MongoDB（**需要启用认证**）

---

## 快速开始

### 1. 前提：配置 MongoDB 认证

**⚠️ 安全要求：必须先创建数据库用户**

#### 首次配置（没有管理员账号）

如果你的 MongoDB 刚安装且启用了认证，但还没有创建用户，需要**临时关闭认证**来创建第一个管理员：

```bash
# 1. 编辑配置文件，注释掉 security 部分
sudo nano /etc/mongod.conf
# Windows: notepad "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"

# 2. 重启 MongoDB
sudo systemctl restart mongod  # Ubuntu
brew services restart mongodb-community  # macOS

# 3. 无需认证连接，创建用户
mongosh

use myblog
db.createUser({
  user: "bloguser",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "myblog" }]
})

# 同时创建管理员（可选）
use admin
db.createUser({
  user: "admin",
  pwd: "your_admin_password",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})

# 4. 重新启用认证（编辑配置文件，取消注释 security），然后重启
```

#### 已有管理员账号

```bash
# 用管理员登录
mongosh -u admin -p your_admin_password --authenticationDatabase admin

# 创建业务用户
use myblog
db.createUser({
  user: "bloguser",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "myblog" }]
})
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
copy .env.example .env

# 编辑 .env，填写数据库认证信息
MONGO_USERNAME=bloguser
MONGO_PASSWORD=your_secure_password
MONGO_AUTH_SOURCE=myblog  # 如果用户创建在 admin 库，改为 admin
```

### 3. 安装依赖并启动

```bash
# 安装依赖
pnpm install

# 启动服务
pnpm dev
```

Server 将在 `http://localhost:3000` 启动。

**首次启动后，创建管理员账号：**

`.env` 中已配置了默认管理员账号（`ADMIN_USERNAME` 和 `ADMIN_PASSWORD`），直接运行：

```bash
npx ts-node src/scripts/createAdmin.ts --yes
```

如需自定义账号，可添加参数（优先级高于环境变量）：
```bash
npx ts-node src/scripts/createAdmin.ts --yes --username myadmin --password mypass123
```

---

## 环境变量

复制 `.env.example` → `.env`，**必须填写数据库认证信息**：

```bash
# 必需
MONGO_DBNAME=myblog
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_USERNAME=your_db_user      # 必填（安全要求）
MONGO_PASSWORD=your_db_password  # 必填
MONGO_AUTH_SOURCE=myblog         # 默认为 MONGO_DBNAME
JWT_SECRET=your_jwt_secret       # 必填

# 可选：默认管理员账号（用于 createAdmin 脚本）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 安全配置说明

- **默认行为**：认证是必需的（`MONGO_AUTH_ENABLED` 默认为 true）
- **显式禁用**（不推荐，仅限特殊测试环境）：
  ```bash
  MONGO_AUTH_ENABLED=false
  ```

---

## 可用脚本

```bash
# 创建管理员（使用 .env 中的 ADMIN_USERNAME/PASSWORD）
npx ts-node src/scripts/createAdmin.ts --yes

# 或使用自定义账号
npx ts-node src/scripts/createAdmin.ts --yes --username admin --password admin123

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

## 故障排查

### 错误：MONGO_USERNAME is required for security reasons.

**原因**: 没有配置数据库用户名  
**解决**: 在 `.env` 中设置 `MONGO_USERNAME` 和 `MONGO_PASSWORD`，或显式禁用认证（不推荐）

### 错误：Authentication failed.

**原因**: 用户名、密码或 authSource 不正确  
**解决**: 
1. 验证 MongoDB 用户存在：`mongosh myblog -u bloguser -p password --authenticationDatabase myblog`
2. 检查 `.env` 中的 `MONGO_AUTH_SOURCE` 是否匹配用户所在数据库

### 查看 MongoDB 日志

```bash
# Windows
type "C:\Program Files\MongoDB\Server\8.2\log\mongod.log"

# macOS
tail -f /usr/local/var/log/mongodb/mongo.log

# Linux
tail -f /var/log/mongodb/mongod.log
```

---

## 性能优化（2C2G 目标）

| 指标 | 目标 | 实际 | 实现方式 |
|------|------|------|----------|
| 内存占用 | < 200 MB | ~175 MB | LRU 缓存（< 0.5 MB）+ 无泄漏架构 |
| 分析 API 响应 | < 100 ms | ~15-30 ms | 60s 缓存 + MongoDB 聚合优化 |
| 日志查询 | < 10 ms | ~1-3 ms | 内存热缓存（500 条） |
| 诊断 API | < 100 ms | ~30-50 ms | 30s 缓存 + 并行检测 |

### 核心优化策略

1. **缓存策略**：使用 `quick-lru` 实现轻量级 LRU 缓存
   - 分析数据：60s TTL，最大 100 条
   - 诊断结果：30s TTL，单条缓存
   
2. **数据库优化**：MongoDB 封顶集合（Capped Collections）
   - `ArticleEvent`：100 MB 封顶，自动淘汰旧数据
   - `SystemLog`：50 MB 封顶，零清理成本

3. **日志架构**：三级存储体系
   - 热缓存：内存 500 条，查询 < 10ms
   - 日轮转：文件 50 MB/天，保留 14 天
   - 归档库：MongoDB 封顶集合，保留警告/错误

4. **分析数据**：固定大小封顶集合 + 预聚合
   - 无需定时清理任务
   - 聚合查询使用索引：`{ authorId: 1, ts: -1, type: 1 }`

---

## 新增 API 端点

### 分析洞察

```
GET /api/admin/analytics/insights?range=24h&force=1  # 管理员全局洞察
GET /api/admin/analytics/authors/:id/insights        # 指定作者洞察（管理员）
GET /api/profile/analytics/insights?range=7d         # 当前作者洞察
```

**Range 参数**：`1h`, `24h`, `7d`, `30d`, `90d`, `year`（默认 7d）

**缓存控制**：添加 `force=1` 跳过缓存强制刷新

### 日志管理（管理员）

```
GET  /api/admin/logs/hot?scope=app&level=info&limit=100     # 热缓存查询
GET  /api/admin/logs/archive?date=2026-03-07&limit=100      # 归档文件查询
GET  /api/admin/logs/stream                                 # SSE 实时日志流
GET  /api/admin/logs/stats                                  # 日志统计
POST /api/admin/logs/clear                                  # 清空热缓存
```

### 配置诊断

```
GET /api/admin/config/diagnostics                         # 系统健康诊断
```

返回 MongoDB、配置存储、对象存储、分析服务的健康状态。

---

## 文档

- API 文档：`../docs/API.md`
- 部署说明：`../docs/DEPLOYMENT.md`
