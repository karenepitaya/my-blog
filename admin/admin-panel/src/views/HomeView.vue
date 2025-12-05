<template>
  <div class="dashboard">
    <h1>欢迎使用博客管理后台</h1>
    
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.articles }}</div>
          <div class="stat-label">文章总数</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.published }}</div>
          <div class="stat-label">已发布</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.drafts }}</div>
          <div class="stat-label">草稿</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalViews }}</div>
          <div class="stat-label">总浏览量</div>
        </div>
      </el-card>
    </div>
    
    <div class="quick-actions">
      <el-card>
        <template #header>
          <span>快速操作</span>
        </template>
        
        <div class="actions">
          <el-button type="primary" @click="$router.push('/articles/create')">
            <el-icon><Plus /></el-icon>
            创建文章
          </el-button>
          <el-button @click="$router.push('/articles')">
            <el-icon><Document /></el-icon>
            管理文章
          </el-button>
          <el-button @click="$router.push('/categories')">
            <el-icon><FolderOpened /></el-icon>
            管理分类
          </el-button>
        </div>
      </el-card>
    </div>
    
    <div class="recent-articles">
      <el-card>
        <template #header>
          <span>最近文章</span>
        </template>
        
        <el-table :data="recentArticles" v-loading="loading">
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'success' : 'info'">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="views" label="浏览量" width="100" />
          <el-table-column prop="createdAt" label="创建时间" width="180" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="text" @click="$router.push(`/articles/${row._id}/edit`)">
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Document, FolderOpened } from '@element-plus/icons-vue'
import { getArticles } from '@/api/articles'
import type { Article } from '@/types'
import dayjs from 'dayjs'

// 统计数据
const stats = ref({
  articles: 0,
  published: 0,
  drafts: 0,
  totalViews: 0
})

// 最近文章
const recentArticles = ref<Article[]>([])

// 加载状态
const loading = ref(false)

// 加载统计数据和最近文章
const loadData = async () => {
  try {
    loading.value = true
    
    // 获取文章列表（用于统计数据）
    const response = await getArticles({ page: 1, limit: 100 })
    
    // API返回的数据结构包含articles字段
    const articles = response.articles
    stats.value.articles = response.count || articles.length
    stats.value.published = articles.filter((a: Article) => a.status === 'published').length
    stats.value.drafts = articles.filter((a: Article) => a.status === 'draft').length
    stats.value.totalViews = articles.reduce((sum: number, a: Article) => sum + a.views, 0)
    
    // 最近5篇文章
    recentArticles.value = articles
      .sort((a: Article, b: Article) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((article: Article) => ({
        ...article,
        createdAt: dayjs(article.createdAt).format('YYYY-MM-DD HH:mm')
      }))
      
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard h1 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 16px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.quick-actions {
  margin-bottom: 24px;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.recent-articles {
  margin-bottom: 24px;
}
</style>
