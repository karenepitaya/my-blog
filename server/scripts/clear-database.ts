import mongoose from "mongoose";
import User from "../src/models/User";
import Article from "../src/models/Article";
import Category from "../src/models/Category";
import Comment from "../src/models/Comment";

// 加载环境变量
require('dotenv').config();

async function clearDatabase() {
  try {
    console.log("🗑️ 开始清除数据库内容...");
    
    // 连接到数据库
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/my-blog";
    await mongoose.connect(mongoUri);
    console.log("✅ 数据库连接成功");

    // 获取所有集合名称
    const collections = mongoose.connection.db.collections();
    
    console.log(`📋 找到 ${collections.length} 个数据集合`);
    
    // 清除所有数据
    let totalDeleted = 0;
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      const result = await collection.deleteMany({});
      console.log(`🗑️ 已清除 ${collectionName} 集合中的 ${result.deletedCount} 条记录`);
      totalDeleted += result.deletedCount;
    }
    
    console.log(`\n✅ 数据库清理完成！总共删除了 ${totalDeleted} 条记录`);
    
    // 显示集合统计
    console.log("\n📊 数据库统计:");
    for (const collection of collections) {
      const count = await collection.countDocuments();
      console.log(`  - ${collection.collectionName}: ${count} 条记录`);
    }
    
  } catch (error) {
    console.error("❌ 数据库清理失败:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 数据库连接已断开");
  }
}

// 运行清理函数
clearDatabase();