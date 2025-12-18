# Category（专栏）管理：Apifox 测试用例（最小版）

## 0. 前置

- Admin 登录：`POST /api/admin/auth/login`（拿到 `{{adminToken}}`）
- Author 登录：`POST /api/auth/login`（拿到 `{{authorToken}}`）

建议在 Apifox 环境变量配置：

- `baseUrl`
- `adminToken`
- `authorToken`
- `categoryId`

## 1. Author 端（仅看自己的 category）

### 1.1 创建 category

`POST {{baseUrl}}/api/categories`

Headers：

- `Authorization: Bearer {{authorToken}}`

Body(JSON)：

```json
{ "name": "我的专栏", "description": "..." }
```

期望：

- `201`
- 返回包含 `id/ownerId/status=ACTIVE`
- 后置脚本：把 `data.id` 写入 `categoryId`

### 1.2 列表（默认 ACTIVE）

`GET {{baseUrl}}/api/categories`

### 1.3 列表（回收站）

`GET {{baseUrl}}/api/categories?status=PENDING_DELETE`

### 1.4 删除（送入回收站，7 天后到期）

`POST {{baseUrl}}/api/categories/{{categoryId}}/delete`

Body(JSON)：

```json
{ "confirm": true }
```

期望：返回 `status=PENDING_DELETE` + `deleteScheduledAt`

### 1.5 确认删除（立即硬删除，仅限回收站状态）

`POST {{baseUrl}}/api/categories/{{categoryId}}/confirm-delete`

Body(JSON)：

```json
{ "confirm": true }
```

期望：返回 `purged=true`

## 2. Admin 端（全局可见，不能创建）

### 2.1 列表（全局）

`GET {{baseUrl}}/api/admin/categories?page=1&pageSize=20`

Headers：

- `Authorization: Bearer {{adminToken}}`

### 2.2 回收站列表

`GET {{baseUrl}}/api/admin/categories?page=1&pageSize=20&status=PENDING_DELETE`

### 2.3 详情

`GET {{baseUrl}}/api/admin/categories/{{categoryId}}`

### 2.4 删除（送入回收站，默认 7 天）

`POST {{baseUrl}}/api/admin/categories/{{categoryId}}/delete`

Body(JSON)：

```json
{ "confirm": true }
```

可选：`graceDays`（1~30）

### 2.5 恢复（仅回收站）

`POST {{baseUrl}}/api/admin/categories/{{categoryId}}/restore`

Body(JSON)：

```json
{ "confirm": true }
```

### 2.6 立即硬删除（仅回收站）

`POST {{baseUrl}}/api/admin/categories/{{categoryId}}/purge`

Body(JSON)：

```json
{ "confirm": true }
```

### 2.7 备注（仅 admin 可见）

`PATCH {{baseUrl}}/api/admin/categories/{{categoryId}}/admin-meta`

Body(JSON)：

```json
{ "remark": "需要关注" }
```

清空备注：

```json
{ "remark": null }
```
