<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<template>
  <AppNavbar />
  <main class="content">
    <RouterView />
  </main>
</template>

<style scoped>
.content {
  max-width: 72rem;
  margin-inline: auto;
  padding: var(--space-xl) var(--space-gutter);
}
</style>
