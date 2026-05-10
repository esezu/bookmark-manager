import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  
  const isLoggedIn = computed(() => !!token.value)
  
  async function login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password })
    if (response.data.code === 0) {
      token.value = response.data.data.token
      user.value = response.data.data.user
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      return true
    }
    throw new Error(response.data.message)
  }
  
  async function register(username: string, password: string, email?: string) {
    const response = await api.post('/auth/register', { username, password, email })
    if (response.data.code === 0) {
      return response.data.data
    }
    throw new Error(response.data.message)
  }
  
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  
  async function fetchCurrentUser() {
    if (!token.value) return
    try {
      const response = await api.get('/auth/me')
      if (response.data.code === 0) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(user.value))
      }
    } catch (error) {
      logout()
    }
  }
  
  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    logout,
    fetchCurrentUser
  }
})
