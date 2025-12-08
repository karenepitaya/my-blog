<template>
  <div class="articles-page">
    <div class="page-header">
      <h1>文章管理</h1>
      <el-button type="primary" @click="$router.push('/articles/create')">
        <el-icon><Plus /></el-icon>
        创建文章
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索文章标题"
            clearable
            @keyup.enter="loadArticles"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadArticles">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文章列表 -->
    <el-card>
      <el-table
        :data="articles"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="excerpt" label="摘要" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ row.category?.name || '未分类' }}
          </template>
        </el-table-column>
        <el-table-column prop="views" label="浏览量" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="text" @click="viewArticle(row._id)">查看</el-button>
            <el-button type="text" @click="editArticle(row._id)">编辑</el-button>
            <el-button
              :type="row.status === 'published' ? 'warning' : 'success'"
              @click="togglePublish(row)"
            >
              {{ row.status === 'published' ? '取消发布' : '发布' }}
            </el-button>
            <el-button type="text" style="color: #f56c6c" @click="deleteArticle(row._id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadArticles"
          @current-change="loadArticles"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getArticles, updateArticle, deleteArticle as deleteArticleById } from '@/api/articles'
import type { Article } from '@/types'
import dayjs from 'dayjs'

// 响应式数据
const articles = ref<Article[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索表单
const searchForm = ref<{
  keyword: string
  status: 'draft' | 'published' | ''
}>({
  keyword: '',
  status: ''
})

// 加载文章列表
const loadArticles = async () => {
  try {
    loading.value = true
    const response = await getArticles({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchForm.value.keyword || undefined,
      status: searchForm.value.status || undefined
    })
    
    articles.value = response.data
    total.value = response.pagination.total
    
  } catch (error) {
    console.error('加载文章失败:', error)
    ElMessage.error('加载文章失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    keyword: '',
    status: ''
  } as {
    keyword: string
    status: 'draft' | 'published' | ''
  }
  currentPage.value = 1
  loadArticles()
}

// 查看文章
const viewArticle = (id: string) => {
  window.open(`/article/${id}`, '_blank')
}

// 编辑文章
const editArticle = (id: string) => {
  // router.push(`/articles/${id}/edit`)
  ElMessage.info('编辑功能开发中...')
}

// 切换发布状态
const togglePublish = async (article: Article) => {
  try {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    const action = newStatus === 'published' ? '发布' : '取消发布'
    
    await ElMessageBox.confirm(
      `确认要${action}文章"${article.title}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await updateArticle(article._id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadArticles()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新文章状态失败:', error)
      ElMessage.error('更新文章状态失败')
    }
  }
}

// 删除文章
const deleteArticle = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该文章，是否继续？',
      '警告',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteArticleById(id)
    ElMessage.success('删除成功')
    loadArticles()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
      ElMessage.error('删除文章失败')
    }
  }
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 组件挂载时加载数据
onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.articles-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.search-card {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>