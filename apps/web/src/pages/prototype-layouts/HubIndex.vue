<script setup lang="ts">
// PROTOTYPE (#52) — hub index. A: list rows · B: card grid · C: dense table.
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { advertisers, count, creators, pct, platformIcon, platformLabel } from './fixtures.ts'
import PBadge from './PBadge.vue'
import PNewDialog from './PNewDialog.vue'
import { useProtoState } from './state.ts'

const { hub, variant, to } = useProtoState()
const dialog = ref<InstanceType<typeof PNewDialog>>()
const isAdv = computed(() => hub.value === 'advertisers')
const initials = (s: string) => s.replace('@', '').slice(0, 2).toUpperCase()
</script>

<template>
  <section class="hub p-stack" aria-labelledby="hub-heading">
    <header class="head">
      <h1 id="hub-heading">
        {{ isAdv ? 'Advertisers' : 'Creators' }}
      </h1>
      <button type="button" class="btn" @click="dialog?.open()">
        <Icon icon="lucide:plus" aria-hidden="true" /> New {{ isAdv ? 'Advertiser' : 'Creator' }}
      </button>
    </header>

    <!-- A: list rows -->
    <ul v-if="variant === 'A'" class="rows">
      <template v-if="isAdv">
        <li v-for="a in advertisers" :key="a.id">
          <RouterLink :to="to({ id: a.id })" class="row">
            <strong>{{ a.name }}</strong>
            <PBadge v-if="a.openCount" icon="lucide:clock">{{ a.openCount }} open</PBadge>
            <span v-else class="muted p-xs">No open Campaigns</span>
            <Icon icon="lucide:chevron-right" class="chev" aria-hidden="true" />
          </RouterLink>
        </li>
      </template>
      <template v-else>
        <li v-for="c in creators" :key="c.id">
          <RouterLink :to="to({ id: c.id })" class="row">
            <strong>{{ c.handle }}</strong>
            <PBadge :icon="platformIcon(c.platform)">{{ platformLabel(c.platform) }}</PBadge>
            <PBadge>{{ c.category }}</PBadge>
            <span class="muted p-xs p-num">{{ count(c.followers) }} · {{ pct(c.engagementRate) }}</span>
            <Icon icon="lucide:chevron-right" class="chev" aria-hidden="true" />
          </RouterLink>
        </li>
      </template>
    </ul>

    <!-- B: card grid -->
    <ul v-else-if="variant === 'B'" class="grid">
      <template v-if="isAdv">
        <li v-for="a in advertisers" :key="a.id">
          <RouterLink :to="to({ id: a.id })" class="card tile">
            <span class="avatar">{{ initials(a.name) }}</span>
            <strong>{{ a.name }}</strong>
            <PBadge v-if="a.openCount" icon="lucide:clock">{{ a.openCount }} open</PBadge>
            <PBadge v-else tone="muted">No open Campaigns</PBadge>
          </RouterLink>
        </li>
      </template>
      <template v-else>
        <li v-for="c in creators" :key="c.id">
          <RouterLink :to="to({ id: c.id })" class="card tile">
            <span class="avatar">{{ initials(c.handle) }}</span>
            <strong>{{ c.handle }}</strong>
            <span class="p-row">
              <PBadge :icon="platformIcon(c.platform)">{{ platformLabel(c.platform) }}</PBadge>
              <PBadge>{{ c.category }}</PBadge>
            </span>
            <span class="muted p-xs p-num"><Icon icon="lucide:users" aria-hidden="true" /> {{ count(c.followers) }} · <Icon icon="lucide:heart" aria-hidden="true" /> {{ pct(c.engagementRate) }}</span>
          </RouterLink>
        </li>
      </template>
    </ul>

    <!-- C: dense table -->
    <table v-else class="p-table">
      <thead v-if="isAdv">
        <tr><th>Name</th><th class="num">Open Campaigns</th></tr>
      </thead>
      <thead v-else>
        <tr><th>Handle</th><th>Platform</th><th>Category</th><th class="num">Followers</th><th class="num">Engagement</th></tr>
      </thead>
      <tbody v-if="isAdv">
        <tr v-for="a in advertisers" :key="a.id">
          <td><RouterLink :to="to({ id: a.id })"><strong>{{ a.name }}</strong></RouterLink></td>
          <td class="num">
            {{ a.openCount || '—' }}
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr v-for="c in creators" :key="c.id">
          <td><RouterLink :to="to({ id: c.id })"><strong>{{ c.handle }}</strong></RouterLink></td>
          <td><Icon :icon="platformIcon(c.platform)" :aria-label="platformLabel(c.platform)" /></td>
          <td><PBadge>{{ c.category }}</PBadge></td>
          <td class="num">
            {{ count(c.followers) }}
          </td>
          <td class="num">
            {{ pct(c.engagementRate) }}
          </td>
        </tr>
      </tbody>
    </table>

    <PNewDialog ref="dialog" :kind="hub" />
  </section>
</template>

<style scoped>
.hub { max-inline-size: 56rem; }
.head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); }
.rows { list-style: none; padding: 0; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
.rows li + li { border-top: 1px solid var(--color-border-subtle); }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); color: inherit; text-decoration: none; }
.row:hover { background: var(--color-bg-surface-hover); }
.chev { margin-inline-start: auto; color: var(--color-text-muted); }
.grid { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: var(--space-md); }
.tile { display: grid; gap: var(--space-xs); justify-items: start; color: inherit; text-decoration: none; }
.tile:hover { border-color: var(--color-border-default); }
.avatar { display: grid; place-items: center; inline-size: 2.5rem; block-size: 2.5rem; border-radius: var(--radius-full); background: var(--color-bg-surface-raised); font-weight: var(--font-weight-bold); color: var(--color-text-secondary); }
.p-table a { color: inherit; }
</style>
