<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIdentityStore } from '@/stores/identity.ts'

const route = useRoute()
const router = useRouter()
const identity = useIdentityStore()

const role = computed(() => route.meta.role!)
const actingAs = computed(() => identity.get(role.value))

function switchIdentity() {
  identity.clear(role.value)
  void router.push({ path: '/', query: { role: role.value } })
}
</script>

<template>
  <div class="shell">
    <header class="bar">
      <RouterLink to="/" class="brand">
        WePush
      </RouterLink>
      <span class="role">{{ role }}</span>
      <RouterLink :to="`/${role}/prototype`" class="role">
        Prototype #22
      </RouterLink>
      <span class="who">{{ actingAs?.name }}</span>
      <button class="btn btn-ghost" @click="switchIdentity">
        Switch
      </button>
    </header>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-gutter);
  border-bottom: 1px solid var(--color-border-subtle);
  background-color: var(--color-bg-surface);
}

.brand {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

.role {
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-full);
  background-color: var(--color-secondary-subtle-bg);
  color: var(--color-secondary-subtle-fg);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
}

.who {
  margin-inline-start: auto;
  color: var(--color-text-secondary);
}

.content {
  max-width: 72rem;
  margin-inline: auto;
  padding: var(--space-xl) var(--space-gutter);
}
</style>
