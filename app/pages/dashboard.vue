<script setup lang="ts">
import { computed, markRaw } from 'vue'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleEllipsis,
  FileText,
  FolderOpen,
  Mail,
  ReceiptText,
  ShieldCheck,
  Upload
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const auth = useAuth()
const { t } = useI18n()

await auth.fetchCurrentUser()

const firstName = computed(() => auth.user.value?.email?.split('@')[0] || 'Anna')

const stats = computed(() => [
  {
    key: 'documents',
    label: t('dashboard.stats.documents'),
    value: '12',
    delta: t('dashboard.stats.documentsDelta'),
    icon: markRaw(FileText),
    tone: 'emerald'
  },
  {
    key: 'checks',
    label: t('dashboard.stats.completedChecks'),
    value: '7',
    delta: t('dashboard.stats.completedChecksDelta'),
    icon: markRaw(ShieldCheck),
    tone: 'sky'
  },
  {
    key: 'letters',
    label: t('dashboard.stats.generatedLetters'),
    value: '5',
    delta: t('dashboard.stats.generatedLettersDelta'),
    icon: markRaw(Mail),
    tone: 'violet'
  },
  {
    key: 'deadlines',
    label: t('dashboard.stats.openDeadlines'),
    value: '3',
    delta: t('dashboard.stats.openDeadlinesDelta'),
    icon: markRaw(CalendarDays),
    tone: 'amber'
  }
])

const quickActions = computed(() => [
  {
    key: 'nebenkosten',
    title: t('dashboard.quickActions.nebenkostenTitle'),
    body: t('dashboard.quickActions.nebenkostenBody'),
    icon: markRaw(ReceiptText),
    tone: 'emerald'
  },
  {
    key: 'contract',
    title: t('dashboard.quickActions.contractTitle'),
    body: t('dashboard.quickActions.contractBody'),
    icon: markRaw(FileText),
    tone: 'emerald'
  },
  {
    key: 'letter',
    title: t('dashboard.quickActions.letterTitle'),
    body: t('dashboard.quickActions.letterBody'),
    icon: markRaw(Mail),
    tone: 'emerald'
  },
  {
    key: 'upload',
    title: t('dashboard.quickActions.uploadTitle'),
    body: t('dashboard.quickActions.uploadBody'),
    icon: markRaw(Upload),
    tone: 'emerald'
  }
])

const recentChecks = computed(() => [
  {
    file: 'Nebenkostenabrechnung 2024.pdf',
    type: t('dashboard.checkTypes.nebenkosten'),
    risk: t('dashboard.risk.medium'),
    riskTone: 'amber',
    status: t('dashboard.status.ready'),
    date: '24.05.2024'
  },
  {
    file: 'Mietvertrag.pdf',
    type: t('dashboard.checkTypes.contract'),
    risk: t('dashboard.risk.low'),
    riskTone: 'emerald',
    status: t('dashboard.status.ready'),
    date: '21.05.2024'
  },
  {
    file: 'Mietzinserhoehung Mai 2024.pdf',
    type: t('dashboard.checkTypes.rentIncrease'),
    risk: t('dashboard.risk.high'),
    riskTone: 'rose',
    status: t('dashboard.status.ready'),
    date: '18.05.2024'
  }
])

const upcomingDeadlines = computed(() => [
  {
    title: t('dashboard.deadlines.noticeTitle'),
    date: '31.07.2024',
    remaining: t('dashboard.deadlines.noticeRemaining'),
    tone: 'emerald',
    icon: markRaw(CalendarDays)
  },
  {
    title: t('dashboard.deadlines.rentIncreaseTitle'),
    date: '15.06.2024',
    remaining: t('dashboard.deadlines.rentIncreaseRemaining'),
    tone: 'amber',
    icon: markRaw(Mail)
  },
  {
    title: t('dashboard.deadlines.documentsTitle'),
    date: '07.06.2024',
    remaining: t('dashboard.deadlines.documentsRemaining'),
    tone: 'rose',
    icon: markRaw(FileText)
  }
])

const recentDocuments = computed(() => [
  {
    title: 'Mietvertrag.pdf',
    date: '21.05.2024'
  },
  {
    title: 'Nebenkostenabrechnung 2024.pdf',
    date: '24.05.2024'
  },
  {
    title: 'Uebergabeprotokoll.pdf',
    date: '12.04.2024'
  },
  {
    title: 'Hausordnung.pdf',
    date: '03.03.2024'
  }
])

function iconTone(tone: string) {
  switch (tone) {
    case 'sky':
      return 'bg-sky-50 text-sky-600'
    case 'violet':
      return 'bg-violet-50 text-violet-600'
    case 'amber':
      return 'bg-amber-50 text-amber-600'
    case 'rose':
      return 'bg-rose-50 text-rose-600'
    default:
      return 'bg-emerald-50 text-emerald-600'
  }
}

function badgeTone(tone: string) {
  switch (tone) {
    case 'amber':
      return 'bg-amber-50 text-amber-700'
    case 'rose':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-emerald-50 text-emerald-700'
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 class="text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.2rem]">
            {{ t('dashboard.hero.title', { name: firstName }) }}
          </h2>
          <p class="mt-2 text-sm text-slate-500 sm:text-base">
            {{ t('dashboard.hero.description') }}
          </p>
        </div>

        <NuxtLink
          to="#"
          class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Upload class="h-4 w-4" />
          <span>{{ t('dashboard.hero.uploadAction') }}</span>
        </NuxtLink>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-4">
        <article
          v-for="stat in stats"
          :key="stat.key"
          class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
        >
          <div class="flex items-start gap-4">
            <div :class="['flex h-12 w-12 shrink-0 items-center justify-center rounded-full', iconTone(stat.tone)]">
              <component :is="stat.icon" class="h-5 w-5" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">
                {{ stat.label }}
              </p>
              <p class="mt-2 text-[2rem] font-semibold leading-none text-slate-950">
                {{ stat.value }}
              </p>
              <p class="mt-2 text-sm font-medium text-emerald-600">
                {{ stat.delta }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <h3 class="text-lg font-semibold text-slate-950">
        {{ t('dashboard.quickActions.title') }}
      </h3>

      <div class="mt-4 grid gap-4 xl:grid-cols-4">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.key"
          to="#"
          class="group rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5 transition hover:border-emerald-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <div class="flex min-h-[122px] flex-col">
            <div class="flex items-start justify-between gap-4">
              <div :class="['flex h-11 w-11 items-center justify-center rounded-full', iconTone(action.tone)]">
                <component :is="action.icon" class="h-5 w-5" />
              </div>
              <ArrowRight class="h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
            </div>

            <div class="mt-4">
              <p class="text-sm font-semibold text-slate-950">
                {{ action.title }}
              </p>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                {{ action.body }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
      <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-semibold text-slate-950">
            {{ t('dashboard.sections.recentChecks') }}
          </h3>
          <NuxtLink to="#" class="text-sm font-medium text-emerald-600">
            {{ t('dashboard.actions.viewAllChecks') }}
          </NuxtLink>
        </div>

        <div class="mt-5 overflow-x-auto">
          <table class="min-w-full text-left">
            <thead>
              <tr class="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th class="pb-3 pr-4">{{ t('dashboard.table.document') }}</th>
                <th class="pb-3 pr-4">{{ t('dashboard.table.type') }}</th>
                <th class="pb-3 pr-4">{{ t('dashboard.table.risk') }}</th>
                <th class="pb-3 pr-4">{{ t('dashboard.table.status') }}</th>
                <th class="pb-3 pr-4">{{ t('dashboard.table.date') }}</th>
                <th class="pb-3" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="check in recentChecks"
                :key="check.file"
                class="border-b border-slate-100 last:border-b-0"
              >
                <td class="py-4 pr-4">
                  <div class="flex items-center gap-3">
                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                      <FileText class="h-4 w-4" />
                    </span>
                    <span class="text-sm font-medium text-slate-700">{{ check.file }}</span>
                  </div>
                </td>
                <td class="py-4 pr-4">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {{ check.type }}
                  </span>
                </td>
                <td class="py-4 pr-4">
                  <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(check.riskTone)]">
                    {{ check.risk }}
                  </span>
                </td>
                <td class="py-4 pr-4">
                  <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {{ check.status }}
                  </span>
                </td>
                <td class="py-4 pr-4 text-sm text-slate-500">
                  {{ check.date }}
                </td>
                <td class="py-4 text-right">
                  <button type="button" class="text-slate-400 transition hover:text-slate-700">
                    <CircleEllipsis class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-semibold text-slate-950">
            {{ t('dashboard.sections.upcomingDeadlines') }}
          </h3>
          <NuxtLink to="#" class="text-sm font-medium text-emerald-600">
            {{ t('dashboard.actions.viewAll') }}
          </NuxtLink>
        </div>

        <div class="mt-5 space-y-4">
          <div
            v-for="item in upcomingDeadlines"
            :key="item.title"
            class="flex items-start gap-3"
          >
            <span :class="['mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconTone(item.tone)]">
              <component :is="item.icon" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-slate-900">{{ item.title }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ item.date }}</p>
                </div>
                <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.tone)]">
                  {{ item.remaining }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
      <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-semibold text-slate-950">
            {{ t('dashboard.sections.recentDocuments') }}
          </h3>
          <NuxtLink to="#" class="text-sm font-medium text-emerald-600">
            {{ t('dashboard.actions.openVault') }}
          </NuxtLink>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div
            v-for="document in recentDocuments"
            :key="document.title"
            class="rounded-[1rem] border border-slate-200 bg-white px-4 py-4"
          >
            <div class="flex items-start gap-3">
              <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <FileText class="h-4 w-4" />
              </span>
              <div class="min-w-0">
                <p class="line-clamp-2 text-sm font-medium text-slate-800">
                  {{ document.title }}
                </p>
                <p class="mt-2 text-xs text-slate-500">
                  {{ document.date }}
                </p>
              </div>
            </div>
          </div>

          <NuxtLink
            to="#"
            class="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            <div class="flex h-full items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FolderOpen class="h-4 w-4" />
              </span>
              <span>{{ t('dashboard.actions.moreDocuments') }}</span>
            </div>
          </NuxtLink>
        </div>
      </article>

      <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-semibold text-slate-950">
            {{ t('dashboard.sections.plan') }}
          </h3>
          <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {{ t('dashboard.plan.badge') }}
          </span>
        </div>

        <p class="mt-5 text-sm leading-7 text-slate-500">
          {{ t('dashboard.plan.description') }}
        </p>

        <NuxtLink
          to="#"
          class="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {{ t('dashboard.plan.cta') }}
        </NuxtLink>

        <div class="mt-8 flex h-28 items-center justify-center rounded-[1.5rem] border border-slate-100 bg-slate-50 text-slate-300">
          <FileText class="h-12 w-12" />
        </div>
      </article>
    </section>
  </div>
</template>
