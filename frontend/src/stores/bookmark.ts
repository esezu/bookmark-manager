import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'

export const useBookmarkStore = defineStore('bookmark', () => {
  const bookmarks = ref<any[]>([])
  const total = ref(0)
  const loading = ref(false)
  
  async function fetchBookmarks(params: {
    category_id?: number
    keyword?: string
    page?: number
    page_size?: number
  } = {}) {
    loading.value = true
    try {
      const response = await api.get('/bookmarks', { params })
      if (response.data.code === 0) {
        bookmarks.value = response.data.data.list
        total.value = response.data.data.total
      }
    } finally {
      loading.value = false
    }
  }
  
  async function createBookmark(data: {
    category_id?: number
    title: string
    url: string
    description?: string
    alt_url?: string
    is_private?: boolean
    tag_ids?: number[]
  }) {
    const response = await api.post('/bookmarks', data)
    if (response.data.code === 0) {
      await fetchBookmarks()
      return response.data.data
    }
    throw new Error(response.data.message)
  }
  
  async function updateBookmark(id: number, data: any) {
    const response = await api.put(`/bookmarks/${id}`, data)
    if (response.data.code === 0) {
      await fetchBookmarks()
      return response.data.data
    }
    throw new Error(response.data.message)
  }
  
  async function deleteBookmark(id: number) {
    const response = await api.delete(`/bookmarks/${id}`)
    if (response.data.code === 0) {
      await fetchBookmarks()
      return true
    }
    throw new Error(response.data.message)
  }
  
  return {
    bookmarks,
    total,
    loading,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark
  }
})
