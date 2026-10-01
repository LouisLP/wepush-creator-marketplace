<script setup lang="ts">
import { getCreatorProfile } from '@wepush/contracts'
import { call } from '@/api'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCount, formatPercent } from '@/lib/format.ts'

const profile = useRequest(() => call(getCreatorProfile))
</script>

<template>
  <section class="page" aria-labelledby="profile-heading">
    <h1 id="profile-heading">
      Your profile
    </h1>
    <p v-if="profile.error.value" class="alert" role="alert">
      {{ profile.error.value }}
    </p>
    <dl v-else-if="profile.data.value" class="card stats">
      <div><dt>Handle</dt><dd>{{ profile.data.value.handle }}</dd></div>
      <div><dt>Platform</dt><dd>{{ profile.data.value.platform }}</dd></div>
      <div><dt>Category</dt><dd>{{ profile.data.value.category }}</dd></div>
      <div><dt>Followers</dt><dd>{{ formatCount(profile.data.value.followers) }}</dd></div>
      <div><dt>Engagement</dt><dd>{{ formatPercent(profile.data.value.engagementRate) }}</dd></div>
    </dl>
    <p class="muted">
      Pick a Matched Campaign to review its Brief, Requirements and your Fee Quote.
    </p>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-md);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--space-md);
}

dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

dd {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}
</style>
