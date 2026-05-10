<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-800">书签管理器</h1>
        <div class="flex items-center space-x-4">
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索书签..."
            clearable
            @keydown.enter="handleSearch"
            class="w-64"
          >
            <template #prefix>
              <n-icon><Search /></n-icon>
            </template>
          </n-input>
          <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
            <n-button text>
              {{ authStore.user?.username }}
              <n-icon><ChevronDown /></n-icon>
            </n-button>
          </n-dropdown>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex gap-6">
        <aside class="w-64 flex-shrink-0">
          <n-card>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">分类</span>
                <n-button text size="small" tag="a" href="/admin/categories">
                  <n-icon><Settings /></n-icon>
                </n-button>
              </div>
            </template>
            <n-menu
              v-model:value="activeCategoryId"
              :options="categoryOptions"
              @update:value="handleCategoryChange"
            />
          </n-card>
        </aside>
        
        <div class="flex-1">
          <div class="mb-4">
            <n-button type="primary" @click="showAddModal = true">
              <template #icon>
                <n-icon><Add /></n-icon>
              </template>
              添加书签
            </n-button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <n-card
              v-for="bookmark in bookmarkStore.bookmarks"
              :key="bookmark.id"
              hoverable
              class="cursor-pointer transition-transform hover:scale-105"
              @click="openBookmark(bookmark.url)"
            >
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <img
                    v-if="bookmark.favicon"
                    :src="bookmark.favicon"
                    class="w-6 h-6"
                    @error="handleFaviconError"
                  />
                  <n-icon v-else size="24" color="#666"><Link /></n-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-gray-800 truncate">{{ bookmark.title }}</h3>
                  <p class="text-sm text-gray-500 truncate">{{ bookmark.url }}</p>
                  <div v-if="bookmark.description" class="text-xs text-gray-400 mt-1 truncate">
                    {{ bookmark.description }}
                  </div>
                </div>
              </div>
            </n-card>
          </div>
          
          <div v-if="bookmarkStore.bookmarks.length === 0" class="text-center py-12">
            <n-empty description="暂无书签">
              <template #extra>
                <n-button type="primary" @click="showAddModal = true">添加书签</n-button>
              </template>
            </n-empty>
          </div>
        </div>
      </div>
    </main>
    
    <BookmarkModal
      v-model:show="showAddModal"
      :bookmark="selectedBookmark"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard, NInput, NIcon, NDropdown, NButton, NMenu, NEmpty,
  useMessage
} from 'naive-ui'
import { Search, ChevronDown, Link, Settings, Add } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { useBookmarkStore } from '@/stores/bookmark'
import api from '@/api'
import BookmarkModal from '@/components/bookmark/Modal.vue'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const bookmarkStore = useBookmarkStore()

const searchKeyword = ref('')
const activeCategoryId = ref<number | null>(null)
const categories = ref<any[]>([])
const showAddModal = ref(false)
const selectedBookmark = ref<any>(null)

const categoryOptions = computed(() => [
  { label: '全部书签', key: null },
  ...categories.value.map(c => ({
    label: `${c.name} (${c.bookmark_count})`,
    key: c.id
  }))
])

const userMenuOptions = [
  { label: '管理后台', key: 'admin' },
  { label: '退出登录', key: 'logout' }
]

async function fetchCategories() {
  try {
    const response = await api.get('/categories')
    if (response.data.code === 0) {
      categories.value = response.data.data || []
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

function handleSearch() {
  bookmarkStore.fetchBookmarks({ keyword: searchKeyword.value || undefined })
}

function handleCategoryChange(categoryId: number | null) {
  activeCategoryId.value = categoryId
  bookmarkStore.fetchBookmarks({ category_id: categoryId || undefined })
}

function handleUserMenuSelect(key: string) {
  if (key === 'admin') {
    router.push('/admin')
  } else if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

function openBookmark(url: string) {
  window.open(url, '_blank')
}

function handleModalSuccess() {
  showAddModal.value = false
  selectedBookmark.value = null
  fetchCategories()
  bookmarkStore.fetchBookmarks()
}

function handleFaviconError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}

onMounted(async () => {
  await Promise.all([
    bookmarkStore.fetchBookmarks(),
    fetchCategories()
  ])
})
</script>
