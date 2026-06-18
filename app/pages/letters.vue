<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const { t } = useI18n()
</script>

<template>
  <SectionPlaceholder
    :eyebrow="t('dashboardPages.letters.eyebrow')"
    :title="t('dashboardPages.letters.title')"
    :description="t('dashboardPages.letters.description')"
  />
</template>
