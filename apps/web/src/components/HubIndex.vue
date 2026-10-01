<script setup lang="ts" generic="T extends { id: string }">
import type { RouteLocationRaw } from 'vue-router'
import { ref } from 'vue'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconPlus from '~icons/lucide/plus'
import AppButton from '@/components/kit/AppButton.vue'
import AppDialog from '@/components/kit/AppDialog.vue'

defineProps<{
  heading: string
  intro: string
  noun: string
  items?: T[]
  error?: string
  to: (item: T) => RouteLocationRaw
}>()

defineSlots<{
  row: (props: { item: T }) => unknown
  form: (props: { close: () => void }) => unknown
}>()

const creating = ref(false)
</script>

<template>
  <section class="hub" aria-labelledby="hub-heading">
    <header class="head">
      <div>
        <h1 id="hub-heading">
          {{ heading }}
        </h1>
        <p class="muted">
          {{ intro }}
        </p>
      </div>
      <AppDialog v-model:open="creating" :title="`New ${noun}`" description="Create one, then act as it.">
        <template #trigger>
          <AppButton>
            <IconPlus aria-hidden="true" />
            New {{ noun }}
          </AppButton>
        </template>
        <template #default="{ close }">
          <slot name="form" :close="close" />
        </template>
      </AppDialog>
    </header>

    <p v-if="error" class="alert" role="alert">
      {{ error }}
    </p>
    <p v-else-if="items?.length === 0" class="card empty">
      No {{ noun }}s yet. Create one to get started.
    </p>
    <ul v-else-if="items" class="rows">
      <li v-for="item in items" :key="item.id">
        <RouterLink :to="to(item)" class="row">
          <slot name="row" :item="item" />
          <IconChevronRight class="chevron" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.hub {
  display: grid;
  gap: var(--space-lg);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-md);
}

.rows {
  display: grid;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-surface);
  list-style: none;
}

.rows li + li {
  border-block-start: 1px solid var(--color-border-subtle);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  color: inherit;
  text-decoration: none;
}

.row:hover {
  background-color: var(--color-bg-surface-hover);
}

.row:focus-visible {
  outline: var(--focus-ring);
  outline-offset: calc(-1 * var(--focus-ring-offset));
}

.chevron {
  margin-inline-start: auto;
  color: var(--color-text-muted);
}

.empty {
  color: var(--color-text-secondary);
}
</style>
