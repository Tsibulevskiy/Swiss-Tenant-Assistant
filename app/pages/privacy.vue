<script setup lang="ts">
type LegalSection = {
  title: string
  body: string
}

const { t, tm } = useI18n()

const sections = computed(() => tm('legal.privacy.sections') as LegalSection[])

useHead(() => ({
  title: `${t('legal.privacy.title')} · ${t('app.name')}`
}))
</script>

<template>
  <LegalPage
    :title="t('legal.privacy.title')"
    :intro="t('legal.privacy.intro')"
    :updated-label="t('legal.updatedLabel')"
    :updated-at="t('legal.updatedDate')"
    :note-title="t('legal.draftTitle')"
    :note-body="t('legal.draftBody')"
    :sections="sections"
  />
</template>
