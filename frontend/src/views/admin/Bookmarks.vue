<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">书签管理</h2>
      <n-button type="primary" @click="showAddModal = true">添加书签</n-button>
    </div>
    
    <n-card class="mb-4">
      <n-space>
        <n-input v-model:value="searchKeyword" placeholder="搜索书签..." clearable />
        <n-button @click="handleSearch">搜索</n-button>
        <n-button @click="handleReset">重置</n-button>
      </n-space>
    </n-card>
    
    <n-card>
      <n-data-table
        :columns="columns"
        :data="bookmarkStore.bookmarks"
        :loading="bookmarkStore.loading"
        :pagination="pagination"
      />
    </n-card>
    
    <BookmarkModal
      v-model:show="showAddModal"
      :bookmark="selectedBookmark"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NInput, NButton, NSpace, NDataTable, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Create, Trash } from '@vicons/ionicons5'
import { useBookmarkStore } from '@/stores/bookmark'
import BookmarkModal from '@/components/bookmark/Modal.vue'

const message = useMessage()
const bookmarkStore = useBookmarkStore()

const searchKeyword = ref('')
const showAddModal = ref(false)
const selectedBookmark = ref<any>(null)
const pagination = { pageSize: 20 }

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '标题', key: 'title', ellipsis: true },
  { title: 'URL', key: 'url', ellipsis: true },
  { title: '分类', key: 'category', render: (row) => row.category?.name || '-' },
  { title: '私有', key: 'is_private', render: (row) => h(NTag, { type: row.is_private ? 'error' : 'default' }, () => row.is_private ? '是' : '否') },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, { text: true, onClick: () => editBookmark(row) }, () => h(NIcon, () => h(Create))),
      h(NPopconfirm, {
        onPositiveClick: () => deleteBookmark(row.id)
      }, {
        trigger: () => h(NButton, { text: true }, () => h(NIcon, () => h(Trash))),
        default: () => '确定删除？'
      })
    ])
  }
]

function handleSearch() {
  bookmarkStore.fetchBookmarks({ keyword: searchKeyword.value || undefined })
}

function handleReset() {
  searchKeyword.value = ''
  bookmarkStore.fetchBookmarks()
}

function editBookmark(bookmark: any) {
  selectedBookmark.value = bookmark
  showAddModal.value = true
}

async function deleteBookmark(id: number) {
  try {
    await bookmarkStore.deleteBookmark(id)
    message.success('删除成功')
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

function handleModalSuccess() {
  showAddModal.value = false
  selectedBookmark.value = null
  bookmarkStore.fetchBookmarks()
}

onMounted(() => {
  bookmarkStore.fetchBookmarks()
})
</script>
