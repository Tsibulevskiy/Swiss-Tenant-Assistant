<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
      {{ eyebrow }}
    </p>
    <h1 class="mt-4 text-[2rem] font-semibold tracking-tight text-slate-950">
      {{ title }}
    </h1>
    <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
      {{ description }}
    </p>

    <div class="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-8">
      <p class="text-sm font-medium text-slate-700">
        {{ title }}
      </p>
      <p class="mt-2 text-sm leading-6 text-slate-500">
        {{ description }}
      </p>
    </div>
  </section>
</template>
