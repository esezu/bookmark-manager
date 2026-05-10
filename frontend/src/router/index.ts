import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    component: () => import('@/views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'bookmarks',
        component: () => import('@/views/admin/Bookmarks.vue')
      },
      {
        path: 'categories',
        component: () => import('@/views/admin/Categories.vue')
      },
      {
        path: 'tags',
        component: () => import('@/views/admin/Tags.vue')
      },
      {
        path: 'users',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'settings',
        component: () => import('@/views/admin/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.guest && authStore.isLoggedIn) {
    next('/')
  } else if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next('/')
  } else {
    next()
  }
})

export default router
