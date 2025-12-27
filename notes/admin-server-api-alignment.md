# Admin 与 Server 接口对齐文档

> 目标：梳理 admin 前端与 server 现有接口的对应关系、可用字段、以及尚未对齐/缺失点，便于后续对齐与改造。
> 数据来源：`admin/services/api.ts`、`server/src/routes/*`、`server/src/controllers/*`

## 1. 基本约定

- API Base：`/api`（默认 `http://localhost:3000/api`，admin 通过 `VITE_API_BASE_URL` 配置）
- 统一响应格式：

  ```json
  {"success": true, "data": <payload>, "error": null}
  {"success": false, "data": null, "error": {"code": "...", "message": "...", "details": "..."}}
  ```

- 认证：`Authorization: Bearer <token>`
  - 管理员：`/api/admin/auth/login` -> `audience=admin`
  - 作者：`/api/auth/login` -> `audience=author`
- 角色：`admin` / `author`（小写）
- 状态枚举：
  - ArticleStatus：`DRAFT` | `EDITING` | `PUBLISHED` | `PENDING_DELETE`
  - CategoryStatus：`ACTIVE` | `PENDING_DELETE`
  - UserStatus：`ACTIVE` | `BANNED` | `PENDING_DELETE`

## 2. 登录/认证对齐

### Server 接口

- `POST /api/admin/auth/login`
  - body：`{ username, password }`
  - res：`{ token, user }`
- `GET /api/admin/auth/me`
  - res：`{ id, username, role, status, avatarUrl, lastLoginAt, createdAt, updatedAt }`

- `POST /api/auth/login`（作者登录）
  - body：`{ username, password }`
  - res：`{ token, user }`
- `GET /api/profile`（作者自信息）
  - res：`{ id, username, role, status, avatarUrl, bio, lastLoginAt, createdAt, updatedAt }`

### Admin 当前实现

- `ApiService.login()` -> 根据角色路由到 `/admin/auth/login` 或 `/auth/login`
- 登录后调用 `/admin/auth/me` 或 `/profile` 校验会话

### 对齐注意点

- Server 不提供 email 字段，admin 不能依赖 email 登录或展示

## 3. 作者管理（Admin）

### Server 接口（`/api/admin/users`）

- `GET /admin/users`（分页）
  - query：`page, pageSize(<=100), q?, status?, role?`
- `GET /admin/users/:id`
- `POST /admin/users`（创建作者）
  - body：`{ username, password? }`
  - res：`{ user, initialPassword? }`
- `POST /admin/users/:id/reset`
  - res：`{ user, initialPassword }`
- `POST /admin/users/:id/ban`（可带 reason）
- `POST /admin/users/:id/unban`
- `POST /admin/users/:id/delete`（软删除）
  - body：`{ confirm: true, graceDays? }`
- `POST /admin/users/:id/restore`（软删除恢复）
  - body：`{ confirm: true }`
- `POST /admin/users/:id/purge`（硬删除）
  - body：`{ confirm: true }`
- `PATCH /admin/users/:id/admin-meta`
  - body：`{ remark?, tags? }`

### Admin 当前实现

- 已用：list/create/reset/ban/unban/delete/restore/purge
- 未用：`GET /admin/users/:id`、`admin-meta`、`q/status/role` 等筛选参数
- 备注：admin 目前不传 `graceDays` / `reason`

## 4. 文章管理（Admin + Author）

### Admin 端接口

- `GET /admin/articles`（分页）
  - query：`page, pageSize(<=100), status?, authorId?, q?`
- `GET /admin/articles/:id`（含 `content.markdown`）
- `POST /admin/articles/:id/delete`
  - body：`{ confirm: true, graceDays?, reason? }`
- `POST /admin/articles/:id/restore`
- `POST /admin/articles/:id/purge`
- `PATCH /admin/articles/:id/admin-meta`（remark）

### Author 端接口

- `GET /articles`（分页）
  - query：`page, pageSize(<=100), status?, q?, categoryId?`
- `POST /articles`（创建）
  - body：`{ title, markdown, summary?, coverImageUrl?, tags?, categoryId? }`
- `GET /articles/:id`（含 `content.markdown/html/toc`）
- `PUT /articles/:id`（更新）
- `POST /articles/:id/publish` / `unpublish` / `save-draft`
- `POST /articles/:id/delete`（软删除）
  - body：`{ confirm: true, graceDays?, reason? }`
- `POST /articles/:id/restore`
- `POST /articles/:id/request-restore`
- `POST /articles/:id/confirm-delete`（硬删除）

### Admin 当前实现

- Admin 角色：list/detail/delete/restore/purge
- Author 角色：list/detail(create/edit)/publish/save-draft/delete/restore/purge
- 未用：`unpublish`、`request-restore`、`confirm-delete`、`admin-meta`、`reason/graceDays`

### 对齐注意点

- 列表接口不返回 markdown，编辑前必须调用 detail（已在 admin 做了）
- 管理员删除已发布文章会进入 `PENDING_DELETE`；未发布则直接硬删
- admin 端列表 `pageSize=200` 会被 server 截断为 100

## 5. 分类管理（Admin + Author）

### Admin 端接口（`/api/admin/categories`）

- `GET /admin/categories`（分页）
  - query：`page, pageSize(<=100), status?, ownerId?`
- `GET /admin/categories/:id`
- `POST /admin/categories/:id/delete`（软删除）
- `POST /admin/categories/:id/restore`
- `POST /admin/categories/:id/purge`
- `PATCH /admin/categories/:id/admin-meta`（remark）

### Author 端接口（`/api/categories`）

- `GET /categories`（默认 `status=ACTIVE`）
- `POST /categories`（创建）
  - body：`{ name, slug?, description? }`
- `GET /categories/:id`
- `PUT /categories/:id`
- `POST /categories/:id/delete`
- `POST /categories/:id/confirm-delete`

### Admin 当前实现

- Admin 角色：list/delete（未用 detail/restore/purge/admin-meta）
- Author 角色：list/create/update/delete（未用 confirm-delete）

## 6. 标签管理（当前未对齐）

### Server 接口

- Admin：`GET /admin/tags`, `GET /admin/tags/:id`, `POST /admin/tags/:id/delete`
- Author：`GET /tags`, `POST /tags`

### Admin 当前实现

- 未集成标签管理 UI/接口

## 7. 上传（当前未对齐）

### Server 接口

- Admin：`POST /admin/upload`（multipart file，body: `{ purpose?: 'avatar' | 'article_cover' | 'misc' }`）
- Author：`POST /uploads`（同上）

### Admin 当前实现

- 未集成上传能力

## 8. 对齐缺口清单（建议优先级）

1. **标签管理缺失**：admin 未调用 `/admin/tags` 或 `/tags`
2. **上传能力缺失**：未对接 `/admin/upload` 与 `/uploads`
3. **Admin-meta 未使用**：用户/分类/文章的 `remark/tags` 未在 UI 展示/编辑
4. **分页与过滤**：admin 只用固定 `pageSize=200`，且未提供 q/status/role 等筛选
5. **文章完整生命周期**：缺少 `unpublish`、`request-restore`、`confirm-delete` 的 UI 入口
6. **分类删除确认**：author 侧未调用 `confirm-delete`

## 9. 建议的对齐顺序

1. 管理员标签/上传接口
2. 文章生命周期完整操作（unpublish、request-restore、confirm-delete）
3. 用户/分类/文章的 admin-meta 与筛选
4. 分页策略统一与 UI 分页组件补齐

---
如需我继续补充某个接口的字段细节或生成对齐 checklist（按页面/组件拆分），告诉我对应页面即可。
