<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">分类管理</h2>
      <n-button type="primary" @click="showAddModal = true">添加分类</n-button>
    </div>
    
    <n-card>
      <n-data-table
        :columns="columns"
        :data="categories"
        :loading="loading"
      />
    </n-card>
    
    <CategoryModal
      v-model:show="showAddModal"
      :category="selectedCategory"
      :categories="categories"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NDataTable, NButton, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Create, Trash } from '@vicons/ionicons5'
import api from '@/api'
import CategoryModal from '@/components/category/Modal.vue'

const message = useMessage()

const categories = ref<any[]>([])
const loading = ref(false)
const showAddModal = ref(false)
const selectedCategory = ref<any>(null)

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '名称', key: 'name' },
  { title: '书签数量', key: 'bookmark_count', width: 120 },
  { title: '排序', key: 'sortOrder', width: 100 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, { text: true, onClick: () => editCategory(row) }, () => h(NIcon, () => h(Create))),
      h(NPopconfirm, {
        onPositiveClick: () => deleteCategory(row.id)
      }, {
        trigger: () => h(NButton, { text: true }, () => h(NIcon, () => h(Trash))),
        default: () => '确定删除？'
      })
    ])
  }
]

async function fetchCategories() {
  loading.value = true
  try {
    const response = await api.get('/categories')
    if (response.data.code === 0) {
      categories.value = flattenCategories(response.data.data)
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  } finally {
    loading.value = false
  }
}

function flattenCategories(cats: any[], level = 0): any[] {
  let result: any[] = []
  for (const cat of cats) {
    result.push({ ...cat, _level: level, name: (level > 0 ? '└─ ' : '') + cat.name })
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children, level + 1))
    }
  }
  return result
}

function editCategory(category: any) {
  selectedCategory.value = category
  showAddModal.value = true
}

async function deleteCategory(id: number) {
  try {
    await api.delete(`/categories/${id}`)
    message.success('删除成功')
    fetchCategories()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

function handleModalSuccess() {
  showAddModal.value = false
  selectedCategory.value = null
  fetchCategories()
}

onMounted(fetchCategories)
</script>
