<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">标签管理</h2>
      <n-button type="primary" @click="showAddModal = true">添加标签</n-button>
    </div>
    
    <n-card>
      <n-data-table
        :columns="columns"
        :data="tags"
        :loading="loading"
      />
    </n-card>
    
    <TagModal
      v-model:show="showAddModal"
      :tag="selectedTag"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NDataTable, NButton, NIcon, NTag, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Create, Trash } from '@vicons/ionicons5'
import api from '@/api'
import TagModal from '@/components/tag/Modal.vue'

const message = useMessage()

const tags = ref<any[]>([])
const loading = ref(false)
const showAddModal = ref(false)
const selectedTag = ref<any>(null)

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '名称', key: 'name' },
  { title: '颜色', key: 'color', render: (row) => h(NTag, { color: { color: row.color, textColor: '#fff' } }, () => row.color) },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, { text: true, onClick: () => editTag(row) }, () => h(NIcon, () => h(Create))),
      h(NPopconfirm, {
        onPositiveClick: () => deleteTag(row.id)
      }, {
        trigger: () => h(NButton, { text: true }, () => h(NIcon, () => h(Trash))),
        default: () => '确定删除？'
      })
    ])
  }
]

async function fetchTags() {
  loading.value = true
  try {
    const response = await api.get('/tags')
    if (response.data.code === 0) {
      tags.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  } finally {
    loading.value = false
  }
}

function editTag(tag: any) {
  selectedTag.value = tag
  showAddModal.value = true
}

async function deleteTag(id: number) {
  try {
    await api.delete(`/tags/${id}`)
    message.success('删除成功')
    fetchTags()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

function handleModalSuccess() {
  showAddModal.value = false
  selectedTag.value = null
  fetchTags()
}

onMounted(fetchTags)
</script>
