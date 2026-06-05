<script setup lang="ts">
const appStore = useAppStore()
const auth = useAuth()
const route = useRoute()
const router = useRouter()
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()

await auth.fetchCurrentUser()

const navigation = computed(() => [
  {
    key: 'dashboard',
    label: t('shell.nav.dashboard'),
    href: '/',
    accent: 'bg-emerald-500',
    enabled: true
  },
  {
    key: 'checks',
    label: t('shell.nav.checks'),
    href: '#',
    accent: 'bg-amber-500',
    enabled: false
  },
  {
    key: 'documents',
    label: t('shell.nav.documents'),
    href: '#',
    accent: 'bg-sky-500',
    enabled: false
  },
  {
    key: 'letters',
    label: t('shell.nav.letters'),
    href: '#',
    accent: 'bg-rose-500',
    enabled: false
  }
])

const availableLocales = computed(() =>
  locales.value.map(localeOption => ({
    code: localeOption.code,
    label: localeOption.code.toUpperCase(),
    to: switchLocalePath(localeOption.code)
  }))
)

async function handleLogout() {
  await auth.logout()
  await router.push('/auth/login')
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(241,245,249,0.9)_35%,_rgba(253,230,138,0.2)_100%)] text-slate-950">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute left-[-12rem] top-[-10rem] h-80 w-80 rounded-full bg-emerald-300/35 blur-3xl" />
      <div class="absolute right-[-8rem] top-20 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div class="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-sky-200/35 blur-3xl" />
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
      <aside
        :class="[
          'fixed inset-y-4 left-4 z-40 w-72 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur transition-transform lg:static lg:translate-x-0',
          appStore.sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'
        ]"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="font-serif text-2xl font-semibold tracking-tight text-slate-950">
              {{ t('app.name') }}
            </p>
            <p class="mt-2 max-w-48 text-sm leading-6 text-slate-600">
              {{ t('shell.sidebar.summary') }}
            </p>
          </div>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 lg:hidden"
            @click="appStore.setSidebarOpen(false)"
          >
            <span class="sr-only">{{ t('shell.actions.closeNavigation') }}</span>
            ×
          </button>
        </div>

        <nav class="mt-8 space-y-2">
          <NuxtLink
            v-for="item in navigation"
            :key="item.key"
            :to="item.href"
            :class="[
              'group flex items-center gap-3 rounded-2xl px-4 py-3 transition',
              route.path === item.href ? 'bg-slate-950 text-white' : 'hover:bg-slate-950 hover:text-white',
              !item.enabled ? 'pointer-events-none opacity-55' : ''
            ]"
            @click="appStore.setSidebarOpen(false)"
          >
            <span :class="['h-2.5 w-2.5 rounded-full', item.accent]" />
            <span class="text-sm font-medium tracking-wide">{{ item.label }}</span>
            <span
              v-if="!item.enabled"
              class="ml-auto rounded-full border border-current/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.24em]"
            >
              {{ t('shell.nav.soon') }}
            </span>
          </NuxtLink>
        </nav>

        <div class="mt-8 flex flex-wrap gap-2">
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

        <div class="mt-8 rounded-[1.75rem] bg-slate-950 p-5 text-white">
          <p class="text-xs uppercase tracking-[0.28em] text-white/55">
            {{ t('shell.sidebar.focusLabel') }}
          </p>
          <p class="mt-3 font-serif text-2xl leading-tight">
            {{ t('shell.sidebar.focusTitle') }}
          </p>
          <p class="mt-3 text-sm leading-6 text-white/72">
            {{ t('shell.sidebar.focusBody') }}
          </p>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="rounded-[2rem] border border-white/60 bg-white/80 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden"
                @click="appStore.toggleSidebar()"
              >
                <span class="sr-only">{{ t('shell.actions.openNavigation') }}</span>
                ☰
              </button>

              <div>
                <p class="text-xs uppercase tracking-[0.28em] text-slate-500">
                  {{ t('shell.header.eyebrow') }}
                </p>
                <h1 class="font-serif text-2xl tracking-tight text-slate-950">
                  {{ t('shell.header.title') }}
                </h1>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div
                v-if="auth.user.value"
                class="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 sm:block"
              >
                {{ auth.user.value.email }}
              </div>
              <div class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                {{ t('shell.header.status') }}
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                @click="handleLogout"
              >
                {{ t('shell.actions.logout') }}
              </button>
            </div>
          </div>
        </header>

        <main class="min-h-0 flex-1 py-6">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
