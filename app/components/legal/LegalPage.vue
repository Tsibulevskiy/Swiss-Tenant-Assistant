<script setup lang="ts">
type LegalSection = {
  title: string
  body: string
}

defineProps<{
  title: string
  intro: string
  updatedLabel: string
  updatedAt: string
  noteTitle: string
  noteBody: string
  sections: LegalSection[]
}>()
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
    <div class="overflow-hidden rounded-[1.5rem] border border-[#D9E0E8] bg-white shadow-[0_10px_30px_rgba(10,31,68,0.05)]">
      <div class="border-b border-[#E6EBF1] px-5 py-5 sm:px-8 sm:py-7">
        <div class="flex flex-col gap-3 sm:gap-4">
          <p class="text-sm font-medium uppercase tracking-[0.08em] text-[#4E6279]">
            {{ updatedLabel }} {{ updatedAt }}
          </p>
          <h1 class="font-serif text-[2.2rem] leading-[0.98] tracking-tight text-[#0A1F44] sm:text-[3.25rem]">
            {{ title }}
          </h1>
          <p class="max-w-3xl text-[15px] leading-7 text-[#4E6279] sm:text-lg">
            {{ intro }}
          </p>
        </div>
      </div>

      <div class="grid gap-8 px-5 py-6 sm:px-8 sm:py-8">
        <div class="border border-[#E6EBF1] bg-[#F8FAFC] px-4 py-4 sm:px-5">
          <p class="text-sm font-semibold text-[#163A5F]">
            {{ noteTitle }}
          </p>
          <p class="mt-2 text-sm leading-6 text-[#4E6279]">
            {{ noteBody }}
          </p>
        </div>

        <div class="grid gap-6">
          <article
            v-for="section in sections"
            :key="section.title"
            class="border-b border-[#E6EBF1] pb-6 last:border-b-0 last:pb-0"
          >
            <h2 class="text-xl font-semibold text-[#0A1F44]">
              {{ section.title }}
            </h2>
            <p class="mt-3 max-w-3xl text-[15px] leading-7 text-[#4E6279]">
              {{ section.body }}
            </p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
