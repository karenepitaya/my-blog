# Article 模块实现回顾（重构版）

> 目标：先把文章作为核心模型跑通（Author/Admin/Public），再围绕 Article 去完善 Tag/Category/Comment 等模块，形成闭环。

## 1) 数据模型拆分

为了降低列表查询压力、同时保证公共端访问的“开箱即用”，Article 使用 **Meta + Content** 拆分：

- `Article`（元信息：标题/slug/状态/作者/分类/标签/发布信息/删除信息/计数等）
- `ArticleContent`（内容：markdown + 预渲染 html + toc）

这样做的直接收益：

- 列表页只查 `Article`，不会把大字段 markdown 一起拉出来。
- 公共端默认走 `html + toc`，减少“每次请求都渲染 markdown”带来的 CPU 消耗。
- 编辑阶段只存 markdown；发布时统一渲染并持久化，保证输出稳定且可控（也更利于做缓存/CDN）。

对应文件：

- `server/src/models/ArticleModel.ts`
- `server/src/models/ArticleContentModel.ts`

## 2) 状态机（按你描述的业务场景落地）

状态枚举：`DRAFT | EDITING | PUBLISHED | PENDING_DELETE`

核心流转：

- 创建：`DRAFT`
- 发布：`DRAFT/EDITING -> PUBLISHED`
- 撤销发布进入编辑态：`PUBLISHED -> EDITING`
- 存为草稿：`EDITING -> DRAFT`
- 删除：
  - `DRAFT/EDITING`：直接硬删除（Meta + Content 一起删除）
  - `PUBLISHED`：进入回收站（`PENDING_DELETE` + 宽限期）

Admin 删除的额外约束（为“作者申请恢复”留了口子）：

- Admin 删除后文章进入 `PENDING_DELETE`
- Author **不能直接 restore / confirm-delete**，只能 `request-restore`（写入 `restoreRequestedAt/message`）
- Admin 决定是否 restore

对应文件：

- `server/src/interfaces/Article.ts`
- `server/src/services/AuthorArticleService.ts`
- `server/src/services/AdminArticleService.ts`

## 3) Slug 策略（作者维度唯一 + 不开放自定义）

- slug 基于标题自动生成（`createSlug(title)`）
- 唯一性是 `{ authorId, slug }`（允许不同作者出现相同标题）
- 为了避免公开链接抖动：**首次发布后不再自动变更 slug**（仅在从未发布前，title 变化才会刷新 slug）

对应索引：

- `ArticleSchema.index({ authorId: 1, slug: 1 }, { unique: true })`

## 4) Markdown 渲染策略（安全 + 可缓存）

发布时渲染并持久化：

- `markdown -> sanitized html`
- 自动为 heading 生成稳定 `id`，同时输出 `toc`

公共端详情默认使用持久化 html；如果历史数据 `html` 缺失，会触发一次“按需渲染并回写”。

对应文件：

- `server/src/utils/markdown.ts`
- `server/src/services/PublicArticleService.ts`

## 5) API（不兼容旧接口，按新架构走）

Author（需 author token）：

- `GET /api/articles`
- `POST /api/articles`
- `GET /api/articles/:id`
- `PUT /api/articles/:id`
- `POST /api/articles/:id/publish`
- `POST /api/articles/:id/unpublish`
- `POST /api/articles/:id/save-draft`
- `POST /api/articles/:id/delete`
- `POST /api/articles/:id/restore`
- `POST /api/articles/:id/request-restore`
- `POST /api/articles/:id/confirm-delete`

Admin（需 admin token + `article:manage`）：

- `GET /api/admin/articles`
- `GET /api/admin/articles/:id`
- `POST /api/admin/articles/:id/delete`
- `POST /api/admin/articles/:id/restore`
- `POST /api/admin/articles/:id/purge`
- `PATCH /api/admin/articles/:id/admin-meta`

Public（仅 Published）：

- `GET /api/public/articles`
- `GET /api/public/articles/:id`
- `GET /api/public/articles/slug/:authorId/:slug`

对应测试用例：

- `server/notes/article-management-testcases.md`

## 6) 回收站到期清理（脚本）

提供脚本用于清理超过宽限期的文章（同时清理 `ArticleContent`）：

- `server/src/scripts/purgePendingDeleteArticles.ts`

建议后续：

- 用 cron / 定时任务跑脚本
- 或者未来用队列/worker 做成异步清理

## 7) 下一步建议（按依赖顺序）

- Tag 模块（先占位 string[]，后续替换为 TagModel + tagIds）
- Category：补“文章归属数量统计/公共导航”等公共端接口
- Comment：依赖 public article detail 的稳定输出后再做
- 通知系统：把“admin 删除通知 / author 恢复申请”从字段演进为独立通知/工单
