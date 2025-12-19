# Tag 模块实现回顾（重构版）

## 1) 需求落地要点

- Tag 是全局资源：所有 Author 可见，Admin 全开。
- Author 只负责创建与使用；不提供 Author 删除入口。
- Tag 不作为“容器”，仅作为 `Article.tags` 的属性。
- Admin 删除 Tag 为硬删除；删除后系统会自动从所有文章的 tags 中移除该 tag（不设计宽限期）。

## 2) 数据结构与索引

Tag 采用独立集合存储（MongoDB collection），保证动态扩展与全局可检索：

- `name`：展示名
- `slug`：全局唯一、URL 友好（便于后续做 Tag 网络/Tag 页面）
- `createdBy`：创建者（Author）
- `createdAt/updatedAt`：用于排序与审计

索引：

- `slug` 唯一索引（全局唯一）
- `name` 普通索引（用于排序/检索）

对应文件：

- `server/src/models/TagModel.ts`
- `server/src/interfaces/Tag.ts`

## 3) API 设计（新架构，不兼容旧接口）

Author（需 author token）：

- `GET /api/tags`（全局 tags 列表 + q 搜索 + 分页）
- `POST /api/tags`（创建 tag，slug 冲突时幂等返回已有 tag）

Admin（需 admin token + `tag:manage`）：

- `GET /api/admin/tags`
- `GET /api/admin/tags/:id`
- `POST /api/admin/tags/:id/delete`（硬删除 + 级联从文章中移除）

对应文件：

- `server/src/routes/tagRoutes.ts`
- `server/src/routes/adminTagRoutes.ts`
- `server/src/controllers/AuthorTagController.ts`
- `server/src/controllers/AdminTagController.ts`
- `server/src/services/AuthorTagService.ts`
- `server/src/services/AdminTagService.ts`

## 4) 与 Article.tags 的联动策略

- `Article.tags` 在当前阶段存储为 `string[]`，但写入的是 **tag slug 列表**（而不是随意的展示名）。
- Author 在创建/更新文章时提交 tags（仅允许 Draft/Editing），服务端会：
  1) 将输入 tag name 规范化为 slug
  2) 确保这些 tags 已存在于全局 Tag 库（缺失则创建）
  3) 写入文章 `tags=[slug]`

这样设计的收益：

- 文章检索/筛选可以稳定基于 slug（无需处理大小写/空格/符号差异）。
- 后续做 “点击某个 Tag -> 查看该 Tag 下文章” 时，服务端只需用 slug 过滤文章即可。

对应文件：

- `server/src/services/AuthorArticleService.ts`

## 5) 删除影响范围

Admin 删除 Tag 时：

- 删除 Tag 文档（硬删）
- 对所有文章执行 `$pull`：移除该 slug
- 返回 `affectedArticles`（被影响文章数量）

对应文件：

- `server/src/services/AdminTagService.ts`
- `server/src/repositories/ArticleRepository.ts`

## 6) 测试用例

- `server/notes/tag-management-testcases.md`
