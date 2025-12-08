<template>
  <div class="article-edit-page">
    <div class="page-header">
      <el-button @click="$router.go(-1)">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>{{ isEdit ? '编辑文章' : '创建文章' }}</h1>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      class="article-form"
    >
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card>
            <template #header>
              <span>文章内容</span>
            </template>

            <el-form-item label="标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入文章标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="摘要" prop="excerpt">
              <el-input
                v-model="form.excerpt"
                type="textarea"
                :rows="3"
                placeholder="请输入文章摘要"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="内容" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="15"
                placeholder="请输入文章内容（支持Markdown格式）"
              />
            </el-form-item>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card>
            <template #header>
              <span>发布设置</span>
            </template>

            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
              </el-select>
            </el-form-item>

            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
                <el-option
                  v-for="cat in categories"
                  :key="cat._id"
                  :label="cat.name"
                  :value="cat._id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="标签">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                placeholder="选择或输入标签"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag._id"
                  :label="tag.name"
                  :value="tag.name"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="封面图">
              <el-input
                v-model="form.coverImage"
                placeholder="请输入图片URL"
              />
            </el-form-item>
          </el-card>

          <el-card style="margin-top: 16px">
            <template #header>
              <span>SEO设置</span>
            </template>

            <el-form-item label="SEO描述">
              <el-input
                v-model="form.seoDescription"
                type="textarea"
                :rows="2"
                placeholder="SEO描述，用于搜索引擎优化"
                maxlength="160"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="关键词">
              <el-input
                v-model="form.seoKeywords"
                placeholder="多个关键词用逗号分隔"
              />
            </el-form-item>
          </el-card>

          <el-card style="margin-top: 16px">
            <div class="form-actions">
              <el-button @click="$router.go(-1)">取消</el-button>
              <el-button @click="saveDraft" :loading="saving">保存草稿</el-button>
              <el-button type="primary" @click="saveArticle" :loading="saving">
                {{ form.status === 'published' ? '发布文章' : '保存文章' }}
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { createArticle, updateArticle, getArticle } from '@/api/articles'
import type { Article, ArticleFormData } from '@/types'

// 路由
const route = useRoute()
const router = useRouter()

// 是否编辑模式
const isEdit = computed(() => !!route.params.id)

// 表单引用
const formRef = ref()

// 保存状态
const saving = ref(false)

// 分类和标签数据（实际项目中应该从API获取）
const categories = ref([
  { _id: '1', name: '技术分享' },
  { _id: '2', name: '生活随笔' },
  { _id: '3', name: '学习笔记' }
])

const tags = ref([
  { _id: '1', name: 'JavaScript' },
  { _id: '2', name: 'Vue.js' },
  { _id: '3', name: 'TypeScript' },
  { _id: '4', name: 'Node.js' }
])

// 表单数据
const form = ref<Partial<ArticleFormData>>({
  title: '',
  excerpt: '',
  content: '',
  status: 'draft',
  category: '',
  tags: [],
  coverImage: '',
  seoDescription: '',
  seoKeywords: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  excerpt: [
    { required: true, message: '请输入文章摘要', trigger: 'blur' },
    { min: 1, max: 200, message: '摘要长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { min: 1, message: '请输入文章内容', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择文章分类', trigger: 'change' }
  ]
}

// 保存草稿
const saveDraft = async () => {
  form.value.status = 'draft'
  await saveArticle()
}

// 保存文章
const saveArticle = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 映射前端字段到server端字段
    const articleData = {
      title: form.value.title,
      content: form.value.content,
      summary: form.value.excerpt, // 前端excerpt -> server端summary
      coverUrl: form.value.coverImage, // 前端coverImage -> server端coverUrl
      tags: form.value.tags,
      status: form.value.status,
      categoryId: form.value.category, // 前端category -> server端categoryId
      authorId: '1', // 临时使用，实际应该从用户状态获取
    }
    
    if (isEdit.value) {
      await updateArticle(route.params.id as string, articleData)
      ElMessage.success('更新文章成功')
    } else {
      await createArticle(articleData)
      ElMessage.success('创建文章成功')
    }
    
    router.push('/articles')
    
  } catch (error) {
    console.error('保存文章失败:', error)
    ElMessage.error('保存文章失败')
  } finally {
    saving.value = false
  }
}

// 加载文章数据（编辑模式）
const loadArticle = async () => {
  if (!isEdit.value) return
  
  try {
    const article: Article = await getArticle(route.params.id as string)
    
    form.value = {
      title: article.title,
      excerpt: article.summary || '', // server端使用summary而不是excerpt
      content: article.content,
      status: article.status,
      category: typeof article.category === 'string' ? article.category : article.category?._id,
      tags: article.tags || [],
      coverImage: article.coverUrl || '', // server端使用coverUrl而不是coverImage
      seoDescription: (article as any).seoDescription || '',
      seoKeywords: (article as any).seoKeywords || ''
    }
    
  } catch (error) {
    console.error('加载文章失败:', error)
    ElMessage.error('加载文章失败')
    router.push('/articles')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadArticle()
})
</script>

<style scoped>
.article-edit-page {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.article-form {
  max-width: none;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>