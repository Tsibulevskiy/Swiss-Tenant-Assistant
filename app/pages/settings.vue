<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const { t } = useI18n()
</script>

<template>
  <SectionPlaceholder
    :eyebrow="t('dashboardPages.settings.eyebrow')"
    :title="t('dashboardPages.settings.title')"
    :description="t('dashboardPages.settings.description')"
  />
</template>
