<script setup lang="ts">
import type { Platform } from '@wepush/contracts'
import IconInstagram from '~icons/lucide/instagram'
import IconMusic from '~icons/lucide/music-2'
import { formatPlatform } from '@/lib/format.ts'

defineProps<{ platform: Platform }>()

// Lucide ships no TikTok glyph
const ICONS = { instagram: IconInstagram, tiktok: IconMusic }
</script>

<template>
  <component :is="ICONS[platform]" role="img" :aria-label="formatPlatform(platform)" />
</template>
