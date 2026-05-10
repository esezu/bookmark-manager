<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">用户管理</h2>
    
    <n-card>
      <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NDataTable, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Trash } from '@vicons/ionicons5'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

const message = useMessage()
const authStore = useAuthStore()

const users = ref<any[]>([])
const loading = ref(false)

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'username' },
  { title: '邮箱', key: 'email' },
  { title: '角色', key: 'role', render: (row) => h(NTag, { type: row.role === 'admin' ? 'error' : 'default' }, () => row.role === 'admin' ? '管理员' : '用户') },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row) => row.id !== authStore.user?.id ? h(NPopconfirm, {
      onPositiveClick: () => deleteUser(row.id)
    }, {
      trigger: () => h(NIcon, { component: Trash, class: 'cursor-pointer text-red-500' }),
      default: () => '确定删除该用户？'
    }) : null
  }
]

async function fetchUsers() {
  loading.value = true
  try {
    const response = await api.get('/users')
    if (response.data.code === 0) {
      users.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

async function deleteUser(id: number) {
  try {
    await api.delete(`/users/${id}`)
    message.success('删除成功')
    fetchUsers()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

onMounted(fetchUsers)
</script>
