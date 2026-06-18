<script setup lang="ts">
import { ChevronDown, FileCheck2, FileSearch, ReceiptText, ShieldCheck } from 'lucide-vue-next'

const { locale, locales, t } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()
const localeOrder = ['en', 'de', 'fr', 'it']
const logoSrc = '/swiss-tenant-assistant-logo.svg'

const authLinks = computed(() => [
  {
    label: t('auth.navigation.login'),
    to: localePath('/auth/login')
  },
  {
    label: t('auth.navigation.register'),
    to: localePath('/auth/register')
  }
])

const availableLocales = computed(() =>
  [...locales.value]
    .sort((left, right) => localeOrder.indexOf(left.code) - localeOrder.indexOf(right.code))
    .map(localeOption => ({
      code: localeOption.code,
      label: localeOption.code.toUpperCase(),
      to: switchLocalePath(localeOption.code)
    }))
)

const sidebarPoints = computed(() => [
  {
    icon: FileSearch,
    label: t('auth.layout.points.contractBody')
  },
  {
    icon: ReceiptText,
    label: t('auth.layout.points.chargesBody')
  },
  {
    icon: ShieldCheck,
    label: t('auth.layout.points.rightsBody')
  },
  {
    icon: FileCheck2,
    label: t('auth.layout.points.reportsBody')
  }
])

async function handleLocaleSelect(event: Event) {
  const target = event.target as HTMLSelectElement | null
  const nextLocale = target?.value
  const nextPath = availableLocales.value.find(localeOption => localeOption.code === nextLocale)?.to

  if (nextPath) {
    await navigateTo(nextPath)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F7F8FA] text-[#163A5F]">
    <div class="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div class="mb-6">
        <h1 class="font-serif text-[2.25rem] leading-none tracking-tight text-[#0A1F44] sm:text-[2.8rem]">
          {{ t('auth.layout.pageTitle') }}
        </h1>
        <p class="mt-3 text-base text-[#4E6279]">
          {{ t('app.name') }}
        </p>
      </div>

      <div class="overflow-hidden rounded-[2rem] border border-[#D9E0E8] bg-white shadow-[0_18px_45px_rgba(10,31,68,0.08)]">
        <div class="grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <section class="px-5 py-5 sm:px-8 sm:py-8">
            <div class="mb-8 flex items-start justify-between gap-4">
              <NuxtLink :to="localePath('/')" class="min-w-0">
                <img :src="logoSrc" :alt="t('app.name')" class="h-10 w-auto max-w-[11rem]">
              </NuxtLink>

              <label class="relative shrink-0">
                <span class="sr-only">Language</span>
                <select
                  :value="locale"
                  class="h-9 appearance-none rounded-lg border border-[#E6EBF1] bg-white pl-3 pr-8 text-xs font-semibold uppercase tracking-[0.12em] text-[#163A5F] outline-none transition hover:border-[#CBD5E1]"
                  @change="handleLocaleSelect"
                >
                  <option
                    v-for="localeOption in availableLocales"
                    :key="localeOption.code"
                    :value="localeOption.code"
                  >
                    {{ localeOption.label }}
                  </option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E6279]" />
              </label>
            </div>

            <div class="mb-8 flex flex-wrap gap-2 rounded-xl border border-[#E6EBF1] bg-[#F8FAFC] p-1">
              <NuxtLink
                v-for="link in authLinks"
                :key="link.to"
                :to="link.to"
                :class="[
                  'rounded-[0.65rem] px-4 py-2.5 text-sm font-medium transition',
                  route.path === link.to ? 'bg-[#1E9F47] text-white shadow-[0_8px_16px_rgba(30,159,71,0.18)]' : 'text-[#4E6279] hover:text-[#0A1F44]'
                ]"
              >
                {{ link.label }}
              </NuxtLink>
            </div>

            <slot />
          </section>

          <aside class="border-t border-[#E6EBF1] bg-[#FCFDFC] px-6 py-8 sm:px-8 lg:border-l lg:border-t-0">
            <div class="flex h-full flex-col">
              <div class="flex h-full flex-col rounded-[2rem] border border-[#E5EEE8] bg-[radial-gradient(circle_at_top,rgba(240,248,243,1)_0%,rgba(251,253,252,1)_42%,rgba(247,251,248,1)_100%)] px-6 py-8">
                <div class="relative flex min-h-[260px] items-center justify-center">
                  <img
                    src="/auth-illustration.svg"
                    alt=""
                    class="h-auto w-full max-w-[290px] object-contain"
                  >
                </div>

                <div class="mt-10 space-y-4 px-1">
                  <div
                    v-for="point in sidebarPoints"
                    :key="point.label"
                    class="flex items-center gap-3 text-[#163A5F]"
                  >
                    <div class="flex h-6 w-6 shrink-0 items-center justify-center text-[#1E9F47]">
                      <component :is="point.icon" class="h-4 w-4" />
                    </div>
                    <p class="text-[15px] font-medium leading-6 text-[#17324D]">
                      {{ point.label }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-auto pt-8">
                <p class="text-sm font-semibold text-[#0A1F44]">
                  {{ t('auth.layout.footerTitle') }}
                </p>
                <p class="mt-1 text-sm leading-6 text-[#4E6279]">
                  {{ t('auth.layout.footerBody') }}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>
