<script setup lang="ts">
type LegalSection = {
  title: string
  body: string
}

const { t, tm } = useI18n()

const sections = computed(() => tm('legal.impressum.sections') as LegalSection[])

useHead(() => ({
  title: `${t('legal.impressum.title')} · ${t('app.name')}`
}))
</script>

<template>
  <LegalPage
    :title="t('legal.impressum.title')"
    :intro="t('legal.impressum.intro')"
    :updated-label="t('legal.updatedLabel')"
    :updated-at="t('legal.updatedDate')"
    :note-title="t('legal.impressum.noteTitle')"
    :note-body="t('legal.impressum.noteBody')"
    :sections="sections"
  />
</template>
