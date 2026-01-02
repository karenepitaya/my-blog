# 项目配置清单

本文件按你给出的分类整理当前项目中的**可配置参数**，并标注必填/可选、默认值与来源位置。  
如需新增配置项，请先确认是否由环境变量（env）、系统配置（SystemConfig）或用户资料字段承载。

说明：

- “必填”指系统运行或该功能可用所需的参数。
- “可选”指留空不影响基础运行，但会影响对应功能或体验。
- “来源”给出主要实现位置，便于回溯代码。

---

## 1. 管理员资料配置

当前资料字段基于 `User` 模型，作者端通过 `/profile` 接口更新；管理员账号没有独立的更新接口，但字段结构一致，可通过管理端/脚本更新。

### 1.1 资料字段（User Profile）

- `username`
  - 必填：是（创建账号时）
  - 类型：string
  - 默认：无
  - 说明：登录账号；当前 UI 不提供修改。
  - 来源：`server/src/interfaces/User.ts`
- `avatarUrl`
  - 必填：否
  - 类型：string | null
  - 默认：null
  - 约束：长度 ≤ 2048
  - 说明：头像 URL（前端可上传后填入 URL）。
  - 来源：`server/src/routes/profileRoutes.ts`
- `displayName`
  - 必填：否
  - 类型：string | null
  - 默认：null（前端回退到 `username`）
  - 约束：长度 ≤ 80
  - 说明：展示名称。
  - 来源：`server/src/routes/profileRoutes.ts`
- `email`
  - 必填：否
  - 类型：string | null
  - 默认：null
  - 约束：合法邮箱格式，长度 ≤ 200
  - 说明：绑定邮箱。
  - 来源：`server/src/routes/profileRoutes.ts`
- `roleTitle`
  - 必填：否
  - 类型：string | null
  - 默认：null（前端回退到 `Admin/Author`）
  - 约束：长度 ≤ 120
  - 说明：角色/职位展示字段。
  - 来源：`server/src/routes/profileRoutes.ts`
- `emojiStatus`
  - 必填：否
  - 类型：string | null
  - 默认：null（前端默认值：目标表情）
  - 约束：长度 ≤ 16
  - 说明：心情/状态 Emoji。
  - 来源：`server/src/routes/profileRoutes.ts`
- `bio`
  - 必填：否
  - 类型：string | null
  - 默认：null
  - 约束：长度 ≤ 500
  - 说明：个人简介。
  - 来源：`server/src/routes/profileRoutes.ts`

### 1.2 AI 配置（用于摘要/编辑器）

该配置存放在 `preferences.aiConfig`，可被 AI 代理与模型列表接口复用。

- `preferences.aiConfig.vendorId`
  - 必填：否
  - 类型：string | null
  - 默认：null（会从 `baseUrl` 推断）
  - 说明：厂商标识。支持：`qwen` / `doubao` / `deepseek` / `minimax` / `gemini` / `glm`
  - 来源：`server/src/services/AuthorProfileService.ts`
- `preferences.aiConfig.apiKey`
  - 必填：否（使用 AI 功能时需提供）
  - 类型：string | null
  - 默认：null
  - 说明：模型 API Key。
  - 来源：`server/src/services/AuthorProfileService.ts`
- `preferences.aiConfig.baseUrl`
  - 必填：否
  - 类型：string | null
  - 默认：按厂商给出默认值（见下）
  - 说明：模型服务 Base URL。
  - 来源：`server/src/services/AuthorProfileService.ts`
- `preferences.aiConfig.model`
  - 必填：否（执行生成时需要）
  - 类型：string | null
  - 默认：null
  - 说明：模型名称。
  - 来源：`server/src/services/AuthorProfileService.ts`

厂商默认 Base URL：

- `qwen`: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `doubao`: `https://ark.cn-beijing.volces.com/api/v3`
- `deepseek`: `https://api.deepseek.com`
- `minimax`: `https://api.minimax.chat/v1`
- `gemini`: `https://generativelanguage.googleapis.com/v1beta`
- `glm`: `https://open.bigmodel.cn/api/paas/v4`

---

## 2. APP 系统配置（前台 + 后台）

系统配置存放在数据库 `SystemConfig`，后端默认值在 `DEFAULT_SYSTEM_CONFIG`。  
更新后会同步到前台 `frontend/src/site.config.ts`。

### 2.1 后台配置（`admin.*`）

- `admin.adminEmail`
  - 必填：是
  - 类型：string
  - 默认：`root@dracula.io`
  - 说明：后台通知邮箱。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.systemId`
  - 必填：是
  - 类型：string
  - 默认：`MT-CORE-X1`
  - 说明：后台系统标识（显示/区分环境）。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.siteName`
  - 必填：是
  - 类型：string
  - 默认：`MultiTerm 多人博客系统`
  - 说明：后台 UI 标题。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.siteDescription`
  - 必填：是
  - 类型：string
  - 默认：`一款专为极客设计的终端审美多人博客管理平台...`
  - 说明：后台描述文案。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.maintenanceMode`
  - 必填：是
  - 类型：boolean
  - 默认：`false`
  - 说明：维护模式开关。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.dashboardRefreshRate`
  - 必填：是
  - 类型：number（毫秒）
  - 默认：`5000`
  - 说明：控制台数据刷新频率。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.showQuickDraft`
  - 必填：是
  - 类型：boolean
  - 默认：`true`
  - 说明：仪表盘快捷草稿模块。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.enableAiAssistant`
  - 必填：是
  - 类型：boolean
  - 默认：`true`
  - 说明：作者端 AI 辅助功能开关。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.autoSaveInterval`
  - 必填：是
  - 类型：number（秒）
  - 默认：`30`
  - 说明：编辑器自动保存间隔。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.allowAuthorCustomCategories`
  - 必填：是
  - 类型：boolean
  - 默认：`true`
  - 说明：作者是否可自定义分类。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.statsApiEndpoint`
  - 必填：是
  - 类型：string
  - 默认：`/api/v1/metrics`
  - 说明：统计 API 入口，支持 `{{resource}}` 占位符。
  - 来源：`admin/services/analyticsService.ts`
- `admin.statsTool`
  - 必填：是
  - 类型：`INTERNAL | GA4 | UMAMI`
  - 默认：`INTERNAL`
  - 说明：统计工具类型。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.allowRegistration`
  - 必填：是
  - 类型：boolean
  - 默认：`true`
  - 说明：是否允许开放注册。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.defaultUserRole`
  - 必填：是
  - 类型：`admin | author`
  - 默认：`author`
  - 说明：注册用户默认角色。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.recycleBinRetentionDays`
  - 必填：是
  - 类型：number（天）
  - 默认：`30`
  - 说明：回收站保留天数。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.activeEffectMode`
  - 必填：是
  - 类型：`SNOW_FALL | MATRIX_RAIN | NEON_AMBIENT | TERMINAL_GRID | HEART_PARTICLES | SCAN_LINES`
  - 默认：`SNOW_FALL`
  - 说明：后台特效模式。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.font.face`
  - 必填：是
  - 类型：string
  - 默认：`ComicShannsMono Nerd Font, Symbols Nerd Font, FangSong`
  - 说明：后台全局字体族。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `admin.font.weight`
  - 必填：是
  - 类型：string
  - 默认：`normal`
  - 说明：字体粗细（如 `normal/400/600`）。
  - 来源：`server/src/interfaces/SystemConfig.ts`

### 2.2 前台配置（`frontend.*`）

- `frontend.site`
  - 必填：是
  - 类型：string（URL）
  - 默认：`https://blog.karenepitaya.xyz`
  - 说明：前台站点根地址（用于 `astro.config`）。
  - 来源：`frontend/src/site.config.ts`
- `frontend.title`
  - 必填：是
  - 类型：string
  - 默认：`Karene's Blog`
  - 说明：前台站点标题。
  - 来源：`frontend/src/site.config.ts`
- `frontend.description`
  - 必填：是
  - 类型：string
  - 默认：`A multi-author blog powered by our server public API`
  - 说明：SEO 描述文案。
  - 来源：`frontend/src/site.config.ts`
- `frontend.author`
  - 必填：是
  - 类型：string
  - 默认：`Karene Pitayas`
  - 说明：作者署名。
  - 来源：`frontend/src/site.config.ts`
- `frontend.tags`
  - 必填：是
  - 类型：string[]
  - 默认：`['Astro', 'MultiTerm', 'Blog', 'karenepitaya']`
  - 说明：站点标签集合。
  - 来源：`frontend/src/site.config.ts`
- `frontend.faviconUrl`
  - ????
  - ???string???/URL?
  - ???`/favicon.svg`
  - ????? favicon ????????? URL?
  - ???`frontend/src/site.config.ts`

- `frontend.socialCardAvatarImage`
  - 必填：是
  - 类型：string（路径）
  - 默认：`./src/content/avatar.jpg`
  - 说明：社交卡默认头像路径。
  - 来源：`frontend/src/site.config.ts`
- `frontend.font`
  - 必填：是
  - 类型：string
  - 默认：`JetBrains Mono Variable`
  - 说明：前台全站字体。
  - 来源：`frontend/src/site.config.ts`
- `frontend.pageSize`
  - 必填：是
  - 类型：number
  - 默认：`6`
  - 说明：前台分页条数。
  - 来源：`frontend/src/site.config.ts`
- `frontend.trailingSlashes`
  - 必填：是
  - 类型：boolean
  - 默认：`false`
  - 说明：URL 是否强制尾斜杠。
  - 来源：`frontend/src/site.config.ts`
- `frontend.navLinks[]`
  - 必填：是
  - 类型：Array<{ name: string; url: string; external?: boolean }>
  - 默认：见 `site.config.ts`
  - 说明：前台导航菜单。
  - 来源：`frontend/src/site.config.ts`
- `frontend.socialLinks`
  - 必填：否
  - 类型：对象（github/twitter/mastodon/bluesky/linkedin/email）
  - 默认：空或示例值
  - 说明：社交链接入口。
  - 来源：`frontend/src/site.config.ts`
- `frontend.themes`
  - 必填：是
  - 类型：见下
  - 说明：主题系统配置。
  - 来源：`frontend/src/site.config.ts`
- `frontend.giscus`
  - 必填：否
  - 类型：{ repo, repoId, category, categoryId, reactionsEnabled }
  - 默认：`undefined`
  - 说明：Giscus 评论配置。
  - 来源：`frontend/src/site.config.ts`
- `frontend.characters`
  - 必填：是
  - 类型：Record<string, string>
  - 默认：`{ owl, unicorn, duck }`
  - 说明：角色资源路径，用于前台互动组件。
  - 来源：`frontend/src/site.config.ts`

### 2.3 主题配置（`frontend.themes`）

- `frontend.themes.mode`
  - 必填：是
  - 类型：`single | select | light-dark-auto`
  - 默认：`select`
  - 说明：主题切换模式。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `frontend.themes.default`
  - 必填：是
  - 类型：string
  - 默认：`catppuccin-mocha`
  - 说明：默认主题 ID。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `frontend.themes.include`
  - 必填：是
  - 类型：string[]
  - 默认：大量主题列表（见 `DEFAULT_SYSTEM_CONFIG`）
  - 说明：可选主题清单。
  - 来源：`server/src/config/defaultSystemConfig.ts`
- `frontend.themes.overrides`
  - 必填：否
  - 类型：Record<string, Record<string, string>>
  - 默认：`undefined`
  - 说明：主题颜色覆盖（JSON）。
  - 来源：`server/src/interfaces/SystemConfig.ts`

### 2.4 Object Storage (`oss.*`)

- `oss.enabled`
  - Required: yes
  - Type: boolean
  - Default: `false`
  - Description: enable object storage for uploads
  - Source: `server/src/interfaces/SystemConfig.ts`
- `oss.provider`
  - Required: yes
  - Type: `oss | minio`
  - Default: `oss`
  - Description: storage provider
  - Source: `server/src/interfaces/SystemConfig.ts`
- `oss.endpoint`
  - Required: no
  - Type: string
  - Default: empty
  - Description: storage endpoint
  - Source: `server/src/interfaces/SystemConfig.ts`
- `oss.bucket`
  - Required: no
  - Type: string
  - Default: empty
  - Description: bucket name
  - Source: `server/src/interfaces/SystemConfig.ts`
- `oss.accessKey`
  - Required: no
  - Type: string
  - Default: empty
  - Description: access key ID
  - Source: `server/src/interfaces/SystemConfig.ts`
- `oss.secretKey`
  - Required: no
  - Type: string
  - Default: empty
  - Description: access key secret
  - Source: `server/src/interfaces/SystemConfig.ts`
- `oss.region`
  - Required: no
  - Type: string
  - Default: empty
  - Description: region (OSS)
  - Source: `server/src/interfaces/SystemConfig.ts`
- `oss.customDomain`
  - Required: no
  - Type: string
  - Default: empty
  - Description: custom public domain
  - Source: `server/src/interfaces/SystemConfig.ts`
- `oss.uploadPath`
  - Required: no
  - Type: string
  - Default: empty
  - Description: upload path prefix
  - Source: `server/src/interfaces/SystemConfig.ts`

---

## 3. 基础设施配置

### 3.1 数据库配置（MongoDB）

- `MONGO_USERNAME`
  - 必填：是
  - 类型：string
  - 说明：数据库用户名。
  - 来源：`server/src/config/env.ts`
- `MONGO_PASSWORD`
  - 必填：是
  - 类型：string
  - 说明：数据库密码。
  - 来源：`server/src/config/env.ts`
- `MONGO_HOST`
  - 必填：是
  - 类型：string
  - 说明：数据库主机地址。
  - 来源：`server/src/config/env.ts`
- `MONGO_PORT`
  - 必填：是
  - 类型：number/string
  - 说明：数据库端口。
  - 来源：`server/src/config/env.ts`
- `MONGO_DBNAME`
  - 必填：是
  - 类型：string
  - 说明：数据库名称。
  - 来源：`server/src/config/env.ts`
- `MONGO_URI`
  - 必填：否（仅脚本支持）
  - 类型：string
  - 说明：脚本可直接使用的完整连接串。
  - 来源：`server/src/scripts/scriptEnv.ts`

### 3.2 服务端运行与上传

- `PORT`
  - 必填：否
  - 类型：number
  - 默认：`3000`
  - 说明：服务端监听端口。
  - 来源：`server/src/config/env.ts`
- `UPLOAD_DIR`
  - 必填：否
  - 类型：string
  - 默认：`uploads`
  - 说明：本地上传目录，同时作为静态资源路由前缀。
  - 来源：`server/src/app.ts`, `server/src/services/UploadService.ts`
- `UPLOAD_MAX_BYTES`
  - 必填：否
  - 类型：number
  - 默认：`5242880`（5MB）
  - 说明：单文件上传大小限制。
  - 来源：`server/src/services/UploadService.ts`, `server/src/routes/uploadRoutes.ts`
- `PUBLIC_BASE_URL`
  - 必填：否
  - 类型：string（URL）
  - 默认：空（使用相对路径）
  - 说明：用于拼接上传资源的公开访问前缀。
  - 来源：`server/src/services/UploadService.ts`

### 3.3 前台内容同步（可选）

用于把后端已发布文章导出到前台 `content` 目录。

- `FRONTEND_CONTENT_SYNC`
  - 必填：否
  - 类型：boolean
  - 默认：`false`
  - 说明：是否启用内容同步。
  - 来源：`server/src/services/FrontendContentSyncService.ts`
- `FRONTEND_CONTENT_OUT_DIR`
  - 必填：否
  - 类型：string（路径）
  - 默认：`frontend/src/content/posts/_generated`
  - 说明：导出目录，可填相对路径或绝对路径。
  - 来源：`server/src/services/FrontendContentSyncService.ts`
- `FRONTEND_SITE_CONFIG_PATH`
  - 必填：否
  - 类型：string（路径）
  - 默认：`frontend/src/site.config.ts`
  - 说明：系统配置同步到前台的目标文件。
  - 来源：`server/src/services/FrontendSiteConfigSyncService.ts`

### 3.4 第三方统计/分析

统计能力由系统配置提供（见 2.1），此处作为基础设施归类说明。

- `admin.statsTool`
  - 必填：是
  - 类型：`INTERNAL | GA4 | UMAMI`
  - 说明：统计工具类型（由前端决定展示/请求方式）。
  - 来源：`admin/services/analyticsService.ts`
- `admin.statsApiEndpoint`
  - 必填：是
  - 类型：string
  - 说明：统计接口，可使用 `{{resource}}` 模板变量。
  - 来源：`admin/services/analyticsService.ts`

### 3.5 对象存储（编辑器内配置）

此配置存在于编辑器全局配置 `GlobalConfig.oss`，目前为前端直传方案。

- `oss.enabled`
  - 必填：否
  - 类型：boolean
  - 默认：`false`
  - 说明：是否启用对象存储上传。
  - 来源：`admin/components/Editor/types.ts`
- `oss.provider`
  - 必填：是（enabled 时）
  - 类型：`minio | oss`
  - 默认：`oss` 或 `minio`（由预设决定）
  - 说明：存储提供商。
  - 来源：`admin/components/Editor/types.ts`
- `oss.endpoint`
  - 必填：是（enabled 时）
  - 类型：string
  - 说明：服务端点。
  - 来源：`admin/components/Editor/types.ts`
- `oss.bucket`
  - 必填：是（enabled 时）
  - 类型：string
  - 说明：Bucket 名称。
  - 来源：`admin/components/Editor/types.ts`
- `oss.accessKey`
  - 必填：是（enabled 时）
  - 类型：string
  - 说明：访问密钥。
  - 来源：`admin/components/Editor/types.ts`
- `oss.secretKey`
  - 必填：是（enabled 时）
  - 类型：string
  - 说明：密钥密文。
  - 来源：`admin/components/Editor/types.ts`
- `oss.region`
  - 必填：否
  - 类型：string
  - 说明：区域（阿里云 OSS 常用）。
  - 来源：`admin/components/Editor/types.ts`
- `oss.uploadPath`
  - 必填：否
  - 类型：string
  - 说明：上传路径前缀（如 `blog-images/`）。
  - 来源：`admin/components/Editor/types.ts`
- `oss.imageCompressionQuality`
  - 必填：否
  - 类型：number（0.1 ~ 1.0）
  - 默认：`0.8`
  - 说明：前端编辑器图片压缩质量（数值越高越清晰）。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `oss.customDomain`
  - 必填：否
  - 类型：string
  - 说明：自定义 CDN 域名。
  - 来源：`admin/components/Editor/types.ts`

### 3.6 图片处理（编辑器内配置）

- `image.enabled`
  - 必填：否
  - 类型：boolean
  - 默认：`false`
  - 说明：是否启用图片压缩/转换。
  - 来源：`admin/components/Editor/types.ts`
- `image.compressQuality`
  - 必填：否
  - 类型：number（0.1 ~ 1.0）
  - 默认：由系统配置 `oss.imageCompressionQuality` 控制
  - 说明：已迁移到 SystemConfig.oss.imageCompressionQuality。
  - 来源：`server/src/interfaces/SystemConfig.ts`
- `image.maxWidth`
  - 必填：否
  - 类型：number
  - 默认：由 UI 设定
  - 说明：图片最大宽度（超过则缩放）。
  - 来源：`admin/components/Editor/types.ts`
- `image.convertToWebP`
  - 必填：否
  - 类型：boolean
  - 默认：`false`
  - 说明：是否转换为 WebP。
  - 来源：`admin/components/Editor/types.ts`

### 3.7 前端/后台 API 入口配置

- `VITE_API_BASE_URL`
  - 必填：否
  - 类型：string（URL）
  - 默认：`http://localhost:3000/api`
  - 说明：后台管理端 API 基址。
  - 来源：`admin/services/http.ts`, `admin/README.md`
- `VITE_SERVER_API_BASE_URL`
  - 必填：否
  - 类型：string（URL）
  - 默认：空（回退到 `VITE_API_BASE_URL`）
  - 说明：后台管理端 API 备选基址。
  - 来源：`admin/services/http.ts`
- `PUBLIC_API_BASE_URL`
  - 必填：否
  - 类型：string（URL）
  - 默认：`http://localhost:3000/api`
  - 说明：前台（Astro）调用公开 API 的基址。
  - 来源：`frontend/src/lib/publicApi.ts`

### 3.8 AI 服务密钥（前端演示/编辑器）

- `VITE_GEMINI_API_KEY`
  - 必填：否（使用管理端 AI 摘要时）
  - 类型：string
  - 说明：管理后台 Gemini Key。
  - 来源：`admin/services/geminiService.ts`, `admin/README.md`
- `GEMINI_API_KEY`
  - 必填：否（使用独立 Editor/AuthorConfig 时）
  - 类型：string
  - 说明：在 `admin/components/Editor` 与 `AuthorConfig` 的 Vite 配置中被映射为 `process.env.API_KEY`。
  - 来源：`admin/components/Editor/vite.config.ts`, `admin/components/AuthorConfig/vite.config.ts`

---

## 4. 安全配置

### 4.1 JWT 与运行环境

- `JWT_SECRET`
  - 必填：是
  - 类型：string
  - 说明：JWT 签名密钥。
  - 来源：`server/src/config/env.ts`
- `NODE_ENV`
  - 必填：否
  - 类型：string（`production` / `development`）
  - 说明：`production` 会禁用调试账号接口。
  - 来源：`server/src/routes/adminAuthRoutes.ts`

### 4.2 调试账号（仅开发）

仅在 `NODE_ENV !== 'production'` 时有效：

- `ADMIN_USERNAME`
  - 必填：否
  - 类型：string
  - 说明：调试管理员账号。
  - 来源：`server/src/routes/adminAuthRoutes.ts`
- `ADMIN_PASSWORD`
  - 必填：否
  - 类型：string
  - 说明：调试管理员密码。
  - 来源：`server/src/routes/adminAuthRoutes.ts`
- `USER_USERNAME`
  - 必填：否
  - 类型：string
  - 说明：调试作者账号。
  - 来源：`server/src/routes/adminAuthRoutes.ts`
- `USER_PASSWORD`
  - 必填：否
  - 类型：string
  - 说明：调试作者密码。
  - 来源：`server/src/routes/adminAuthRoutes.ts`

### 4.3 固定安全规则（需改代码）

以下规则为硬编码，非可配置项，若需调整需改代码：

- 登录密码长度：6~100  
  来源：`server/src/routes/profileRoutes.ts`, `server/src/routes/adminAuthRoutes.ts`
- JWT 过期时间：作者 7d、管理员 2h  
  来源：`server/src/services/AuthService.ts`
