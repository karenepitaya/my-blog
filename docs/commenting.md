# 注释规范（严格版）

目标：注释短小精悍、高信号、可搜索、可自动检查。源码只保留必要注释，长说明统一迁移到 `docs/`。

## 允许的注释类型（仅 4 类）
- `// WHY: ...` 说明“为什么这么做”（动机/设计原因）
- `// CONTRACT: ...` 对外契约（对调用方稳定、不可随意改）
- `// PITFALL: ...` 坑/安全风险/易错点
- `// TODO(#123): ...` 明确待办（必须可追踪）

> 任何其他注释一律删除。

## 长说明迁移规则
- 需要解释超过 2 行的内容：不得放源码。
- 迁移到 `docs/` 后，源码只保留指针：`// DOC: docs/xxx.md#section`。

## 硬限制（强制）
- 单行注释建议 ≤ 80 字符；超过拆分或迁移到 `docs/`。
- 多行注释最多 2 行（严格版）；超过必须迁移到 `docs/`。
- 禁止 `/* ... */` 块注释（唯一例外：版权/License 头）。
- 注释必须紧贴描述对象上方；同一处最多 1 条注释。

## 好/坏示例

### ? 好
```ts
// WHY: Keep slug stable after first publish to avoid broken URLs.
if (wasPublished) return existingSlug

// CONTRACT: CORS allows admin/front dev origins in local setup.
app.use(cors({ origin: allowedOrigins }))

// PITFALL: Do not change prefix to AD/ADM; adblockers will strip the content.
const CHARACTER_DIALOGUE_PREFIX = 'CHAR'

// TODO(#2031): Replace placeholder diagnostics with real checks.
```

### ? 坏
```ts
// 获取用户列表
// TODO: 优化
/* 这里是很长的说明…… */
```

### ? 迁移到 docs
```ts
// DOC: docs/feature-x.md#design-notes
```
