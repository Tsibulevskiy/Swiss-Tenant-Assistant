<script setup lang="ts">
import PublicFooter from '~/components/layout/PublicFooter.vue'
</script>

<template>
  <div class="min-h-screen bg-[#F7F8FA] text-[#163A5F]">
    <slot />
    <PublicFooter />
  </div>
</template>
