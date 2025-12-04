// 更新现有文章的slug为拼音格式
const mongoose = require('mongoose');

// 数据库配置
const username = 'bloguser';
const password = 'A831913ieqoqe.';
const dbName = 'myblog';
const host = '127.0.0.1';
const port = '27017';

const mongoUri = `mongodb://${username}:${password}@${host}:${port}/${dbName}?authSource=${dbName}`;

// 简单的中文转拼音函数（只处理常见情况）
function simpleChineseToPinyin(str) {
  const pinyinMap = {
    '测': 'ce',
    '试': 'shi',
    '文': 'wen',
    '章': 'zhang'
  };
  
  return str.split('').map(char => {
    return pinyinMap[char] || char;
  }).join('');
}

// 创建slug函数
function createSlug(title) {
  const pinyinTitle = simpleChineseToPinyin(title);
  
  return pinyinTitle
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-");
}

async function updateSlugs() {
  try {
    // 连接数据库
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected.');

    // 定义Article模型
    const ArticleSchema = new mongoose.Schema({
      title: String,
      slug: String
    });
    const Article = mongoose.model('Article', ArticleSchema);

    // 获取所有文章
    const articles = await Article.find({});
    console.log(`Found ${articles.length} articles.`);

    // 更新每个文章的slug
    for (const article of articles) {
      const oldSlug = article.slug;
      const newSlug = createSlug(article.title);
      
      if (oldSlug !== newSlug) {
        article.slug = newSlug;
        await article.save();
        console.log(`Updated article "${article.title}" slug: ${oldSlug} -> ${newSlug}`);
      }
    }

    console.log('All articles updated successfully!');
  } catch (error) {
    console.error('Error updating slugs:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

updateSlugs();