<template>
  <n-modal v-model:show="show" preset="card" :title="isEdit ? '编辑分类' : '添加分类'" style="width: 400px">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
      <n-form-item label="名称" path="name">
        <n-input v-model:value="form.name" placeholder="请输入分类名称" />
      </n-form-item>
      
      <n-form-item label="父分类" path="parent_id">
        <n-select
          v-model:value="form.parent_id"
          :options="parentOptions"
          placeholder="选择父分类（可选）"
          clearable
        />
      </n-form-item>
      
      <n-form-item label="排序" path="sort_order">
        <n-input-number v-model:value="form.sort_order" :min="0" />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="show = false">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NButton, NSpace, useMessage } from 'naive-ui'
import api from '@/api'

const props = defineProps<{
  show: boolean
  category?: any
  categories: any[]
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const message = useMessage()

const formRef = ref()
const loading = ref(false)

const form = ref({
  name: '',
  parent_id: null as number | null,
  sort_order: 0
})

const isEdit = computed(() => !!props.category)

const parentOptions = computed(() => {
  const flatten = (cats: any[], result: any[] = []): any[] => {
    for (const cat of cats) {
      if (!props.category || cat.id !== props.category.id) {
        result.push({ label: cat.name, value: cat.id })
      }
      if (cat.children) {
        flatten(cat.children, result)
      }
    }
    return result
  }
  return flatten(props.categories)
})

const rules = {
  name: { required: true, message: '请输入分类名称', trigger: 'blur' }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.category) {
      form.value = {
        name: props.category.name,
        parent_id: props.category.parentId || null,
        sort_order: props.category.sortOrder || 0
      }
    } else {
      form.value = {
        name: '',
        parent_id: null,
        sort_order: 0
      }
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    const data = {
      name: form.value.name,
      parent_id: form.value.parent_id || undefined,
      sort_order: form.value.sort_order
    }
    
    if (isEdit.value) {
      await api.put(`/categories/${props.category.id}`, data)
      message.success('更新成功')
    } else {
      await api.post('/categories', data)
      message.success('创建成功')
    }
    
    emit('update:show', false)
    emit('success')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>
