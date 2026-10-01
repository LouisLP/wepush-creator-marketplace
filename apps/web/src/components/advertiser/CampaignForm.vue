<script setup lang="ts">
import type { AdvertiserCampaignSummary, CampaignPreviewBody, Category, Platform } from '@wepush/contracts'
import { CAMPAIGN_LIMITS, CategorySchema, createCampaign, CreateCampaignBodySchema, PLATFORM_BENCHMARKS, PlatformSchema } from '@wepush/contracts'
import { computed, reactive, ref } from 'vue'
import { ApiError, call, fieldErrors, formErrorFor } from '@/api'
import { useCampaignPreview } from '@/composables/useCampaignPreview.ts'
import { formatCents, formatPlatform } from '@/lib/format.ts'
import CampaignPreviewCard from './CampaignPreviewCard.vue'

const emit = defineEmits<{ created: [campaign: AdvertiserCampaignSummary] }>()

const HOUR_MS = 3_600_000

/** `datetime-local` value in the browser's time zone. */
function toLocalInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function toIso(local: string) {
  const date = new Date(local)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

const toCents = (dollars: number | '') => (dollars === '' ? Number.NaN : Math.round(dollars * 100))

const now = ref(Date.now())
const deadlineBounds = computed(() => ({
  min: toLocalInput(new Date(now.value + CAMPAIGN_LIMITS.biddingWindowMs.min)),
  max: toLocalInput(new Date(now.value + CAMPAIGN_LIMITS.biddingWindowMs.max)),
}))

const form = reactive({
  title: '',
  brief: '',
  platform: 'tiktok' as Platform,
  categories: [] as Category[],
  minFollowers: 10_000 as number | '',
  minEngagementPercent: '' as number | '',
  budget: 1_000 as number | '',
  targetCpm: 10 as number | '',
  deadline: toLocalInput(new Date(Math.ceil((now.value + 72 * HOUR_MS) / HOUR_MS) * HOUR_MS)),
})
const errors = ref<Record<string, string>>({})
const formError = ref<string>()
const submitting = ref(false)

const terms = computed<CampaignPreviewBody>(() => ({
  platform: form.platform,
  categories: [...form.categories],
  minFollowers: form.minFollowers === '' ? Number.NaN : form.minFollowers,
  minEngagementRate: form.minEngagementPercent === '' ? null : form.minEngagementPercent / 100,
  budgetCents: toCents(form.budget),
  targetCpmCents: toCents(form.targetCpm),
}))
const preview = reactive(useCampaignPreview(terms))

const cpmRange = computed(() => PLATFORM_BENCHMARKS[form.platform].cpmRangeCents)
const cpmHint = computed(() => {
  const target = terms.value.targetCpmCents
  if (target < cpmRange.value.low)
    return 'Below the typical range: Creators will rank this Campaign low.'
  if (target > cpmRange.value.high)
    return 'Above the typical range: you’ll likely overpay for views.'
  return 'Lower means cheaper views, but Creators rank you lower.'
})

async function submit() {
  const parsed = CreateCampaignBodySchema.safeParse({
    ...terms.value,
    title: form.title,
    brief: form.brief,
    biddingDeadline: toIso(form.deadline),
  })
  if (!parsed.success) {
    errors.value = Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.'), i.message]))
    return
  }
  errors.value = {}
  formError.value = undefined
  submitting.value = true
  try {
    emit('created', await call(createCampaign, { body: parsed.data }))
  }
  catch (e) {
    if (!(e instanceof ApiError))
      throw e
    errors.value = fieldErrors(e)
    formError.value = formErrorFor(e)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <div class="fields">
      <fieldset>
        <legend>What</legend>
        <label class="field">
          <span>Title</span>
          <input v-model="form.title" name="title" :maxlength="CAMPAIGN_LIMITS.titleMaxLength" required>
          <small v-if="errors.title" class="field-error">{{ errors.title }}</small>
        </label>
        <label class="field">
          <span>Brief (shown to Creators)</span>
          <textarea v-model="form.brief" name="brief" rows="5" :maxlength="CAMPAIGN_LIMITS.briefMaxLength" required />
          <small v-if="errors.brief" class="field-error">{{ errors.brief }}</small>
        </label>
      </fieldset>

      <fieldset>
        <legend>Requirements</legend>
        <p class="muted hint">
          Only Creators meeting all of these see the Campaign.
        </p>
        <label class="field">
          <span>Platform</span>
          <select v-model="form.platform" name="platform">
            <option v-for="p in PlatformSchema.options" :key="p" :value="p">{{ formatPlatform(p) }}</option>
          </select>
        </label>
        <fieldset class="field categories">
          <legend>Categories</legend>
          <div class="chips">
            <label v-for="c in CategorySchema.options" :key="c">
              <input v-model="form.categories" type="checkbox" name="categories" :value="c"> {{ c }}
            </label>
          </div>
          <small v-if="errors.categories" class="field-error">{{ errors.categories }}</small>
        </fieldset>
        <div class="row">
          <label class="field">
            <span>Min followers</span>
            <input v-model.number="form.minFollowers" name="minFollowers" type="number" min="0" :max="CAMPAIGN_LIMITS.minFollowersMax" step="1">
            <small v-if="errors.minFollowers" class="field-error">{{ errors.minFollowers }}</small>
          </label>
          <label class="field">
            <span>Min engagement rate (%, optional)</span>
            <input v-model.number="form.minEngagementPercent" name="minEngagementRate" type="number" min="0" max="100" step="0.1">
            <small v-if="errors.minEngagementRate" class="field-error">{{ errors.minEngagementRate }}</small>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Money & time</legend>
        <div class="row">
          <label class="field">
            <span>Budget (USD)</span>
            <input v-model.number="form.budget" name="budget" type="number" :min="CAMPAIGN_LIMITS.budgetCents.min / 100" step="1">
            <small v-if="errors.budgetCents" class="field-error">{{ errors.budgetCents }}</small>
          </label>
          <label class="field">
            <span>Target CPM (USD)</span>
            <input v-model.number="form.targetCpm" name="targetCpm" type="number" :min="CAMPAIGN_LIMITS.targetCpmCents.min / 100" step="0.5" aria-describedby="cpm-hint">
            <small v-if="errors.targetCpmCents" class="field-error">{{ errors.targetCpmCents }}</small>
            <small id="cpm-hint" class="muted">
              Typical {{ formatPlatform(form.platform) }} range {{ formatCents(cpmRange.low) }}–{{ formatCents(cpmRange.high) }}. {{ cpmHint }}
            </small>
          </label>
        </div>
        <label class="field">
          <span>Bidding Deadline</span>
          <input v-model="form.deadline" name="biddingDeadline" type="datetime-local" :min="deadlineBounds.min" :max="deadlineBounds.max" @focus="now = Date.now()">
          <small v-if="errors.biddingDeadline" class="field-error">{{ errors.biddingDeadline }}</small>
        </label>
      </fieldset>
    </div>

    <aside class="card sidebar">
      <CampaignPreviewCard v-bind="preview" />
      <p class="muted note">
        Terms are final once created. Winners are picked automatically at the Bidding Deadline, within the Budget, and you can’t veto them.
      </p>
      <p v-if="formError" class="alert" role="alert">
        {{ formError }}
      </p>
      <button class="btn" :disabled="submitting">
        Create Campaign
      </button>
    </aside>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: var(--space-lg);
  align-items: start;
}

.fields {
  display: grid;
  gap: var(--space-md);
}

fieldset {
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

legend {
  padding-inline: var(--space-2xs);
  font-weight: var(--font-weight-semibold);
}

.categories {
  padding: 0;
  border: none;
}

.categories legend {
  padding: 0;
  margin-block-end: var(--space-2xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: inherit;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-md);
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-sm);
}

textarea {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-canvas);
  color: var(--color-text-primary);
  resize: vertical;
}

.hint,
.note {
  font-size: var(--font-size-sm);
}

.sidebar {
  position: sticky;
  top: var(--space-md);
  display: grid;
  gap: var(--space-md);
}

@media (width < 64rem) {
  .form {
    grid-template-columns: minmax(0, 1fr);
  }

  .sidebar {
    position: static;
  }
}
</style>
