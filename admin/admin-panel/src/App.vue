<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout.vue'

const authStore = useAuthStore()

// 应用启动时初始化认证状态
onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <Layout v-if="authStore.isLoggedIn">
    <RouterView />
  </Layout>
  <RouterView v-else />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
