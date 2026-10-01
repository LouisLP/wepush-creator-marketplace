import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { Role } from '@/api/client.ts'
import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    role?: Role
    crumb?: string
  }
}

export const ACTOR_PARAM = { advertiser: 'advertiserId', creator: 'creatorId' } as const satisfies Record<Role, string>

export function actorIdIn(route: RouteLocationNormalizedLoaded, role: Role): string | undefined {
  const id = route.params[ACTOR_PARAM[role]]
  return typeof id === 'string' ? id : undefined
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/components/AppShell.vue'),
      children: [
        { path: '', redirect: '/advertisers' },
        { path: 'advertisers', name: 'advertisers', component: () => import('@/pages/advertiser/AdvertiserHubPage.vue') },
        {
          path: 'advertisers/:advertiserId',
          component: () => import('@/components/ActorWorkspace.vue'),
          meta: { role: 'advertiser' },
          children: [
            {
              path: '',
              component: () => import('@/pages/advertiser/AdvertiserCampaignsLayout.vue'),
              children: [
                { path: '', name: 'advertiser-home', component: () => import('@/pages/advertiser/AdvertiserHomePage.vue') },
                { path: 'campaigns/new', name: 'advertiser-campaign-new', component: () => import('@/pages/advertiser/NewCampaignPage.vue'), meta: { crumb: 'New Campaign' } },
                { path: 'campaigns/:campaignId', name: 'advertiser-campaign', component: () => import('@/pages/advertiser/AdvertiserCampaignPage.vue'), props: route => ({ id: route.params.campaignId }), meta: { crumb: 'Campaign' } },
              ],
            },
          ],
        },
        { path: 'creators', name: 'creators', component: () => import('@/pages/creator/CreatorHubPage.vue') },
        {
          path: 'creators/:creatorId',
          component: () => import('@/components/ActorWorkspace.vue'),
          meta: { role: 'creator' },
          children: [
            {
              path: '',
              component: () => import('@/pages/creator/CreatorWorkspace.vue'),
              children: [
                { path: '', name: 'creator-home', component: () => import('@/pages/creator/CreatorHomePage.vue') },
                { path: 'campaigns/:campaignId', name: 'creator-campaign', component: () => import('@/pages/creator/CampaignReviewPage.vue'), props: route => ({ id: route.params.campaignId }), meta: { crumb: 'Campaign' } },
              ],
            },
          ],
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/advertisers' },
  ],
})

export default router
