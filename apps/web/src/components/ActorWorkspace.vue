<script setup lang="ts">
import { listAdvertisers, listCreators } from '@wepush/contracts'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconUserX from '~icons/lucide/user-x'
import { call, rejectedActorId } from '@/api'
import { useRequest } from '@/composables/useRequest.ts'
import { actorIdIn } from '@/router'

const route = useRoute()
const role = computed(() => route.meta.role!)
const actorId = computed(() => actorIdIn(route, role.value))
const hub = computed(() => role.value === 'advertiser'
  ? { path: '/advertisers', label: 'Advertisers', noun: 'Advertiser' }
  : { path: '/creators', label: 'Creators', noun: 'Creator' })

const actors = useRequest(async () => role.value === 'advertiser'
  ? (await call(listAdvertisers)).items.map(a => ({ id: a.id, name: a.name }))
  : (await call(listCreators)).items.map(c => ({ id: c.id, name: c.handle })))
const actorName = computed(() => actors.data.value?.find(a => a.id === actorId.value)?.name)

const notFound = computed(() => rejectedActorId.value === actorId.value)
const crumb = computed(() => route.meta.crumb)
</script>

<template>
  <div class="workspace">
    <nav aria-label="Breadcrumb">
      <ol class="crumbs">
        <li>
          <RouterLink :to="hub.path">
            {{ hub.label }}
          </RouterLink>
        </li>
        <li v-if="!notFound">
          <IconChevronRight class="sep" aria-hidden="true" />
          <RouterLink v-if="crumb" :to="`${hub.path}/${actorId}`">
            {{ actorName ?? hub.noun }}
          </RouterLink>
          <span v-else aria-current="page">{{ actorName ?? hub.noun }}</span>
        </li>
        <li v-if="crumb && !notFound">
          <IconChevronRight class="sep" aria-hidden="true" />
          <span aria-current="page">{{ crumb }}</span>
        </li>
      </ol>
    </nav>

    <section v-if="notFound" class="card not-found" aria-labelledby="not-found-heading">
      <IconUserX class="icon" aria-hidden="true" />
      <h1 id="not-found-heading">
        {{ hub.noun }} not found
      </h1>
      <p class="muted">
        There’s no {{ hub.noun }} at this address.
      </p>
      <RouterLink :to="hub.path" class="btn">
        Back to {{ hub.label }}
      </RouterLink>
    </section>
    <RouterView v-else :key="actorId" />
  </div>
</template>

<style scoped>
.workspace {
  display: grid;
  gap: var(--space-lg);
}

.crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  list-style: none;
}

.crumbs li {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
}

.crumbs a {
  color: inherit;
}

.crumbs [aria-current] {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.sep {
  color: var(--color-text-muted);
}

.not-found {
  display: grid;
  gap: var(--space-sm);
  justify-items: start;
}

.icon {
  color: var(--color-text-muted);
  font-size: var(--font-size-2xl);
}
</style>
