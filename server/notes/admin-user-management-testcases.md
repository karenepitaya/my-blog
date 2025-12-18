# Admin 用户管理接口：Apifox 测试用例（两种方式）

本文用于你在 Apifox 中验证 `/api/admin/users` 用户管理接口（列表/详情/重置/禁言/解禁/删除缓解期/恢复/备注）。

你可以任选其一：

- 方式 A：把本文的 `cURL` 直接粘到 Apifox（导入/调试）
- 方式 B：在 Apifox 里按“接口 + 环境变量 + 脚本断言”组织成可重复跑的用例（推荐）

## 0. 前置条件

- 服务启动：`cd server && npm run dev`
- MongoDB 可用，且已存在 `admin` 账号（可用 `pnpm ts-node src/scripts/createAdmin.ts` 创建）

## 1. 接口调用路径（你要求的“模拟路径”）

所有 admin user 接口统一经过：

`server/src/routes/adminUserRoutes.ts` → `authMiddleware` → `requirePermission(Permissions.USER_MANAGE)` → `validateRequest` → `AdminUserController.*` → `AdminUserService.*` → `UserRepository` → `UserModel`

## 2. Apifox 环境变量（两种方式都建议配置）

在 Apifox 的“环境”中新增变量：

- `baseUrl`：例如 `http://localhost:3000`
- `token`：管理员登录后写入
- `authorId`：创建 author 后写入
- `authorUsername`：创建 author 后写入
- `authorPassword`：如果使用“自动生成初始密码”，创建/重置后写入
- `adminPassword`：管理员密码（仅本地环境使用）

后续 URL 推荐用：`{{baseUrl}}/api/...`

## 方式 A：cURL（复制到 Apifox 导入/调试）

使用方法（任选一种）：

- Apifox → 接口调试 → 新建接口 → “导入” → 选择 cURL → 粘贴本文 cURL
- 或直接新建接口后，把方法/URL/Headers/Body 按本文填写

### A1. 管理员登录（获取 token）

```bash
curl -X POST {{baseUrl}}/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"<admin-password>\"}"
```

从响应里取 `data.token`，后续接口统一加：

- `Authorization: Bearer <token>`

### A2. 创建 author（支持不传 password 自动生成）

自动生成初始密码（推荐）：

```bash
curl -X POST {{baseUrl}}/api/admin/users ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"author_001\"}"
```

手动指定密码（兼容）：

```bash
curl -X POST {{baseUrl}}/api/admin/users ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"author_002\",\"password\":\"12345678\"}"
```

### A3. 用户列表（点击“用户管理”）

```bash
curl "{{baseUrl}}/api/admin/users?page=1&pageSize=20" ^
  -H "Authorization: Bearer <token>"
```

筛选示例：

```bash
curl "{{baseUrl}}/api/admin/users?page=1&pageSize=20&q=author&status=ACTIVE" ^
  -H "Authorization: Bearer <token>"
```

### A4. 用户详情（点击用户卡片）

```bash
curl {{baseUrl}}/api/admin/users/<userId> ^
  -H "Authorization: Bearer <token>"
```

### A5. 重置账户（不删内容，仅重置账户信息）

```bash
curl -X POST {{baseUrl}}/api/admin/users/<userId>/reset ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"reason\":\"help author recover\"}"
```

### A6. 禁言 / 解禁

禁言：

```bash
curl -X POST {{baseUrl}}/api/admin/users/<userId>/ban ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"reason\":\"spam\"}"
```

解禁：

```bash
curl -X POST {{baseUrl}}/api/admin/users/<userId>/unban ^
  -H "Authorization: Bearer <token>"
```

### A7. 删除缓解期（30 天）/ 恢复

删除（需要二次确认字段 `confirm:true`）：

```bash
curl -X POST {{baseUrl}}/api/admin/users/<userId>/delete ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"confirm\":true}"
```

恢复（需要 `confirm:true`）：

```bash
curl -X POST {{baseUrl}}/api/admin/users/<userId>/restore ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"confirm\":true}"
```

### A7.1 立即硬删除（回收站彻底删除，需要 confirm:true）

仅允许对 `PENDING_DELETE` 状态用户使用（避免误删正常用户）。

```bash
curl -X POST {{baseUrl}}/api/admin/users/<userId>/purge ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"confirm\":true}"
```

### A8. 备注/标签（admin 私有）

```bash
curl -X PATCH {{baseUrl}}/api/admin/users/<userId>/admin-meta ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"remark\":\"VIP\",\"tags\":[\"vip\",\"needs-followup\"]}"
```

清空备注：

```bash
curl -X PATCH {{baseUrl}}/api/admin/users/<userId>/admin-meta ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"remark\":null}"
```

## 方式 B：Apifox “接口 + 环境变量 + 脚本断言”（推荐）

目标：你只要点一次“运行”，就能把 token、authorId、authorPassword 自动串起来，并且每个接口带断言。

### B0. 建议的 Apifox 目录结构

- 00-Auth
  - Admin 登录（写入 `token`）
  - Author 登录（用于验证禁言/删除状态不可登录）
- 01-Admin Users
  - 创建 author（自动生成密码，写入 `authorId/authorUsername/authorPassword`）
  - 列表
  - 详情
  - 重置
  - 禁言
  - 解禁
  - 删除（缓解期）
  - 恢复
  - 备注/标签

### B1. 通用 Headers（建议在 Apifox 接口里统一配置）

除登录接口外，其它接口统一加：

- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`（GET 可不加）

### B2. 通用断言模板（写在“测试脚本/后置脚本”里）

成功响应（你的服务统一是 `{ success, data, error }`）：

```js
const body = pm.response.json();
pm.test('success=true', () => pm.expect(body.success).to.eql(true));
pm.test('error=null', () => pm.expect(body.error).to.eql(null));
```

失败响应：

```js
const body = pm.response.json();
pm.test('success=false', () => pm.expect(body.success).to.eql(false));
pm.test('has error.code', () => pm.expect(body.error.code).to.be.a('string'));
```

### B3. 关键接口配置（含脚本）

#### 1) Admin 登录（写入 token）

- 方法：`POST`
- URL：`{{baseUrl}}/api/auth/login`
- Body(JSON)：

```json
{ "username": "admin", "password": "{{adminPassword}}" }
```

后置脚本（写入 `token`）：

```js
const body = pm.response.json();
pm.expect(body.success).to.eql(true);
pm.environment.set('token', body.data.token);
```

#### 2) 创建 author（自动生成初始密码，写入 authorId/authorPassword）

- 方法：`POST`
- URL：`{{baseUrl}}/api/admin/users`
- Body(JSON)：

```json
{ "username": "author_001" }
```

后置脚本（写入 `authorId/authorUsername/authorPassword`）：

```js
const body = pm.response.json();
pm.expect(body.success).to.eql(true);
pm.environment.set('authorId', body.data.user.id);
pm.environment.set('authorUsername', body.data.user.username);
if (body.data.initialPassword) {
  pm.environment.set('authorPassword', body.data.initialPassword);
}
```

如果你改用“手动指定密码”的创建方式，则需要你自己在环境里手动填好 `authorPassword`。

#### 3) 列表

- 方法：`GET`
- URL：`{{baseUrl}}/api/admin/users?page=1&pageSize=20`

断言示例：

```js
const body = pm.response.json();
pm.expect(body.success).to.eql(true);
pm.expect(body.data.items).to.be.an('array');
```

#### 4) 详情（确认不泄漏密码哈希）

- 方法：`GET`
- URL：`{{baseUrl}}/api/admin/users/{{authorId}}`

断言示例：

```js
const body = pm.response.json();
pm.expect(body.success).to.eql(true);
pm.expect(body.data.passwordHash).to.eql(undefined);
```

#### 5) 重置（返回新的初始密码）

- 方法：`POST`
- URL：`{{baseUrl}}/api/admin/users/{{authorId}}/reset`
- Body(JSON)：

```json
{ "reason": "help author recover" }
```

后置脚本（更新 authorPassword）：

```js
const body = pm.response.json();
pm.expect(body.success).to.eql(true);
pm.environment.set('authorPassword', body.data.initialPassword);
```

#### 6) 禁言 → Author 登录应失败

禁言接口：

- 方法：`POST`
- URL：`{{baseUrl}}/api/admin/users/{{authorId}}/ban`
- Body(JSON)：

```json
{ "reason": "spam" }
```

Author 登录接口（用于验证禁言不可登录）：

- 方法：`POST`
- URL：`{{baseUrl}}/api/auth/login`
- Body(JSON)：

```json
{ "username": "{{authorUsername}}", "password": "{{authorPassword}}" }
```

断言示例：

```js
const body = pm.response.json();
pm.expect(body.success).to.eql(false);
pm.expect(body.error.code).to.eql('ACCOUNT_DISABLED');
```

#### 7) 解禁

- 方法：`POST`
- URL：`{{baseUrl}}/api/admin/users/{{authorId}}/unban`

#### 8) 删除（缓解期）/ 恢复（都需要 confirm:true）

删除：

- 方法：`POST`
- URL：`{{baseUrl}}/api/admin/users/{{authorId}}/delete`
- Body(JSON)：

```json
{ "confirm": true }
```

恢复：

- 方法：`POST`
- URL：`{{baseUrl}}/api/admin/users/{{authorId}}/restore`
- Body(JSON)：

```json
{ "confirm": true }
```

#### 8.1) 立即硬删除（回收站彻底删除，confirm:true）

- 方法：`POST`
- URL：`{{baseUrl}}/api/admin/users/{{authorId}}/purge`
- Body(JSON)：

```json
{ "confirm": true }
```

#### 9) 备注/标签

- 方法：`PATCH`
- URL：`{{baseUrl}}/api/admin/users/{{authorId}}/admin-meta`
- Body(JSON)：

```json
{ "remark": "VIP", "tags": ["vip", "needs-followup"] }
```

## 3. 通用负例清单（Apifox 里建议单独做成“测试用例”）

- 不带 `Authorization` 调 admin 接口 → `401 NO_TOKEN`
- 使用 author token 调 `/api/admin/users*` → `403 FORBIDDEN`
- `/delete` 不带 `{ "confirm": true }` → `400 VALIDATION_ERROR`
- 对非 `BANNED` 用户调用 `/unban` → `409 NOT_BANNED`
- 对非 `PENDING_DELETE` 用户调用 `/restore` → `409 NOT_PENDING_DELETE`
- 对非 `PENDING_DELETE` 用户调用 `/purge` → `409 NOT_PENDING_DELETE`

## 4. 到期硬删除（脚本，非 Apifox）

当你需要模拟“缓解期到期后硬删除”，可把某用户 `deleteScheduledAt` 改成过去的时间，然后运行：

```bash
cd server
npx ts-node src/scripts/purgePendingDeleteUsers.ts
```

期望：

- 输出 `Users to purge: N`
- 确认后输出 `Purged users: N`
