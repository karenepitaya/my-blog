import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import ArticlesView from '../views/ArticlesView.vue'
import ArticleEditView from '../views/ArticleEditView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/articles',
      name: 'articles',
      component: ArticlesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/articles/create',
      name: 'article-create',
      component: ArticleEditView,
      meta: { requiresAuth: true }
    },
    {
      path: '/articles/:id/edit',
      name: 'article-edit',
      component: ArticleEditView,
      meta: { requiresAuth: true }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
      meta: { requiresAuth: true }
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果未初始化认证信息，先初始化
  if (!authStore.token) {
    authStore.initAuth()
  }
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.name === 'login' && authStore.isLoggedIn) {
    // 如果已登录，访问登录页时重定向到首页
    next('/')
  } else {
    next()
  }
})

export default router
