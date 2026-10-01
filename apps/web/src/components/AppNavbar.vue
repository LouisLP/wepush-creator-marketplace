<script setup lang="ts">
import { useRoute } from 'vue-router'
import IconMegaphone from '~icons/lucide/megaphone'
import IconUsers from '~icons/lucide/users'
import AppThemeToggle from '@/components/kit/AppThemeToggle.vue'
import { useTheme } from '@/composables/useTheme.ts'

const route = useRoute()
const { theme } = useTheme()

const hubs = [
  { to: '/advertisers', label: 'Advertisers', icon: IconMegaphone },
  { to: '/creators', label: 'Creators', icon: IconUsers },
]

function currentFor(hub: string) {
  if (route.path === hub)
    return 'page'
  return route.path.startsWith(`${hub}/`) ? 'true' : undefined
}
</script>

<template>
  <header class="navbar">
    <nav class="inner" aria-label="Main">
      <RouterLink to="/" class="home">
        <img src="/logo.webp" alt="WePush" width="96" height="32" class="logo" :class="{ inverted: theme === 'dark' }">
      </RouterLink>
      <ul class="hubs">
        <li v-for="hub in hubs" :key="hub.to">
          <RouterLink :to="hub.to" class="hub" :aria-current="currentFor(hub.to)">
            <component :is="hub.icon" aria-hidden="true" />
            <span class="label">{{ hub.label }}</span>
          </RouterLink>
        </li>
      </ul>
      <AppThemeToggle class="theme" />
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  inset-block-start: 0;
  z-index: var(--z-sticky);
  border-block-end: 1px solid var(--color-border-subtle);
  background-color: var(--color-bg-surface);
}

.inner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: var(--space-xs) var(--space-gutter);
}

.home {
  display: inline-flex;
  border-radius: var(--radius-sm);
}

.logo {
  display: block;
  block-size: 2rem;
  inline-size: auto;
}

/* The wordmark's dark ink disappears on a dark bar; flip lightness, keep hue */
.logo.inverted {
  filter: invert(1) hue-rotate(180deg);
}

.hubs {
  display: flex;
  gap: var(--space-2xs);
  padding: 0;
  list-style: none;
}

.hub {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.hub:hover {
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.hub[aria-current] {
  background-color: var(--color-bg-surface-raised);
  color: var(--color-text-primary);
}

.home:focus-visible,
.hub:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.theme {
  margin-inline-start: auto;
}

@media (width < 30rem) {
  .label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
