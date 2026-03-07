import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

/**
 * Article Event 模型
 * 使用 Capped Collection 限制内存和磁盘占用（2核2G环境）
 * 
 * 存储：浏览(view)、阅读(read)、点赞(like) 事件
 * 上限：100MB 或 100万条记录（先到为准）
 * 特性：自动淘汰旧数据，固定集合大小
 */

const ArticleEventSchema = new Schema(
  {
    // 文章和作者关联
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: [true, 'articleId is required'],
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'authorId is required'],
      index: true,
    },

    // 事件类型
    type: {
      type: String,
      enum: ['view', 'read', 'like'],
      required: [true, 'event type is required'],
      index: true,
    },

    // 时间戳（使用单独字段而不是依赖 _id，便于范围查询）
    ts: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // 访客信息（脱敏存储）
    ip: {
      type: String,
      default: null,
      // 存储前 3 段，如 "192.168.1.x"，保护隐私
    },
    
    // User-Agent 摘要（可选）
    ua: {
      type: String,
      maxlength: [100, 'ua too long'],
      default: null,
    },

    // 扩展字段（JSON，用于未来扩展）
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    // Capped Collection 配置
    capped: {
      size: 100 * 1024 * 1024,  // 100MB
      max: 1000000,              // 最多 100万条（可选，size 优先）
    },
    timestamps: false,  // 禁用默认 timestamps，使用自定义 ts
    versionKey: false,
  }
);

// 复合索引：作者 + 时间 + 类型（用于 Author Insights 查询）
ArticleEventSchema.index({ authorId: 1, ts: -1, type: 1 });

// 复合索引：文章 + 时间 + 类型（用于 Top Articles 查询）
ArticleEventSchema.index({ articleId: 1, ts: -1, type: 1 });

// 单字段索引：时间（用于范围清理，虽然 capped 会自动处理）
ArticleEventSchema.index({ ts: -1 });

export type ArticleEventDocument = HydratedDocument<InferSchemaType<typeof ArticleEventSchema>>;
export const ArticleEventModel = model<InferSchemaType<typeof ArticleEventSchema>>('ArticleEvent', ArticleEventSchema);

/**
 * 初始化 Capped Collection
 * Mongoose 会在第一次写入时自动按 Schema 配置创建
 * 此函数仅用于日志输出和状态检查
 */
export async function initArticleEventCollection(): Promise<void> {
  const collectionName = ArticleEventModel.collection.collectionName;
  console.log(`[Analytics] Capped collection '${collectionName}' configured (100MB max).`);
  console.log('[Analytics] Collection will be created automatically on first write.');
}
