<script setup lang="ts">
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

const authLinks = computed(() => [
  {
    label: t('auth.navigation.login'),
    to: '/auth/login'
  },
  {
    label: t('auth.navigation.register'),
    to: '/auth/register'
  }
])

const availableLocales = computed(() =>
  locales.value.map(localeOption => ({
    code: localeOption.code,
    label: localeOption.code.toUpperCase(),
    to: switchLocalePath(localeOption.code)
  }))
)
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,1)_45%,_rgba(6,78,59,0.92)_100%)] text-white">
    <div class="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid w-full gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <section class="flex flex-col justify-between rounded-[2.5rem] border border-white/10 bg-white/6 p-8 backdrop-blur sm:p-10">
          <div>
            <p class="text-xs uppercase tracking-[0.34em] text-emerald-200/80">
              {{ $t('auth.layout.eyebrow') }}
            </p>
            <h1 class="mt-6 max-w-2xl font-serif text-4xl leading-none tracking-tight sm:text-5xl">
              {{ $t('auth.layout.title') }}
            </h1>
            <p class="mt-6 max-w-xl text-base leading-7 text-slate-200">
              {{ $t('auth.layout.description') }}
            </p>
          </div>

          <div class="mt-10 grid gap-4 sm:grid-cols-3">
            <div class="rounded-[1.75rem] border border-white/10 bg-black/10 p-4">
              <p class="text-sm font-semibold text-white">{{ $t('auth.layout.points.privateTitle') }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-300">{{ $t('auth.layout.points.privateBody') }}</p>
            </div>
            <div class="rounded-[1.75rem] border border-white/10 bg-black/10 p-4">
              <p class="text-sm font-semibold text-white">{{ $t('auth.layout.points.secureTitle') }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-300">{{ $t('auth.layout.points.secureBody') }}</p>
            </div>
            <div class="rounded-[1.75rem] border border-white/10 bg-black/10 p-4">
              <p class="text-sm font-semibold text-white">{{ $t('auth.layout.points.fastTitle') }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-300">{{ $t('auth.layout.points.fastBody') }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-[2.5rem] border border-white/70 bg-white p-6 text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.3)] sm:p-8">
          <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
            <nav class="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
              <NuxtLink
                v-for="link in authLinks"
                :key="link.to"
                :to="link.to"
                :class="[
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  route.path === link.to ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
                ]"
              >
                {{ link.label }}
              </NuxtLink>
            </nav>

            <div class="flex items-center gap-2">
              <NuxtLink
                v-for="localeOption in availableLocales"
                :key="localeOption.code"
                :to="localeOption.to"
                :class="[
                  'rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] transition',
                  locale === localeOption.code ? 'bg-slate-950 text-white' : 'border border-slate-200 text-slate-600 hover:text-slate-950'
                ]"
              >
                {{ localeOption.label }}
              </NuxtLink>
            </div>
          </div>

          <slot />
        </section>
      </div>
    </div>
  </div>
</template>
