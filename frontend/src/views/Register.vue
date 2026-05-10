<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
    <n-card class="w-full max-w-md" :bordered="false">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800">书签管理器</h1>
          <p class="text-gray-500 mt-2">创建新账户</p>
        </div>
      </template>
      
      <n-form ref="formRef" :model="form" :rules="rules">
        <n-form-item path="username" label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" />
        </n-form-item>
        
        <n-form-item path="email" label="邮箱">
          <n-input v-model:value="form.email" placeholder="请输入邮箱（可选）" />
        </n-form-item>
        
        <n-form-item path="password" label="密码">
          <n-input v-model:value="form.password" type="password" placeholder="请输入密码" />
        </n-form-item>
        
        <n-form-item path="confirmPassword" label="确认密码">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
          />
        </n-form-item>
      </n-form>
      
      <template #footer>
        <n-button type="primary" block :loading="loading" @click="handleRegister">
          注册
        </n-button>
        <div class="text-center mt-4">
          <n-button text tag="a" href="/login">
            已有账户？立即登录
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string) => {
  if (value !== form.value.password) {
    return new Error('两次输入的密码不一致')
  }
  return true
}

const validatePassword = (rule: any, value: string) => {
  if (!value) {
    return new Error('请输入密码')
  }
  if (value.length < 8) {
    return new Error('密码至少 8 个字符')
  }
  if (!/[A-Z]/.test(value)) {
    return new Error('密码必须包含大写字母')
  }
  if (!/[a-z]/.test(value)) {
    return new Error('密码必须包含小写字母')
  }
  if (!/[0-9]/.test(value)) {
    return new Error('密码必须包含数字')
  }
  if (!/[@$!%*?&]/.test(value)) {
    return new Error('密码必须包含特殊字符（@$!%*?&）')
  }
  return true
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  email: { type: 'email' as const, message: '请输入有效的邮箱地址', trigger: 'blur' },
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function handleRegister() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await authStore.register(form.value.username, form.value.password, form.value.email)
    message.success('注册成功，请登录')
    router.push('/login')
  } catch (error: any) {
    message.error(error.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>
