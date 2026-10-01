<script setup lang="ts">
import type { Advertiser } from '@wepush/contracts'
import { createAdvertiser, CreateAdvertiserBodySchema } from '@wepush/contracts'
import { ref } from 'vue'
import { ApiError, call, fieldErrors, messageFor } from '@/api'
import AppField from '@/components/kit/AppField.vue'
import AppTextInput from '@/components/kit/AppTextInput.vue'

const emit = defineEmits<{ created: [advertiser: Advertiser] }>()

const name = ref('')
const errors = ref<Record<string, string>>({})
const formError = ref<string>()
const submitting = ref(false)

async function submit() {
  const parsed = CreateAdvertiserBodySchema.safeParse({ name: name.value })
  if (!parsed.success) {
    errors.value = Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.'), i.message]))
    return
  }
  errors.value = {}
  formError.value = undefined
  submitting.value = true
  try {
    emit('created', await call(createAdvertiser, { body: parsed.data }))
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
    <AppField v-slot="f" label="Brand name" :error="errors.name">
      <AppTextInput :id="f.id" v-model="name" name="name" autocomplete="organization" required :aria-describedby="f.describedby" :aria-invalid="f.invalid" />
    </AppField>
    <p v-if="formError" class="alert" role="alert">
      {{ formError }}
    </p>
    <button class="btn" :disabled="submitting">
      Create advertiser
    </button>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  gap: var(--space-md);
}
</style>
