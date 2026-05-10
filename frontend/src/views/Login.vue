<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
    <n-card class="w-full max-w-md" :bordered="false">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800">书签管理器</h1>
          <p class="text-gray-500 mt-2">登录您的账户</p>
        </div>
      </template>
      
      <n-form ref="formRef" :model="form" :rules="rules">
        <n-form-item path="username" label="用户名/邮箱">
          <n-input v-model:value="form.username" placeholder="请输入用户名或邮箱" />
        </n-form-item>
        
        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
            @keydown.enter="handleLogin"
          />
        </n-form-item>
      </n-form>
      
      <template #footer>
        <n-button type="primary" block :loading="loading" @click="handleLogin">
          登录
        </n-button>
        <div class="text-center mt-4">
          <n-button text tag="a" href="/register">
            还没有账户？立即注册
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
  password: ''
})

const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' }
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await authStore.login(form.value.username, form.value.password)
    message.success('登录成功')
    router.push('/')
  } catch (error: any) {
    message.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
