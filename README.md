# MultiTerm Blog（Monorepo）

[English](README.en.md)

本仓库包含 **Server / Admin / Frontend** 三端子项目：
- `server/`：Node.js + Express + MongoDB API 服务  
- `admin/`：React + Vite 管理后台  
- `frontend/`：Astro 前台站点  

---

## 目录结构

```
.
├─ server/       # API 服务
├─ admin/        # 管理后台
├─ frontend/     # 前台站点
├─ scripts/      # 本地一键启动/播种脚本（默认不进 Git）
└─ review-code/  # Review 产物（默认不进 Git）
```

---

## 运行环境

- Node.js 18+（建议 20+）
- pnpm
- MongoDB（需要启用认证）

---

## 快速开始（本地开发）

### 1) 安装 MongoDB 并启动服务

如果你还没有安装 MongoDB：
- **Windows**: https://www.mongodb.com/try/download/community
- **macOS**: `brew tap mongodb/brew && brew install mongodb-community`
- **Ubuntu**: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

启动服务：

```bash
# Windows (以管理员身份运行 PowerShell)
net start MongoDB

# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

### 2) 配置 MongoDB 认证（安全必须）

**⚠️ 本项目要求 MongoDB 启用认证，必须先创建数据库用户。**

#### 情况 A：首次配置（没有管理员账号）

如果你的 MongoDB 刚安装且启用了认证（`authorization: enabled`），但还没有创建任何用户，你会看到 `Command createUser requires authentication` 错误。需要**临时关闭认证**来创建第一个管理员：

**步骤 1：编辑 MongoDB 配置文件**

```bash
# Ubuntu/macOS
sudo nano /etc/mongod.conf

# Windows (用记事本或 VS Code 打开)
notepad "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"
```

找到 `security` 部分，注释掉或删除：
```yaml
# 注释掉这两行
# security:
#   authorization: enabled
```

**步骤 2：重启 MongoDB**

```bash
# Ubuntu
sudo systemctl restart mongod

# macOS
brew services restart mongodb-community

# Windows (管理员 PowerShell)
net stop MongoDB
net start MongoDB
```

**步骤 3：创建用户（此时无需认证）**

```bash
mongosh

# 创建业务数据库用户（推荐，权限最小化）
use myblog
db.createUser({
  user: "bloguser",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "myblog" }]
})

# 同时创建一个管理员（用于管理其他数据库）
use admin
db.createUser({
  user: "admin",
  pwd: "your_admin_password",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})
```

**步骤 4：重新启用认证**

编辑配置文件，取消注释：
```yaml
security:
  authorization: enabled
```

重启 MongoDB 服务。

**步骤 5：验证连接**

```bash
# 测试业务用户
mongosh myblog -u bloguser -p your_secure_password --authenticationDatabase myblog

# 测试管理员
mongosh -u admin -p your_admin_password --authenticationDatabase admin
```

#### 情况 B：已有管理员账号

如果你已经有管理员账号，直接登录创建业务用户：

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

> 💡 **关于 authSource**：用户创建在哪个数据库，`authSource` 就填哪个。上面在 `myblog` 创建的用户，连接时用 `authSource=myblog`；在 `admin` 创建的用户，用 `authSource=admin`。

### 3) 配置 Server 环境变量

```bash
# 复制环境变量模板
copy server\.env.example server\.env

# 编辑 .env 文件，填入数据库认证信息
MONGO_USERNAME=bloguser
MONGO_PASSWORD=your_secure_password
MONGO_AUTH_SOURCE=myblog  # 如果用户创建在 admin 库，改为 admin
```

### 4) 安装依赖

```bash
pnpm -C server install
pnpm -C admin install
pnpm -C frontend install
```

### 5) 启动 Server

```bash
pnpm -C server dev
```

Server 会在 `http://localhost:3000` 启动。

**首次启动后，创建管理员账号：**

`.env` 中已配置了默认管理员账号（`ADMIN_USERNAME` 和 `ADMIN_PASSWORD`），直接运行：

```bash
cd server
npx ts-node src/scripts/createAdmin.ts --yes
```

如需自定义账号，可添加参数（优先级高于环境变量）：
```bash
npx ts-node src/scripts/createAdmin.ts --yes --username myadmin --password mypass123
```

### 6) 配置 Admin & Frontend（可选）

```bash
# Admin
copy admin\.env.example admin\.env.local
# 默认配置即可

# Frontend  
copy frontend\.env.example frontend\.env.local
# 默认配置即可
```

### 7) 启动所有服务

```bash
pnpm -C server dev      # http://localhost:3000
pnpm -C admin dev       # http://localhost:3001
pnpm -C frontend dev    # http://localhost:4321
```

> 💡 **遇到网络问题？** 如果你在虚拟机/远程服务器开发，请参考 [开发网络配置指南](docs/DEVELOPMENT_NETWORK.md)。

---

## 认证说明（HttpOnly Cookie）

- 登录成功后由服务端写入 HttpOnly Cookie（前端不保存 token）。  
- 前端请求需带上 `credentials: 'include'`（已在 admin 中实现）。  

主要接口：
- 管理员登录：`POST /api/admin/auth/login`
- 管理员登出：`POST /api/admin/auth/logout`
- 作者登录：`POST /api/auth/login`
- 作者登出：`POST /api/auth/logout`

---

## 一键启动 + 播种数据（可重置 DB）

> ⚠️ `up -Yes` 会 **DROP collections**，清空数据库。

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-test-system.ps1 up -Yes
```

脚本说明：`scripts/README.md`

---

## 安全配置说明

本项目**默认要求 MongoDB 认证**，以防止未授权访问。如需显式禁用（不推荐，仅限特殊测试环境）：

```bash
# 在 .env 中添加
MONGO_AUTH_ENABLED=false
```

---

## 故障排查

### MongoDB 连接失败

**错误**: `MONGO_USERNAME is required for security reasons.`
- **原因**: 没有配置数据库认证信息
- **解决**: 按步骤 2 创建用户，并在 .env 中配置

**错误**: `Authentication failed.`
- **原因**: 用户名/密码错误或 authSource 不正确
- **解决**: 检查 MONGO_USERNAME、MONGO_PASSWORD 和 MONGO_AUTH_SOURCE

### 查看 MongoDB 日志

```bash
# Windows
type "C:\Program Files\MongoDB\Server\8.2\log\mongod.log"

# macOS/Linux
tail -f /var/log/mongodb/mongod.log
```

---

## 文档索引

- Server：`server/README.md`
- Admin：`admin/README.md`
- Frontend：`frontend/README.md`
- API：`docs/API.md`
- 部署：`docs/DEPLOYMENT.md`
