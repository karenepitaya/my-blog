# Tag（标签）管理：Apifox 测试用例（最小版）

## 0. 前置

- Admin 登录：`POST /api/admin/auth/login`（拿到 `{{adminToken}}`）
- Author 登录：`POST /api/auth/login`（拿到 `{{authorToken}}`）

建议在 Apifox 环境变量中配置：
- `baseUrl`
- `adminToken`
- `authorToken`
- `tagId`
- `tagSlug`

## 1. Author 端（创建 + 查询全局 Tag）

### 1.1 Tag 列表（全局可见）

`GET {{baseUrl}}/api/tags?page=1&pageSize=50`

Headers：
- `Authorization: Bearer {{authorToken}}`

可选查询：
- `q=vue`

期望：
- `200`
- 返回 `items` 为全局 tags（不区分 createdBy）

### 1.2 创建 Tag（全局唯一 slug）

`POST {{baseUrl}}/api/tags`

Headers：
- `Authorization: Bearer {{authorToken}}`

Body(JSON)：
```json
{ "name": "Vue.js" }
```

期望：
- `201`
- 返回 `data.slug`（例如 `vuejs`）
- 如果 slug 已存在：返回已有 tag（幂等）
- 后置脚本：写入 `tagId=data.id`、`tagSlug=data.slug`

## 2. Admin 端（全局查询 + 删除）

### 2.1 Tag 列表

`GET {{baseUrl}}/api/admin/tags?page=1&pageSize=50`

Headers：
- `Authorization: Bearer {{adminToken}}`

可选查询：
- `q=vue`

### 2.2 Tag 详情

`GET {{baseUrl}}/api/admin/tags/{{tagId}}`

Headers：
- `Authorization: Bearer {{adminToken}}`

### 2.3 删除 Tag（硬删除）

`POST {{baseUrl}}/api/admin/tags/{{tagId}}/delete`

Headers：
- `Authorization: Bearer {{adminToken}}`

Body(JSON)：
```json
{ "confirm": true }
```

期望：
- `200`
- 返回 `deleted=true`
- 返回 `affectedArticles`（受影响文章数量，文章的 tags 数组会自动移除该 tag slug）

