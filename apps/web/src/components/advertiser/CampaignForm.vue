<script setup lang="ts">
import type { AdvertiserCampaignSummary, CampaignPreviewBody, Category, Platform } from '@wepush/contracts'
import { CAMPAIGN_LIMITS, CategorySchema, createCampaign, CreateCampaignBodySchema, PLATFORM_BENCHMARKS, PlatformSchema } from '@wepush/contracts'
import { computed, reactive, ref } from 'vue'
import { ApiError, call, fieldErrors, formErrorFor } from '@/api'
import AppCheckboxGroup from '@/components/kit/AppCheckboxGroup.vue'
import AppField from '@/components/kit/AppField.vue'
import AppNumberField from '@/components/kit/AppNumberField.vue'
import AppSelect from '@/components/kit/AppSelect.vue'
import AppTextarea from '@/components/kit/AppTextarea.vue'
import AppTextInput from '@/components/kit/AppTextInput.vue'
import { useCampaignPreview } from '@/composables/useCampaignPreview.ts'
import { formatCategory, formatCents, formatPlatform } from '@/lib/format.ts'
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

const toCents = (dollars: number | undefined) => (dollars === undefined ? Number.NaN : Math.round(dollars * 100))
const money = { minimumFractionDigits: 0, maximumFractionDigits: 2 }

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
  minFollowers: 10_000 as number | undefined,
  minEngagementPercent: undefined as number | undefined,
  budget: 1_000 as number | undefined,
  targetCpm: 10 as number | undefined,
  deadline: toLocalInput(new Date(Math.ceil((now.value + 72 * HOUR_MS) / HOUR_MS) * HOUR_MS)),
})
const platforms = PlatformSchema.options.map(p => ({ value: p, label: formatPlatform(p) }))
const categories = CategorySchema.options.map(c => ({ value: c, label: formatCategory(c) }))
const errors = ref<Record<string, string>>({})
const formError = ref<string>()
const submitting = ref(false)

const terms = computed<CampaignPreviewBody>(() => ({
  platform: form.platform,
  categories: [...form.categories],
  minFollowers: form.minFollowers ?? Number.NaN,
  minEngagementRate: form.minEngagementPercent === undefined ? null : form.minEngagementPercent / 100,
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
const cpmFieldHint = computed(() => `Typical ${formatPlatform(form.platform)} range ${formatCents(cpmRange.value.low)}–${formatCents(cpmRange.value.high)}. ${cpmHint.value}`)

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
        <AppField v-slot="f" label="Title" :error="errors.title">
          <AppTextInput :id="f.id" v-model="form.title" name="title" :maxlength="CAMPAIGN_LIMITS.titleMaxLength" required :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
        </AppField>
        <AppField v-slot="f" label="Brief (shown to Creators)" :error="errors.brief">
          <AppTextarea :id="f.id" v-model="form.brief" name="brief" rows="5" :maxlength="CAMPAIGN_LIMITS.briefMaxLength" required :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
        </AppField>
      </fieldset>

      <fieldset>
        <legend>Requirements</legend>
        <p class="muted hint">
          Only Creators meeting all of these see the Campaign.
        </p>
        <AppField v-slot="f" label="Platform">
          <AppSelect :id="f.id" v-model="form.platform" :options="platforms" />
        </AppField>
        <AppField label="Categories" as="fieldset" :error="errors.categories">
          <AppCheckboxGroup v-model="form.categories" :options="categories" />
        </AppField>
        <div class="row">
          <AppField v-slot="f" label="Min followers" :error="errors.minFollowers">
            <AppNumberField :id="f.id" v-model="form.minFollowers" name="minFollowers" :min="0" :max="CAMPAIGN_LIMITS.minFollowersMax" :step="1000" :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
          </AppField>
          <AppField v-slot="f" label="Min engagement rate (%, optional)" :error="errors.minEngagementRate">
            <AppNumberField :id="f.id" v-model="form.minEngagementPercent" name="minEngagementRate" :min="0" :max="100" :step="0.1" :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
          </AppField>
        </div>
      </fieldset>

      <fieldset>
        <legend>Money & time</legend>
        <div class="row">
          <AppField v-slot="f" label="Budget (USD)" :error="errors.budgetCents">
            <AppNumberField :id="f.id" v-model="form.budget" name="budget" :min="0" :step="100" :format-options="money" :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
          </AppField>
          <AppField v-slot="f" label="Target CPM (USD)" :error="errors.targetCpmCents" :hint="cpmFieldHint">
            <AppNumberField :id="f.id" v-model="form.targetCpm" name="targetCpm" :min="0" :step="0.5" :format-options="money" :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
          </AppField>
        </div>
        <AppField v-slot="f" label="Bidding Deadline" :error="errors.biddingDeadline">
          <AppTextInput :id="f.id" v-model="form.deadline" name="biddingDeadline" type="datetime-local" :min="deadlineBounds.min" :max="deadlineBounds.max" :aria-describedby="f.describedby" :aria-invalid="f.invalid" @focus="now = Date.now()" />
        </AppField>
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

.fields > fieldset {
  display: grid;
  gap: var(--space-md);
  padding: var(--space-lg);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.fields > fieldset > legend {
  padding-inline: var(--space-2xs);
  font-weight: var(--font-weight-semibold);
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-md);
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
