<script setup lang="ts">
import type { Category, Creator, Platform } from '@wepush/contracts'
import { CategorySchema, createCreator, CreateCreatorBodySchema, PlatformSchema } from '@wepush/contracts'
import { reactive, ref } from 'vue'
import { ApiError, call, fieldErrors, messageFor } from '@/api'

const emit = defineEmits<{ created: [creator: Creator] }>()

const form = reactive({
  handle: '',
  platform: 'tiktok' as Platform,
  category: 'lifestyle' as Category,
  followers: 10_000,
  engagementPercent: 4,
})
const errors = ref<Record<string, string>>({})
const formError = ref<string>()
const submitting = ref(false)

async function submit() {
  const parsed = CreateCreatorBodySchema.safeParse({
    handle: form.handle,
    platform: form.platform,
    category: form.category,
    followers: form.followers,
    engagementRate: form.engagementPercent / 100,
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
    <label class="field">
      <span>Handle</span>
      <input v-model="form.handle" name="handle" placeholder="@mia.cooks" required>
      <small v-if="errors.handle" class="field-error">{{ errors.handle }}</small>
    </label>
    <div class="row">
      <label class="field">
        <span>Platform</span>
        <select v-model="form.platform" name="platform">
          <option v-for="p in PlatformSchema.options" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>
      <label class="field">
        <span>Category</span>
        <select v-model="form.category" name="category">
          <option v-for="c in CategorySchema.options" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
    </div>
    <div class="row">
      <label class="field">
        <span>Followers</span>
        <input v-model.number="form.followers" name="followers" type="number" min="0" step="1">
        <small v-if="errors.followers" class="field-error">{{ errors.followers }}</small>
      </label>
      <label class="field">
        <span>Engagement rate (%)</span>
        <input v-model.number="form.engagementPercent" name="engagementRate" type="number" min="0" max="100" step="0.1">
        <small v-if="errors.engagementRate" class="field-error">{{ errors.engagementRate }}</small>
      </label>
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
  gap: var(--space-sm);
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--space-sm);
}
</style>
