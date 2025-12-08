<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <el-aside class="sidebar" :width="isCollapse ? '64px' : '240px'">
      <div class="logo">
        <h3 v-show="!isCollapse">管理后台</h3>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        
        <el-menu-item index="/articles">
          <el-icon><Document /></el-icon>
          <template #title>文章管理</template>
        </el-menu-item>
        
        <el-sub-menu index="content">
          <template #title>
            <el-icon><Reading /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/categories">分类管理</el-menu-item>
          <el-menu-item index="/comments">评论管理</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主要内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            type="text"
            @click="toggleSidebar"
          >
            <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </el-button>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ authStore.user?.username || '用户' }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 内容区域 -->
      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox, ElMessage } from 'element-plus'
import { 
  HomeFilled, 
  Document, 
  Reading, 
  Setting, 
  User,
  Fold,
  Expand,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活菜单
const activeMenu = computed(() => {
  return route.path
})

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 处理用户下拉菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      router.push('/profile')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '确认退出',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        authStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
        // 用户取消退出
      }
      break
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
}

.sidebar {
  background: #304156;
  transition: width 0.3s;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
}

.logo h3 {
  color: white;
  margin: 0;
  font-size: 16px;
  white-space: nowrap;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.content {
  background: #f0f2f5;
  padding: 20px;
}
</style>