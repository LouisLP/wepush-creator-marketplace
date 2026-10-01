<script setup lang="ts">
import type { CampaignPreview } from '@wepush/contracts'
import { formatCents } from '@/lib/format.ts'

defineProps<{
  preview: CampaignPreview | undefined
  error: string | undefined
  incomplete: boolean
  loading: boolean
}>()
</script>

<template>
  <section class="preview" aria-labelledby="preview-heading" aria-live="polite" :aria-busy="loading">
    <h2 id="preview-heading">
      Preview
    </h2>
    <p v-if="incomplete" class="muted">
      Fix the Requirements and money fields to see who this reaches.
    </p>
    <p v-else-if="error" class="alert" role="alert">
      {{ error }}
    </p>
    <template v-else-if="preview">
      <p v-if="!preview.suggestedFees" class="field-error">
        No Creators match these Requirements. Loosen them to reach someone.
      </p>
      <template v-else>
        <p class="headline">
          <strong>{{ preview.matchingCreators }}</strong>
          {{ preview.matchingCreators === 1 ? 'Creator matches' : 'Creators match' }}
        </p>
        <dl>
          <div>
            <dt>Suggested Fees</dt>
            <dd>{{ formatCents(preview.suggestedFees.minCents) }} – {{ formatCents(preview.suggestedFees.maxCents) }}</dd>
          </div>
          <div>
            <dt>Median</dt>
            <dd>{{ formatCents(preview.suggestedFees.medianCents) }}</dd>
          </div>
          <div>
            <dt>Budget buys</dt>
            <dd>≈ {{ preview.postsAtMedian }} {{ preview.postsAtMedian === 1 ? 'Post' : 'Posts' }} at the median</dd>
          </div>
        </dl>
      </template>
    </template>
  </section>
</template>

<style scoped>
.preview {
  display: grid;
  gap: var(--space-sm);
}

h2 {
  font-size: var(--font-size-lg);
}

.headline strong {
  font-size: var(--font-size-2xl);
}

dl {
  display: grid;
  gap: var(--space-xs);
}

dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
}

dt {
  color: var(--color-text-muted);
}

dd {
  font-weight: var(--font-weight-semibold);
  text-align: end;
}
</style>
