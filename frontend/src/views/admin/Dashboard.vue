<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">仪表盘</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ stats.totalBookmarks }}</div>
          <div class="text-gray-500">书签总数</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ stats.totalCategories }}</div>
          <div class="text-gray-500">分类总数</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-600">{{ stats.totalTags }}</div>
          <div class="text-gray-500">标签总数</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-600">{{ stats.totalUsers }}</div>
          <div class="text-gray-500">用户总数</div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard } from 'naive-ui'
import api from '@/api'

const stats = ref({
  totalBookmarks: 0,
  totalCategories: 0,
  totalTags: 0,
  totalUsers: 0
})

async function fetchStats() {
  try {
    const [bookmarksRes, categoriesRes, tagsRes, usersRes] = await Promise.all([
      api.get('/bookmarks', { params: { page_size: 1 } }),
      api.get('/categories'),
      api.get('/tags'),
      api.get('/users')
    ])
    
    stats.value = {
      totalBookmarks: bookmarksRes.data.data?.total || 0,
      totalCategories: Array.isArray(categoriesRes.data.data) ? categoriesRes.data.data.length : 0,
      totalTags: Array.isArray(tagsRes.data.data) ? tagsRes.data.data.length : 0,
      totalUsers: Array.isArray(usersRes.data.data) ? usersRes.data.data.length : 0
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

onMounted(fetchStats)
</script>
