<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const { t } = useI18n()
</script>

<template>
  <SectionPlaceholder
    :eyebrow="t('dashboardPages.support.eyebrow')"
    :title="t('dashboardPages.support.title')"
    :description="t('dashboardPages.support.description')"
  />
</template>
