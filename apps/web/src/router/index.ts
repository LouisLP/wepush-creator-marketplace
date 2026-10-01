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
        {
          path: '',
          component: () => import('@/pages/advertiser/AdvertiserCampaignsLayout.vue'),
          children: [
            { path: '', name: 'advertiser-home', component: () => import('@/pages/advertiser/AdvertiserHomePage.vue') },
            { path: 'campaigns/new', name: 'advertiser-campaign-new', component: () => import('@/pages/advertiser/NewCampaignPage.vue') },
            { path: 'campaigns/:id', name: 'advertiser-campaign', component: () => import('@/pages/advertiser/AdvertiserCampaignPage.vue'), props: true },
          ],
        },
      ],
    },
    {
      path: '/creator',
      component: () => import('@/components/AppShell.vue'),
      meta: { role: 'creator' },
      children: [
        {
          path: '',
          component: () => import('@/pages/creator/CreatorWorkspace.vue'),
          children: [
            { path: '', name: 'creator-home', component: () => import('@/pages/creator/CreatorHomePage.vue') },
            { path: 'campaigns/:id', name: 'creator-campaign', component: () => import('@/pages/creator/CampaignReviewPage.vue'), props: true },
          ],
        },
      ],
    },
    { path: '/prototype/layouts', component: () => import('@/pages/prototype-layouts/LayoutsPrototype.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const role = to.meta.role
  if (role && !useIdentityStore().get(role))
    return pickerFor(role, to.fullPath)
})

export function pickerFor(role: Role, redirect?: string) {
  return { path: '/', query: redirect ? { role, redirect } : { role } }
}

/** Where to land after picking `role`: the requested page if it belongs to that role, else its home. */
export function landingFor(role: Role, redirect: unknown): string {
  const home = `/${role}`
  const ownsPath = typeof redirect === 'string' && redirect.startsWith(home) && /^(?:$|[/?#])/.test(redirect.slice(home.length))
  return ownsPath ? redirect : home
}

export default router
