<script setup lang="ts">
import type { Advertiser, Creator } from '@wepush/contracts'
import type { Role } from '@/api/client.ts'
import type { Identity } from '@/stores/identity.ts'
import { listAdvertisers, listCreators } from '@wepush/contracts'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { call } from '@/api'
import NewAdvertiserForm from '@/components/NewAdvertiserForm.vue'
import NewCreatorForm from '@/components/NewCreatorForm.vue'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCount, formatPercent } from '@/lib/format.ts'
import { useIdentityStore } from '@/stores/identity.ts'

const route = useRoute()
const router = useRouter()
const identity = useIdentityStore()

const requestedRole = computed(() => route.query.role as Role | undefined)
const advertisers = useRequest(() => call(listAdvertisers))
const creators = useRequest(() => call(listCreators))
const creating = ref<Role | null>(null)

function actAs(role: Role, who: Identity) {
  identity.set(role, who)
  const redirect = route.query.redirect as string | undefined
  void router.push(redirect?.startsWith(`/${role}`) ? redirect : `/${role}`)
}

const pickAdvertiser = (a: Advertiser) => actAs('advertiser', { id: a.id, name: a.name })
const pickCreator = (c: Creator) => actAs('creator', { id: c.id, name: c.handle })
</script>

<template>
  <main class="picker">
    <header>
      <h1>WePush</h1>
      <p class="muted">
        No sign-in here. Choose who you’re acting as — you can switch any time.
      </p>
    </header>

    <div class="columns">
      <section class="card" :class="{ requested: requestedRole === 'advertiser' }" aria-labelledby="advertisers-heading">
        <h2 id="advertisers-heading">
          Advertiser
        </h2>
        <p class="muted">
          Run campaigns and review creator bids.
        </p>
        <p v-if="advertisers.error.value" class="alert" role="alert">
          {{ advertisers.error.value }}
        </p>
        <ul v-else class="identities">
          <li v-for="a in advertisers.data.value?.items" :key="a.id">
            <button class="btn btn-ghost identity" @click="pickAdvertiser(a)">
              {{ a.name }}
            </button>
          </li>
        </ul>
        <NewAdvertiserForm v-if="creating === 'advertiser'" @created="pickAdvertiser" />
        <button v-else class="btn" @click="creating = 'advertiser'">
          New advertiser…
        </button>
      </section>

      <section class="card" :class="{ requested: requestedRole === 'creator' }" aria-labelledby="creators-heading">
        <h2 id="creators-heading">
          Creator
        </h2>
        <p class="muted">
          Find matching campaigns and place bids.
        </p>
        <p v-if="creators.error.value" class="alert" role="alert">
          {{ creators.error.value }}
        </p>
        <ul v-else class="identities">
          <li v-for="c in creators.data.value?.items" :key="c.id">
            <button class="btn btn-ghost identity" @click="pickCreator(c)">
              <span>{{ c.handle }}</span>
              <small class="muted">{{ c.platform }} · {{ c.category }} · {{ formatCount(c.followers) }} · {{ formatPercent(c.engagementRate) }}</small>
            </button>
          </li>
        </ul>
        <NewCreatorForm v-if="creating === 'creator'" @created="pickCreator" />
        <button v-else class="btn" @click="creating = 'creator'">
          New creator…
        </button>
      </section>
    </div>
  </main>
</template>

<style scoped>
.picker {
  display: grid;
  gap: var(--space-xl);
  max-width: 60rem;
  margin-inline: auto;
  padding: var(--space-section) var(--space-gutter);
}

.columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: var(--space-lg);
  align-items: start;
}

.card {
  display: grid;
  gap: var(--space-md);
}

.requested {
  border-color: var(--color-accent-default);
}

.identities {
  display: grid;
  gap: var(--space-xs);
  padding: 0;
  list-style: none;
}

.identity {
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
}
</style>
