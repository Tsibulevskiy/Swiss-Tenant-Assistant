<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-vue-next'

const props = defineProps<{
  message: string
  tone: 'error' | 'success' | 'info'
}>()

const toneStyles = computed(() => {
  switch (props.tone) {
    case 'error':
      return {
        container: 'border-rose-200 bg-rose-50 text-rose-700',
        icon: AlertCircle
      }
    case 'success':
      return {
        container: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: CheckCircle2
      }
    case 'info':
      return {
        container: 'border-sky-200 bg-sky-50 text-sky-700',
        icon: Info
      }
  }
})
</script>

<template>
  <div :class="['rounded-xl border px-4 py-3', toneStyles.container]">
    <div class="flex items-start gap-3">
      <component :is="toneStyles.icon" class="mt-0.5 h-4 w-4 shrink-0" />
      <p class="min-w-0 flex-1 text-sm leading-6">
        {{ message }}
      </p>
      <X class="h-4 w-4 shrink-0 opacity-60" />
    </div>
  </div>
</template>
