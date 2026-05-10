<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-8">
          <h1 class="text-xl font-bold text-gray-800">书签管理器 - 管理后台</h1>
          <nav class="flex space-x-4">
            <router-link
              v-for="item in menuItems"
              :key="item.path"
              :to="item.path"
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              {{ item.label }}
            </router-link>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <n-button text tag="a" href="/">返回前台</n-button>
          <n-button text @click="handleLogout">退出登录</n-button>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const menuItems = [
  { label: '仪表盘', path: '/admin' },
  { label: '书签管理', path: '/admin/bookmarks' },
  { label: '分类管理', path: '/admin/categories' },
  { label: '标签管理', path: '/admin/tags' },
  { label: '用户管理', path: '/admin/users' },
  { label: '系统设置', path: '/admin/settings' }
]

function handleLogout() {
  authStore.logout()
  message.success('已退出登录')
  router.push('/login')
}
</script>
