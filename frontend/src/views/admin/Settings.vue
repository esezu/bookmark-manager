<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">系统设置</h2>
    
    <n-card title="导入书签" class="mb-4">
      <n-upload
        accept=".html"
        :max="1"
        :custom-request="handleImport"
      >
        <n-button>选择文件</n-button>
      </n-upload>
      <p class="text-gray-500 text-sm mt-2">支持 Chrome、Firefox 等浏览器的书签 HTML 文件导入</p>
    </n-card>
    
    <n-card title="导出书签">
      <n-space>
        <n-button @click="handleExport('html')">导出为 HTML</n-button>
        <n-button @click="handleExport('json')">导出为 JSON</n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NUpload, NButton, NSpace, useMessage } from 'naive-ui'
import api from '@/api'

const message = useMessage()

async function handleImport({ file }: any) {
  const formData = new FormData()
  formData.append('file', file.file)
  
  try {
    const response = await api.post('/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (response.data.code === 0) {
      message.success(`导入成功！共 ${response.data.data.total} 条，成功 ${response.data.data.success} 条`)
    }
  } catch (error: any) {
    message.error(error.message || '导入失败')
  }
}

function handleExport(format: string) {
  window.open(`/api/v1/export?format=${format}`, '_blank')
}
</script>
