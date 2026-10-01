import type { Role } from '@/api/client.ts'
import { createRouter, createWebHistory } from 'vue-router'
import { useIdentityStore } from '@/stores/identity.ts'

declare module 'vue-router' {
  interface RouteMeta {
    role?: Role
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'picker', component: () => import('@/pages/RolePickerPage.vue') },
    {
      path: '/advertiser',
      component: () => import('@/components/AppShell.vue'),
      meta: { role: 'advertiser' },
      children: [
        { path: '', name: 'advertiser-home', component: () => import('@/pages/advertiser/AdvertiserHomePage.vue') },
        { path: 'prototype', component: () => import('@/pages/prototype-screens/AdvertiserScreensPrototype.vue') },
      ],
    },
    {
      path: '/creator',
      component: () => import('@/components/AppShell.vue'),
      meta: { role: 'creator' },
      children: [
        { path: '', name: 'creator-home', component: () => import('@/pages/creator/CreatorHomePage.vue') },
        { path: 'prototype', component: () => import('@/pages/prototype-screens/CreatorScreensPrototype.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const role = to.meta.role
  if (role && !useIdentityStore().get(role))
    return { path: '/', query: { role, redirect: to.fullPath } }
})

export default router
