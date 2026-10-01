<script setup lang="ts">
// PROTOTYPE (#52) — navbar per #49: logo → home, hub links, spacer, theme toggle.
import { Icon } from '@iconify/vue'
import AppThemeToggle from '@/components/kit/AppThemeToggle.vue'
import { useProtoState } from './state.ts'

const { hub, to } = useProtoState()
</script>

<template>
  <header class="nav">
    <RouterLink :to="to({ hub: 'advertisers' })" class="logo" aria-label="WePush home">
      <img src="/logo.webp" alt="" width="28" height="28">
      <span>WePush</span>
    </RouterLink>
    <nav aria-label="Hubs" class="hubs">
      <RouterLink :to="to({ hub: 'advertisers' })" :aria-current="hub === 'advertisers' ? 'page' : undefined">
        <Icon icon="lucide:megaphone" aria-hidden="true" /><span class="lbl">Advertisers</span>
      </RouterLink>
      <RouterLink :to="to({ hub: 'creators' })" :aria-current="hub === 'creators' ? 'page' : undefined">
        <Icon icon="lucide:clapperboard" aria-hidden="true" /><span class="lbl">Creators</span>
      </RouterLink>
    </nav>
    <AppThemeToggle class="theme" />
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  inset-block-start: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xs) var(--space-gutter);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
}
.logo { display: flex; align-items: center; gap: var(--space-xs); font-family: var(--font-heading); font-weight: var(--font-weight-bold); text-decoration: none; color: inherit; }
.logo img { border-radius: var(--radius-sm); }
.hubs { display: flex; gap: var(--space-2xs); }
.hubs a { display: inline-flex; align-items: center; gap: var(--space-2xs); padding: var(--space-2xs) var(--space-sm); border-radius: var(--radius-md); color: var(--color-text-secondary); text-decoration: none; }
.hubs a:hover { background: var(--color-bg-surface-hover); }
.hubs a[aria-current='page'] { color: var(--color-text-primary); background: var(--color-bg-surface-raised); }
.theme { margin-inline-start: auto; }
@media (width < 40rem) {
  .hubs .lbl, .logo span { display: none; }
}
</style>
