<script setup lang="ts">
import { markRaw } from 'vue'
import { Bell, CalendarDays, CircleHelp, CreditCard, FileSearch, FolderOpen, House, LogOut, Mail, Menu, Settings, ShieldCheck, X } from 'lucide-vue-next'

const appStore = useAppStore()
const auth = useAuth()
const route = useRoute()
const router = useRouter()
const { locale, locales, t } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

const localeOrder = ['en', 'de', 'fr', 'it'] as const

const icons = {
  dashboard: markRaw(House),
  documents: markRaw(FolderOpen),
  checks: markRaw(FileSearch),
  letters: markRaw(Mail),
  deadlines: markRaw(CalendarDays),
  payments: markRaw(CreditCard),
  settings: markRaw(Settings),
  support: markRaw(CircleHelp)
}

const navigation = computed(() => [
  {
    key: 'dashboard',
    label: t('shell.nav.dashboard'),
    href: localePath('/dashboard'),
    icon: icons.dashboard,
    enabled: true
  },
  {
    key: 'documents',
    label: t('shell.nav.documents'),
    href: '#',
    icon: icons.documents,
    enabled: false
  },
  {
    key: 'checks',
    label: t('shell.nav.checks'),
    href: '#',
    icon: icons.checks,
    enabled: false
  },
  {
    key: 'letters',
    label: t('shell.nav.letters'),
    href: '#',
    icon: icons.letters,
    enabled: false
  },
  {
    key: 'deadlines',
    label: t('shell.nav.deadlines'),
    href: '#',
    icon: icons.deadlines,
    enabled: false
  },
  {
    key: 'payments',
    label: t('shell.nav.payments'),
    href: '#',
    icon: icons.payments,
    enabled: false
  },
  {
    key: 'settings',
    label: t('shell.nav.settings'),
    href: '#',
    icon: icons.settings,
    enabled: false
  },
  {
    key: 'support',
    label: t('shell.nav.support'),
    href: '#',
    icon: icons.support,
    enabled: false
  }
])

const localeOptions = computed(() =>
  [...locales.value]
    .sort((left, right) => localeOrder.indexOf(left.code) - localeOrder.indexOf(right.code))
    .map(localeOption => ({
      code: localeOption.code,
      label: localeOption.code.toUpperCase(),
      to: switchLocalePath(localeOption.code)
    }))
)

const logoSrc = '/swiss-tenant-assistant-icon.svg'

async function handleLogout() {
  await auth.logout()
  await router.push(localePath('/auth/login'))
}

async function handleLocaleChange(event: Event) {
  const nextLocale = (event.target as HTMLSelectElement).value

  if (!localeOrder.includes(nextLocale as (typeof localeOrder)[number])) {
    return
  }

  const nextPath = switchLocalePath(nextLocale as (typeof localeOrder)[number])

  if (nextPath) {
    await router.push(nextPath)
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950">
    <div class="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
      <div
        v-if="appStore.sidebarOpen"
        class="fixed inset-0 z-30 bg-slate-950/20 lg:hidden"
        @click="appStore.setSidebarOpen(false)"
      />

      <aside
        :class="[
          'fixed inset-y-4 left-4 z-40 flex w-[280px] flex-col rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-transform lg:static lg:translate-x-0',
          appStore.sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'
        ]"
      >
        <div class="flex items-center justify-between gap-4">
          <NuxtLink :to="localePath('/dashboard')" class="flex items-center gap-3" @click="appStore.setSidebarOpen(false)">
            <img :src="logoSrc" :alt="t('app.name')" class="h-11 w-11 rounded-2xl">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-950">
                {{ t('app.name') }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ t('shell.sidebar.label') }}
              </p>
            </div>
          </NuxtLink>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 lg:hidden"
            @click="appStore.setSidebarOpen(false)"
          >
            <span class="sr-only">{{ t('shell.actions.closeNavigation') }}</span>
            <X class="h-4 w-4" />
          </button>
        </div>

        <nav class="mt-8 space-y-1.5">
          <NuxtLink
            v-for="item in navigation"
            :key="item.key"
            :to="item.href"
            :class="[
              'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
              route.path === item.href
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
              !item.enabled ? 'pointer-events-none opacity-55' : ''
            ]"
            @click="appStore.setSidebarOpen(false)"
          >
            <span
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-xl border transition',
                route.path === item.href
                  ? 'border-emerald-200 bg-white text-emerald-600'
                  : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:bg-white group-hover:text-slate-700'
              ]"
            >
              <component :is="item.icon" class="h-4 w-4" />
            </span>
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <div class="mt-auto border-t border-slate-200 pt-5">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            @click="handleLogout"
          >
            <span class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
              <LogOut class="h-4 w-4" />
            </span>
            <span>{{ t('shell.actions.logout') }}</span>
          </button>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden"
                @click="appStore.toggleSidebar()"
              >
                <span class="sr-only">{{ t('shell.actions.openNavigation') }}</span>
                <Menu class="h-5 w-5" />
              </button>

              <div>
                <p class="text-xs uppercase tracking-[0.28em] text-slate-500">
                  {{ t('shell.header.eyebrow') }}
                </p>
                <h1 class="text-2xl font-semibold tracking-tight text-slate-950">
                  {{ t('shell.header.title') }}
                </h1>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <select
                :value="locale"
                class="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300"
                @change="handleLocaleChange"
              >
                <option v-for="localeOption in localeOptions" :key="localeOption.code" :value="localeOption.code">
                  {{ localeOption.label }}
                </option>
              </select>

              <button
                type="button"
                class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
              >
                <Bell class="h-4 w-4" />
              </button>

              <div class="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 sm:flex">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <ShieldCheck class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-950">
                    {{ auth.user.value?.email || t('app.name') }}
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ t('shell.header.status') }}
                  </p>
                </div>
              </div>
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
