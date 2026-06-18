<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const { t } = useI18n()
</script>

<template>
  <SectionPlaceholder
    :eyebrow="t('dashboardPages.payments.eyebrow')"
    :title="t('dashboardPages.payments.title')"
    :description="t('dashboardPages.payments.description')"
  />
</template>
