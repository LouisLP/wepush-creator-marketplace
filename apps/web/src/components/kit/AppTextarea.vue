<script setup lang="ts">
const model = defineModel<string>({ default: '' })
</script>

<template>
  <textarea v-model="model" class="control textarea" />
</template>

<style scoped>
.textarea {
  display: block;
  resize: vertical;
}
</style>
