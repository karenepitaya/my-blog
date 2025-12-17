# Server Scripts

本目录包含服务端的维护/初始化脚本（建议仅用于本地开发或测试环境）。

⚠️ 危险提示：涉及清库/删集合的脚本会删除数据与索引，**不要在生产环境运行**。

## 运行方式

建议在 `server` 目录执行命令（这样会自动读取 `server/.env`）：

```bash
cd server
pnpm ts-node src/scripts/init.ts --help
```

## 环境变量

脚本通过 `server/.env` 加载配置（实际字段与 `server/src/config/env.ts` 一致），常用项：

- `MONGO_URI`（可选：直接提供连接串；否则使用下方拆分变量拼接）
- `MONGO_USERNAME`
- `MONGO_PASSWORD`
- `MONGO_HOST`
- `MONGO_PORT`
- `MONGO_DBNAME`
- `JWT_SECRET`
- `ADMIN_USERNAME`（可选）
- `ADMIN_PASSWORD`（可选）

## init.ts（推荐入口）

用途：统一入口编排，避免“散落脚本”直接误操作。

```bash
pnpm ts-node src/scripts/init.ts --create-admin
pnpm ts-node src/scripts/init.ts --reset-db
pnpm ts-node src/scripts/init.ts --reset-db --delete-only
```

- `--reset-db`：默认 **DROP 所有集合（文档 + 索引）**
- `--delete-only`：仅删除文档（**保留索引**，无法清除遗留唯一索引）
- `--yes`：跳过 init 自己的确认（危险）

确认口令：

- DROP 模式：`DROP <dbName>`

- delete-only 模式：`DELETE <dbName>`

## clearDatabase.ts

用途：清空数据库数据。

```bash
pnpm ts-node src/scripts/clearDatabase.ts
pnpm ts-node src/scripts/clearDatabase.ts --delete-only
```

默认会 **DROP 所有集合**，这会同时清除索引（能解决“脚本只删文档导致索引残留”的问题）。

## createAdmin.ts

用途：创建管理员账号（幂等：同名用户存在则退出）。

```bash
pnpm ts-node src/scripts/createAdmin.ts
pnpm ts-node src/scripts/createAdmin.ts --username admin --password "passw0rd"
```

确认口令：`CREATE <username>`（例如：`CREATE admin`）。
