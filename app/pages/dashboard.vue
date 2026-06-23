<script setup lang="ts">
import { computed, markRaw } from 'vue'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  FileText,
  FolderOpen,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

type DocumentListItem = {
  id: number
  caseId: number | null
  kind: string
  originalName: string
  mimeType: string
  fileSize: number
  status: string
  createdAt: string | Date
  updatedAt: string | Date
}

type DocumentsResponse = {
  ok: true
  data: {
    items: DocumentListItem[]
  }
}

type CheckListItem = {
  id: number
  caseId: number
  caseTitle: string
  type: string
  status: string
  processing: {
    code: string
    label: string
    detail: string
    tone: string
    progressPercent: number
    retryable: boolean
  }
  riskScore: string | null
  summaryText: string | null
  findingsCount: number
  primaryDocument: null | {
    id: number
    kind: string
    originalName: string
    status: string
    mimeType: string
    fileSize: number
  }
  startedAt: string | Date | null
  finishedAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
}

type ChecksResponse = {
  ok: true
  data: {
    items: CheckListItem[]
  }
}

const auth = useAuth()
const { t, locale } = useI18n()
const localePath = useLocalePath()

await auth.fetchCurrentUser()

const firstName = computed(() => auth.user.value?.email?.split('@')[0] || 'Anna')

const {
  data: documentsData,
  pending: documentsPending,
  refresh: refreshDocuments
} = await useAsyncData('dashboard-documents', () => $fetch<DocumentsResponse>('/api/documents'))

const {
  data: checksData,
  pending: checksPending,
  refresh: refreshChecks
} = await useAsyncData('dashboard-checks', () => $fetch<ChecksResponse>('/api/checks'))

const documents = computed(() => documentsData.value?.data.items || [])
const checks = computed(() => checksData.value?.data.items || [])
const dashboardPending = computed(() => documentsPending.value || checksPending.value)

const totalDocuments = computed(() => documents.value.length)
const readyDocuments = computed(() => documents.value.filter(item => item.status === 'ready').length)
const processingDocuments = computed(() => documents.value.filter(item => item.status === 'processing').length)
const failedDocuments = computed(() => documents.value.filter(item => item.status === 'failed').length)

const completedChecks = computed(() => checks.value.filter(item => item.processing.code === 'completed').length)
const activeChecks = computed(() => checks.value.filter(item => ['queued', 'extracting', 'normalizing', 'structuring', 'evaluating_rules', 'generating_summary'].includes(item.processing.code)).length)
const highRiskChecks = computed(() => checks.value.filter(item => item.riskScore === 'high').length)

const stats = computed(() => [
  {
    key: 'documents',
    label: t('dashboard.stats.documents'),
    value: totalDocuments.value,
    delta: t('dashboard.stats.documentsDelta', { count: readyDocuments.value }),
    icon: markRaw(FileText),
    tone: 'emerald'
  },
  {
    key: 'checks',
    label: t('dashboard.stats.completedChecks'),
    value: completedChecks.value,
    delta: t('dashboard.stats.completedChecksDelta', { count: activeChecks.value }),
    icon: markRaw(ShieldCheck),
    tone: 'sky'
  },
  {
    key: 'processing',
    label: t('dashboard.stats.processingDocuments'),
    value: processingDocuments.value,
    delta: t('dashboard.stats.processingDocumentsDelta', { count: failedDocuments.value }),
    icon: markRaw(LoaderCircle),
    tone: 'amber'
  },
  {
    key: 'risk',
    label: t('dashboard.stats.highRiskChecks'),
    value: highRiskChecks.value,
    delta: t('dashboard.stats.highRiskChecksDelta', { count: checks.value.length }),
    icon: markRaw(CircleAlert),
    tone: 'rose'
  }
])

const quickActions = computed(() => [
  {
    key: 'nebenkosten',
    title: t('dashboard.quickActions.nebenkostenTitle'),
    body: t('dashboard.quickActions.nebenkostenBody'),
    icon: markRaw(FileSearch),
    tone: 'emerald',
    to: localePath('/pricing')
  },
  {
    key: 'contract',
    title: t('dashboard.quickActions.contractTitle'),
    body: t('dashboard.quickActions.contractBody'),
    icon: markRaw(FileText),
    tone: 'emerald',
    to: localePath('/pricing')
  },
  {
    key: 'documents',
    title: t('dashboard.quickActions.uploadTitle'),
    body: t('dashboard.quickActions.uploadBody'),
    icon: markRaw(Upload),
    tone: 'emerald',
    to: localePath('/documents')
  },
  {
    key: 'checks',
    title: t('dashboard.quickActions.openChecksTitle'),
    body: t('dashboard.quickActions.openChecksBody'),
    icon: markRaw(ShieldCheck),
    tone: 'sky',
    to: localePath('/checks')
  }
])

const recentChecks = computed(() => checks.value.slice(0, 4))
const recentDocuments = computed(() => documents.value.slice(0, 4))

const processingOverview = computed(() => [
  {
    key: 'docs-ready',
    label: t('dashboard.processing.readyDocuments'),
    value: readyDocuments.value,
    tone: 'emerald'
  },
  {
    key: 'docs-processing',
    label: t('dashboard.processing.processingDocuments'),
    value: processingDocuments.value,
    tone: 'amber'
  },
  {
    key: 'checks-active',
    label: t('dashboard.processing.activeChecks'),
    value: activeChecks.value,
    tone: 'sky'
  },
  {
    key: 'checks-failed',
    label: t('dashboard.processing.failedDocuments'),
    value: failedDocuments.value,
    tone: 'rose'
  }
])

async function handleRefresh() {
  await Promise.all([refreshDocuments(), refreshChecks()])
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(locale.value === 'de' ? 'de-CH' : locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

function iconTone(tone: string) {
  switch (tone) {
    case 'sky':
      return 'bg-sky-50 text-sky-600'
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
    case 'progress':
    case 'sky':
      return 'bg-sky-50 text-sky-700'
    case 'amber':
    case 'warning':
    case 'medium':
    case 'payment_required':
      return 'bg-amber-50 text-amber-700'
    case 'rose':
    case 'danger':
    case 'failed':
    case 'high':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-emerald-50 text-emerald-700'
  }
}

function riskTone(riskScore: string | null) {
  if (riskScore === 'high') {
    return 'rose'
  }

  if (riskScore === 'medium') {
    return 'amber'
  }

  return 'emerald'
}

function documentStatusTone(status: string) {
  if (status === 'failed') {
    return 'rose'
  }

  if (status === 'processing') {
    return 'amber'
  }

  return 'emerald'
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

        <div class="flex gap-3">
          <button
            type="button"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            @click="handleRefresh"
          >
            <RefreshCw class="h-4 w-4" />
            <span>{{ t('dashboard.actions.refresh') }}</span>
          </button>

          <NuxtLink
            :to="localePath('/documents')"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Upload class="h-4 w-4" />
            <span>{{ t('dashboard.hero.uploadAction') }}</span>
          </NuxtLink>
        </div>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-4">
        <article
          v-for="stat in stats"
          :key="stat.key"
          class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
        >
          <div class="flex items-start gap-4">
            <div :class="['flex h-12 w-12 shrink-0 items-center justify-center rounded-full', iconTone(stat.tone)]">
              <component :is="stat.icon" class="h-5 w-5" :class="stat.key === 'processing' && dashboardPending ? 'animate-spin' : ''" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">
                {{ stat.label }}
              </p>
              <p class="mt-2 text-[2rem] font-semibold leading-none text-slate-950">
                {{ stat.value }}
              </p>
              <p class="mt-2 text-sm font-medium text-slate-600">
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
          :to="action.to"
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
          <NuxtLink :to="localePath('/checks')" class="text-sm font-medium text-emerald-600">
            {{ t('dashboard.actions.viewAllChecks') }}
          </NuxtLink>
        </div>

        <div v-if="checksPending" class="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle class="h-4 w-4 animate-spin" />
          <span>{{ t('common.loading') }}</span>
        </div>

        <div v-else-if="recentChecks.length" class="mt-5 overflow-x-auto">
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
                :key="check.id"
                class="border-b border-slate-100 last:border-b-0"
              >
                <td class="py-4 pr-4">
                  <div class="flex items-center gap-3">
                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                      <FileText class="h-4 w-4" />
                    </span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-slate-700">
                        {{ check.primaryDocument?.originalName || check.caseTitle }}
                      </p>
                      <p class="mt-1 text-xs text-slate-500">{{ check.findingsCount }} {{ t('dashboard.table.findings') }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 pr-4">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {{ t(`checksPage.types.${check.type}`, check.type) }}
                  </span>
                </td>
                <td class="py-4 pr-4">
                  <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(riskTone(check.riskScore))]">
                    {{ check.riskScore ? t(`checksPage.risk.${check.riskScore}`, check.riskScore) : t('checksPage.risk.none') }}
                  </span>
                </td>
                <td class="py-4 pr-4">
                  <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(check.processing.tone)]">
                    {{ check.processing.label }}
                  </span>
                </td>
                <td class="py-4 pr-4 text-sm text-slate-500">
                  {{ formatDate(check.createdAt) }}
                </td>
                <td class="py-4 text-right">
                  <NuxtLink :to="localePath(`/checks/${check.id}`)" class="text-sm font-medium text-emerald-600">
                    {{ t('dashboard.actions.open') }}
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p class="text-sm font-medium text-slate-700">{{ t('checksPage.empty.title') }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('checksPage.empty.description') }}</p>
        </div>
      </article>

      <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-semibold text-slate-950">
            {{ t('dashboard.sections.processingOverview') }}
          </h3>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {{ t('dashboard.processing.live') }}
          </span>
        </div>

        <div class="mt-5 space-y-4">
          <div
            v-for="item in processingOverview"
            :key="item.key"
            class="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <p class="text-sm font-medium text-slate-700">{{ item.label }}</p>
            <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.tone)]">
              {{ item.value }}
            </span>
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
          <NuxtLink :to="localePath('/documents')" class="text-sm font-medium text-emerald-600">
            {{ t('dashboard.actions.openVault') }}
          </NuxtLink>
        </div>

        <div v-if="documentsPending" class="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle class="h-4 w-4 animate-spin" />
          <span>{{ t('common.loading') }}</span>
        </div>

        <div v-else-if="recentDocuments.length" class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="document in recentDocuments"
            :key="document.id"
            class="rounded-[1rem] border border-slate-200 bg-white px-4 py-4"
          >
            <div class="flex items-start gap-3">
              <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <FileText class="h-4 w-4" />
              </span>
              <div class="min-w-0">
                <p class="line-clamp-2 text-sm font-medium text-slate-800">
                  {{ document.originalName }}
                </p>
                <p class="mt-2 text-xs text-slate-500">
                  {{ formatDate(document.createdAt) }}
                </p>
                <span :class="['mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium', badgeTone(documentStatusTone(document.status))]">
                  {{ t(`documentsPage.status.${document.status}`, document.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p class="text-sm font-medium text-slate-700">{{ t('documentsPage.empty.title') }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('documentsPage.empty.description') }}</p>
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
          :to="localePath('/pricing')"
          class="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {{ t('dashboard.plan.cta') }}
        </NuxtLink>

        <div class="mt-8 flex h-28 items-center justify-center rounded-[1.5rem] border border-slate-100 bg-slate-50 text-slate-300">
          <FolderOpen class="h-12 w-12" />
        </div>
      </article>
    </section>
  </div>
</template>
