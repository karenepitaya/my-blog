# Article（文章）管理：Apifox 测试用例（最小版）

## 0. 前置

- Admin 登录：`POST /api/admin/auth/login`（拿到 `{{adminToken}}`）
- Author 登录：`POST /api/auth/login`（拿到 `{{authorToken}}`）

建议在 Apifox 环境变量中配置：

- `baseUrl`
- `adminToken`
- `authorToken`
- `authorId`（从 author 登录返回的 `data.user.id` 写入）
- `articleId`（创建文章后写入）
- `articleId2`（用于删除/回收站流程的第二篇文章）
- `slug`（创建文章后写入：`data.slug`）

## 1. Author 端（仅可见自己的文章）

### 1.1 创建文章（Draft）

`POST {{baseUrl}}/api/articles`

Headers：

- `Authorization: Bearer {{authorToken}}`

Body(JSON)：

```json
{
  "title": "我的第一篇文章",
  "markdown": "# Hello\n\nThis is **markdown**.\n",
  "summary": "可选摘要",
  "tags": ["demo", "markdown"],
  "categoryId": null
}
```

期望：

- `201`
- 返回 `data.id`、`data.status=DRAFT`、`data.slug`
- 后置脚本：写入 `articleId=data.id`、`slug=data.slug`

### 1.2 列表（默认按 updatedAt 倒序）

`GET {{baseUrl}}/api/articles?page=1&pageSize=20`

可选查询：

- `status=DRAFT|EDITING|PUBLISHED|PENDING_DELETE`
- `q=keyword`
- `categoryId={{categoryId}}`

### 1.3 详情（含 markdown）

`GET {{baseUrl}}/api/articles/{{articleId}}`

### 1.4 发布（Draft/Editing -> Published）

`POST {{baseUrl}}/api/articles/{{articleId}}/publish`

Body(JSON)：

```json
{ "confirm": true }
```

期望：

- `200`
- 返回 `data.status=PUBLISHED`
- 返回 `data.content.html` + `data.content.toc`

### 1.5 撤销发布（Published -> Editing）

`POST {{baseUrl}}/api/articles/{{articleId}}/unpublish`

Body(JSON)：

```json
{ "confirm": true }
```

期望：

- `200`
- 返回 `data.status=EDITING`

### 1.6 更新（仅允许 Draft/Editing）

`PUT {{baseUrl}}/api/articles/{{articleId}}`

Body(JSON) 示例：

```json
{
  "title": "更新后的标题",
  "markdown": "# Updated\n\nNew content.\n",
  "tags": ["demo", "update"]
}
```

### 1.7 存为草稿（Editing -> Draft）

`POST {{baseUrl}}/api/articles/{{articleId}}/save-draft`

Body(JSON)：

```json
{ "confirm": true }
```

期望：

- `200`
- `data.status=DRAFT`

### 1.8 删除（Draft/Editing 直接硬删；Published 进入回收站）

`POST {{baseUrl}}/api/articles/{{articleId2}}/delete`

Body(JSON)：

```json
{
  "confirm": true,
  "graceDays": 7,
  "reason": "可选：删除原因"
}
```

期望：

- 若 `Draft/Editing`：返回 `{deleted:true}`
- 若 `Published`：返回 `status=PENDING_DELETE` + `deleteScheduledAt`

### 1.9 回收站恢复（仅作者自己删除的文章可直接恢复）

`POST {{baseUrl}}/api/articles/{{articleId2}}/restore`

Body(JSON)：

```json
{ "confirm": true }
```

期望：

- `200`
- `data.status=PUBLISHED`

### 1.10 回收站确认删除（仅作者自己删除的文章可 purge）

`POST {{baseUrl}}/api/articles/{{articleId2}}/confirm-delete`

Body(JSON)：

```json
{ "confirm": true }
```

期望：

- `200`
- `purged=true`

## 2. Public 端（仅公开 Published）

### 2.1 公共列表

`GET {{baseUrl}}/api/public/articles?page=1&pageSize=20`

可选查询：

- `authorId={{authorId}}`
- `categoryId={{categoryId}}`
- `tag=demo`
- `q=keyword`

### 2.2 公共详情（按 id）

`GET {{baseUrl}}/api/public/articles/{{articleId}}`

期望：

- `200`
- 返回 `data.content.html` + `data.content.toc`

### 2.3 公共详情（按 authorId + slug）

`GET {{baseUrl}}/api/public/articles/slug/{{authorId}}/{{slug}}`

## 3. Admin 端（全局可见）

### 3.1 列表

`GET {{baseUrl}}/api/admin/articles?page=1&pageSize=20`

Headers：

- `Authorization: Bearer {{adminToken}}`

可选查询：

- `status=DRAFT|EDITING|PUBLISHED|PENDING_DELETE`
- `authorId={{authorId}}`
- `q=keyword`

### 3.2 详情

`GET {{baseUrl}}/api/admin/articles/{{articleId}}`

### 3.3 删除（Published -> 回收站；非 Published 直接硬删）

`POST {{baseUrl}}/api/admin/articles/{{articleId}}/delete`

Body(JSON)：

```json
{
  "confirm": true,
  "graceDays": 7,
  "reason": "违规/敏感等原因说明"
}
```

### 3.4 Author 申请恢复（仅 admin 删除的文章）

1) Author 尝试直接恢复（期望 403）：
`POST {{baseUrl}}/api/articles/{{articleId}}/restore`

2) Author 发起恢复申请：
`POST {{baseUrl}}/api/articles/{{articleId}}/request-restore`

Body(JSON)：

```json
{ "message": "申请恢复的说明" }
```

### 3.5 Admin 恢复（回收站 -> Published）

`POST {{baseUrl}}/api/admin/articles/{{articleId}}/restore`

Body(JSON)：

```json
{ "confirm": true }
```

### 3.6 Admin 立即清理（仅回收站）

`POST {{baseUrl}}/api/admin/articles/{{articleId}}/purge`

Body(JSON)：

```json
{ "confirm": true }
```

### 3.7 Admin 备注（仅 admin 可见）

`PATCH {{baseUrl}}/api/admin/articles/{{articleId}}/admin-meta`

Body(JSON)：

```json
{ "remark": "需要关注" }
```

清空备注：

```json
{ "remark": null }
```
