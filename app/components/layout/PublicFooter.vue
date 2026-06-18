<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()

const links = computed(() => [
  {
    label: t('landing.footer.privacy'),
    to: localePath('/privacy')
  },
  {
    label: t('landing.footer.terms'),
    to: localePath('/terms')
  },
  {
    label: t('landing.footer.impressum'),
    to: localePath('/impressum')
  },
  {
    label: t('landing.footer.disclaimerLink'),
    to: localePath('/disclaimer')
  }
])
</script>

<template>
  <footer class="bg-[#F7F8FA]">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="border-t border-[#D9E0E8] pt-8">
        <nav class="flex flex-wrap items-center gap-x-8 gap-y-3">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="text-sm font-medium text-[#4E6279] transition hover:text-[#0A1F44]"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </div>
  </footer>
</template>
