<script setup lang="ts">
import type { Component } from 'vue'
import { Primitive } from 'reka-ui'

const { as = 'button', variant = 'primary' } = defineProps<{
  as?: string | Component
  variant?: 'primary' | 'secondary' | 'ghost'
}>()
</script>

<template>
  <Primitive
    :as="as"
    :type="as === 'button' ? 'button' : undefined"
    class="btn"
    :class="{ 'btn-secondary': variant === 'secondary', 'btn-ghost': variant === 'ghost' }"
  >
    <slot />
  </Primitive>
</template>
