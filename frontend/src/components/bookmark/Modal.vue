<template>
  <n-modal v-model:show="show" preset="card" :title="isEdit ? '编辑书签' : '添加书签'" style="width: 500px">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
      <n-form-item label="标题" path="title">
        <n-input v-model:value="form.title" placeholder="请输入书签标题" />
      </n-form-item>
      
      <n-form-item label="URL" path="url">
        <n-input v-model:value="form.url" placeholder="https://example.com" />
      </n-form-item>
      
      <n-form-item label="描述" path="description">
        <n-input v-model:value="form.description" type="textarea" placeholder="请输入描述（可选）" />
      </n-form-item>
      
      <n-form-item label="分类" path="category_id">
        <n-select
          v-model:value="form.category_id"
          :options="categoryOptions"
          placeholder="选择分类"
          clearable
        />
      </n-form-item>
      
      <n-form-item label="标签" path="tag_ids">
        <n-select
          v-model:value="form.tag_ids"
          :options="tagOptions"
          multiple
          placeholder="选择标签"
          clearable
        />
      </n-form-item>
      
      <n-form-item label="备用链接" path="alt_url">
        <n-input v-model:value="form.alt_url" placeholder="https://backup.example.com（可选）" />
      </n-form-item>
      
      <n-form-item label="私有">
        <n-switch v-model:value="form.is_private" />
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
import { NModal, NForm, NFormItem, NInput, NSelect, NSwitch, NButton, NSpace, useMessage } from 'naive-ui'
import api from '@/api'

const props = defineProps<{
  show: boolean
  bookmark?: any
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const message = useMessage()

const formRef = ref()
const loading = ref(false)
const categories = ref<any[]>([])
const tags = ref<any[]>([])

const form = ref({
  title: '',
  url: '',
  description: '',
  category_id: null as number | null,
  tag_ids: [] as number[],
  alt_url: '',
  is_private: false
})

const isEdit = computed(() => !!props.bookmark)

const categoryOptions = computed(() =>
  categories.value.map(c => ({ label: c.name, value: c.id }))
)

const tagOptions = computed(() =>
  tags.value.map(t => ({ label: t.name, value: t.id }))
)

const rules = {
  title: { required: true, message: '请输入标题', trigger: 'blur' },
  url: { required: true, message: '请输入URL', trigger: 'blur' }
}

watch(() => props.show, async (newVal) => {
  if (newVal) {
    await Promise.all([fetchCategories(), fetchTags()])
    if (props.bookmark) {
      form.value = {
        title: props.bookmark.title,
        url: props.bookmark.url,
        description: props.bookmark.description || '',
        category_id: props.bookmark.categoryId || null,
        tag_ids: props.bookmark.tags?.map((t: any) => t.id) || [],
        alt_url: props.bookmark.altUrl || '',
        is_private: !!props.bookmark.isPrivate
      }
    } else {
      form.value = {
        title: '',
        url: '',
        description: '',
        category_id: null,
        tag_ids: [],
        alt_url: '',
        is_private: false
      }
    }
  }
})

async function fetchCategories() {
  try {
    const response = await api.get('/categories')
    if (response.data.code === 0) {
      categories.value = flattenCategories(response.data.data)
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

function flattenCategories(cats: any[]): any[] {
  let result: any[] = []
  for (const cat of cats) {
    result.push(cat)
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children))
    }
  }
  return result
}

async function fetchTags() {
  try {
    const response = await api.get('/tags')
    if (response.data.code === 0) {
      tags.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    const data = {
      title: form.value.title,
      url: form.value.url,
      description: form.value.description || undefined,
      category_id: form.value.category_id || undefined,
      tag_ids: form.value.tag_ids.length > 0 ? form.value.tag_ids : undefined,
      alt_url: form.value.alt_url || undefined,
      is_private: form.value.is_private
    }
    
    if (isEdit.value) {
      await api.put(`/bookmarks/${props.bookmark.id}`, data)
      message.success('更新成功')
    } else {
      await api.post('/bookmarks', data)
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
