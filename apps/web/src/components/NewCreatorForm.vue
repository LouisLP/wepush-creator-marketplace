<script setup lang="ts">
import type { Category, Creator, Platform } from '@wepush/contracts'
import { CategorySchema, createCreator, CreateCreatorBodySchema, PlatformSchema } from '@wepush/contracts'
import { reactive, ref } from 'vue'
import { ApiError, call, fieldErrors, messageFor } from '@/api'
import AppField from '@/components/kit/AppField.vue'
import AppNumberField from '@/components/kit/AppNumberField.vue'
import AppSelect from '@/components/kit/AppSelect.vue'
import AppTextInput from '@/components/kit/AppTextInput.vue'
import { formatCategory, formatPlatform } from '@/lib/format.ts'

const emit = defineEmits<{ created: [creator: Creator] }>()

const form = reactive({
  handle: '',
  platform: 'tiktok' as Platform,
  category: 'lifestyle' as Category,
  followers: 10_000 as number | undefined,
  engagementPercent: 4 as number | undefined,
})
const platforms = PlatformSchema.options.map(p => ({ value: p, label: formatPlatform(p) }))
const categories = CategorySchema.options.map(c => ({ value: c, label: formatCategory(c) }))
const errors = ref<Record<string, string>>({})
const formError = ref<string>()
const submitting = ref(false)

async function submit() {
  const parsed = CreateCreatorBodySchema.safeParse({
    handle: form.handle,
    platform: form.platform,
    category: form.category,
    followers: form.followers ?? Number.NaN,
    engagementRate: (form.engagementPercent ?? Number.NaN) / 100,
  })
  if (!parsed.success) {
    errors.value = Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.'), i.message]))
    return
  }
  errors.value = {}
  formError.value = undefined
  submitting.value = true
  try {
    emit('created', await call(createCreator, { body: parsed.data }))
  }
  catch (e) {
    if (!(e instanceof ApiError))
      throw e
    errors.value = fieldErrors(e)
    formError.value = messageFor(e)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <AppField v-slot="f" label="Handle" :error="errors.handle">
      <AppTextInput :id="f.id" v-model="form.handle" name="handle" placeholder="@mia.cooks" required :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
    </AppField>
    <div class="row">
      <AppField v-slot="f" label="Platform">
        <AppSelect :id="f.id" v-model="form.platform" :options="platforms" />
      </AppField>
      <AppField v-slot="f" label="Category">
        <AppSelect :id="f.id" v-model="form.category" :options="categories" />
      </AppField>
    </div>
    <div class="row">
      <AppField v-slot="f" label="Followers" :error="errors.followers">
        <AppNumberField :id="f.id" v-model="form.followers" name="followers" :min="0" :step="1000" :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
      </AppField>
      <AppField v-slot="f" label="Engagement rate (%)" :error="errors.engagementRate">
        <AppNumberField :id="f.id" v-model="form.engagementPercent" name="engagementRate" :min="0" :max="100" :step="0.1" :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
      </AppField>
    </div>
    <p v-if="formError" class="alert" role="alert">
      {{ formError }}
    </p>
    <button class="btn" :disabled="submitting">
      Create creator
    </button>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  gap: var(--space-md);
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--space-sm);
}
</style>
