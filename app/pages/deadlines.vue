<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const { t } = useI18n()
</script>

<template>
  <SectionPlaceholder
    :eyebrow="t('dashboardPages.deadlines.eyebrow')"
    :title="t('dashboardPages.deadlines.title')"
    :description="t('dashboardPages.deadlines.description')"
  />
</template>
