<script setup lang="ts">
type LegalSection = {
  title: string
  body: string
}

const { t, tm } = useI18n()

const sections = computed(() => tm('legal.disclaimer.sections') as LegalSection[])

useHead(() => ({
  title: `${t('legal.disclaimer.title')} · ${t('app.name')}`
}))
</script>

<template>
  <LegalPage
    :title="t('legal.disclaimer.title')"
    :intro="t('legal.disclaimer.intro')"
    :updated-label="t('legal.updatedLabel')"
    :updated-at="t('legal.updatedDate')"
    :note-title="t('legal.draftTitle')"
    :note-body="t('legal.draftBody')"
    :sections="sections"
  />
</template>
