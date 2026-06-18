<script setup lang="ts">
const auth = useAuth()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale, locales, t } = useI18n()
const localeOrder = ['en', 'de', 'fr', 'it']

const availableLocales = computed(() =>
  [...locales.value]
    .sort((left, right) => localeOrder.indexOf(left.code) - localeOrder.indexOf(right.code))
    .map(localeOption => ({
      code: localeOption.code,
      label: localeOption.code.toUpperCase(),
      to: switchLocalePath(localeOption.code)
    }))
)

const logoSrc = '/swiss-tenant-assistant-logo.svg'

const primaryAction = computed(() =>
  auth.user.value
    ? {
        label: t('landing.header.openDashboard'),
        to: localePath('/dashboard')
      }
    : {
        label: t('landing.header.startNow'),
        to: localePath('/auth/register')
      }
)

const secondaryAction = computed(() =>
  auth.user.value
    ? {
        label: t('landing.header.account'),
        to: localePath('/dashboard')
      }
    : {
        label: t('landing.header.signIn'),
        to: localePath('/auth/login')
      }
)
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-[#D9E0E8] bg-[rgba(247,248,250,0.88)] backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <NuxtLink :to="localePath('/')" class="min-w-0">
        <img :src="logoSrc" :alt="t('app.name')" class="h-14 w-auto max-w-[22rem] shrink-0">
      </NuxtLink>

      <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div class="hidden items-center text-xs font-semibold uppercase tracking-[0.24em] sm:flex">
          <template v-for="(localeOption, index) in availableLocales" :key="localeOption.code">
            <NuxtLink
              :to="localeOption.to"
              :class="[
                'transition',
                locale === localeOption.code ? 'text-[#0A1F44] underline underline-offset-4' : 'text-[#4E6279] hover:text-[#0A1F44]'
              ]"
            >
              {{ localeOption.label }}
            </NuxtLink>
            <span v-if="index < availableLocales.length - 1" class="px-2 text-[#7B8A9B]">|</span>
          </template>
        </div>

        <NuxtLink
          :to="secondaryAction.to"
          class="rounded-full border border-[#D9E0E8] bg-white px-4 py-2 text-sm font-medium text-[#163A5F] transition hover:border-[#0A1F44] hover:text-[#0A1F44]"
        >
          {{ secondaryAction.label }}
        </NuxtLink>

        <NuxtLink
          :to="primaryAction.to"
          class="rounded-full bg-[#D52B1E] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#B52116]"
        >
          {{ primaryAction.label }}
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
