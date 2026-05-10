<template>
  <n-modal v-model:show="show" preset="card" :title="isEdit ? '编辑标签' : '添加标签'" style="width: 400px">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
      <n-form-item label="名称" path="name">
        <n-input v-model:value="form.name" placeholder="请输入标签名称" />
      </n-form-item>
      
      <n-form-item label="颜色" path="color">
        <n-color-picker v-model:value="form.color" :show-alpha="false" />
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
import { NModal, NForm, NFormItem, NInput, NColorPicker, NButton, NSpace, useMessage } from 'naive-ui'
import api from '@/api'

const props = defineProps<{
  show: boolean
  tag?: any
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
  color: '#3b82f6'
})

const isEdit = computed(() => !!props.tag)

const rules = {
  name: { required: true, message: '请输入标签名称', trigger: 'blur' }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.tag) {
      form.value = {
        name: props.tag.name,
        color: props.tag.color || '#3b82f6'
      }
    } else {
      form.value = {
        name: '',
        color: '#3b82f6'
      }
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    if (isEdit.value) {
      await api.put(`/tags/${props.tag.id}`, form.value)
      message.success('更新成功')
    } else {
      await api.post('/tags', form.value)
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
