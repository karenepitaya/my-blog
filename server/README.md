# 博客后端项目技术文档

## 1. 项目概述

这是一个基于 Node.js + Express + MongoDB 构建的博客后端服务，提供文章管理、用户认证、分类管理和评论系统等功能。该项目采用 TypeScript 开发，支持 Markdown 内容编辑和展示，具备完善的权限控制机制。

## 2. 技术栈

| 类别 | 技术/框架 | 版本 | 用途 |
|------|----------|------|------|
| 语言 | TypeScript | ^5.9.3 | 开发语言 |
| 框架 | Express | ^5.1.0 | Web 服务器框架 |
| 数据库 | MongoDB | 通过 Mongoose 连接 | 数据存储 |
| ORM | Mongoose | ^8.20.0 | MongoDB 对象建模 |
| 认证 | JSON Web Token | ^9.0.2 | 用户认证和授权 |
| 安全 | bcryptjs | ^3.0.3 | 密码加密 |
| 安全 | dompurify | ^3.3.0 | HTML 净化（防 XSS） |
| 内容处理 | marked | ^17.0.0 | Markdown 解析 |
| 开发工具 | ts-node-dev | ^2.0.0 | 开发环境热重载 |
| 配置管理 | dotenv | ^17.2.3 | 环境变量管理 |
| 跨域 | cors | ^2.8.5 | 跨域资源共享 |

## 3. 项目结构

```
/var/www/my-blog/server/
├── src/
│   ├── app.ts                 # Express 应用主配置
│   ├── server.ts              # 服务器入口文件
│   ├── config/
│   │   └── database.ts        # 数据库连接配置
│   ├── controllers/           # 控制器
│   │   ├── articleController.ts
│   │   ├── categoryController.ts
│   │   ├── commentController.ts
│   │   └── userController.ts
│   ├── middleware/
│   │   └── auth.ts            # 认证中间件
│   ├── models/                # 数据模型
│   │   ├── Article.ts
│   │   ├── Category.ts
│   │   ├── Comment.ts
│   │   └── User.ts
│   ├── routes/                # 路由配置
│   │   ├── articleRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   ├── commentRoutes.ts
│   │   └── userRoutes.ts
│   └── utils/                 # 工具函数
│       ├── markdown.ts        # Markdown 转换
│       ├── slug.ts            # Slug 生成
│       └── toc.ts             # 目录提取
├── package.json
├── tsconfig.json
└── package-lock.json
```

## 4. 数据库设计

### 4.1 数据库连接配置

使用 Mongoose 连接 MongoDB，配置从环境变量读取：

```typescript
const mongoUri = `mongodb://${username}:${password}@${host}:${port}/${dbName}?authSource=${dbName}`;
```

### 4.2 数据模型

#### User 模型

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名，唯一 |
| email | String | 是 | 邮箱，唯一，小写 |
| passwordHash | String | 是 | 密码哈希值 |
| role | String | 是 | 用户角色，默认 "admin" |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |

#### Article 模型

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 文章标题 |
| content | String | 是 | Markdown 内容 |
| summary | String | 否 | 文章摘要 |
| coverUrl | String | 否 | 封面图片 URL |
| tags | [String] | 否 | 标签数组 |
| author | ObjectId | 是 | 作者 ID，关联 User |
| category | ObjectId | 否 | 分类 ID，关联 Category |
| status | String | 是 | 状态：draft/published |
| slug | String | 是 | SEO 友好的 URL 标识 |
| views | Number | 否 | 浏览量，默认 0 |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |

#### Category 模型

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 分类名称，唯一 |
| slug | String | 是 | SEO 友好的 URL 标识，唯一 |
| createdAt | Date | 是 | 创建时间 |

#### Comment 模型

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| articleId | ObjectId | 是 | 文章 ID，关联 Article |
| userId | ObjectId | 是 | 用户 ID，关联 User |
| content | String | 是 | 评论内容 |
| replyTo | ObjectId | 否 | 回复的评论 ID，关联 Comment |
| createdAt | Date | 是 | 创建时间 |

## 5. API 接口说明

### 5.1 用户相关接口

| 路径 | 方法 | 权限 | 功能描述 |
|------|------|------|----------|
| /api/users/register | POST | 无 | 创建管理员账号（仅首次可用） |
| /api/users/login | POST | 无 | 用户登录，返回 JWT |
| /api/users/me | GET | 需要 JWT | 获取当前用户信息 |

### 5.2 文章相关接口

| 路径 | 方法 | 权限 | 功能描述 |
|------|------|------|----------|
| /api/articles/create | POST | admin | 创建文章 |
| /api/articles/list | GET | 无 | 获取文章列表（支持分页和筛选） |
| /api/articles/search | GET | 无 | 搜索文章（支持关键词、分类等） |
| /api/articles/:id | GET | 无 | 根据 ID 获取文章详情 |
| /api/articles/slug/:slug | GET | 无 | 根据 slug 获取文章详情 |
| /api/articles/:id | PUT | admin | 更新文章 |
| /api/articles/:id | DELETE | admin | 删除文章 |
| /api/articles/:id/publish | POST | admin | 发布文章 |
| /api/articles/:id/unpublish | POST | admin | 撤销发布（设为草稿） |

### 5.3 分类相关接口

| 路径 | 方法 | 权限 | 功能描述 |
|------|------|------|----------|
| /api/categories/create | POST | admin | 创建分类 |
| /api/categories/list | GET | 无 | 获取分类列表 |
| /api/categories/:id | DELETE | admin | 删除分类 |

### 5.4 评论相关接口

| 路径 | 方法 | 权限 | 功能描述 |
|------|------|------|----------|
| /api/comments/create | POST | 需要 JWT | 创建评论 |
| /api/comments/article/:articleId | GET | 无 | 获取指定文章的所有评论 |
| /api/comments/:id | DELETE | admin | 删除评论 |

## 6. 认证与授权机制

### 6.1 JWT 认证流程

1. 用户登录后获取 JWT Token
2. 访问需要认证的接口时，在请求头中添加：`Authorization: Bearer <token>`
3. 服务器通过 `authMiddleware` 中间件验证 Token 有效性
4. Token 验证成功后，用户信息会被附加到请求对象上

### 6.2 权限控制

- `authMiddleware`：验证用户是否已登录
- `adminOnly`：验证用户是否为管理员角色

## 7. 核心功能模块

### 7.1 Markdown 处理

- 使用 `marked` 库将 Markdown 转换为 HTML
- 使用 `dompurify` 净化 HTML，防止 XSS 攻击
- 支持从 Markdown 中提取目录（TOC）

### 7.2 文章浏览量统计

- 实现了简单的防刷机制（基于 IP + 文章 ID 的缓存）
- 10 秒内同一 IP 访问同一文章不计入浏览量

### 7.3 SEO 友好的 URL

- 自动为文章和分类生成 SEO 友好的 slug
- 支持中文、英文、数字的转换
- 处理重复 slug 的冲突

## 8. 部署与运行

### 8.1 环境变量

需要配置以下环境变量：
- `PORT`：服务器端口，默认 3001
- `JWT_SECRET`：JWT 签名密钥
- `JWT_EXPIRES`：JWT 过期时间，默认 7d
- `MONGO_USERNAME`：MongoDB 用户名
- `MONGO_PASSWORD`：MongoDB 密码
- `MONGO_DBNAME`：MongoDB 数据库名
- `MONGO_HOST`：MongoDB 主机地址，默认 127.0.0.1
- `MONGO_PORT`：MongoDB 端口，默认 27017

### 8.2 运行命令

- 开发模式：`npm run dev`
- 构建项目：`npm run build`
- 生产运行：`npm start`

## 9. 安全措施

1. 密码使用 bcrypt 加密存储
2. JWT Token 认证机制
3. HTML 内容净化（防 XSS）
4. 基于角色的访问控制
5. 单用户博客限制（仅允许一个管理员账号）

## 10. 扩展建议

1. 引入 Redis 缓存热门文章和分类
2. 实现文章定时发布功能
3. 添加文章点赞功能
4. 实现标签管理系统
5. 添加更多的统计分析功能