<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, FileSearch, LoaderCircle, RefreshCw, Search, ShieldCheck, TriangleAlert } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

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

const { t, locale } = useI18n()
const localePath = useLocalePath()

const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')
const riskFilter = ref('all')

const typeOptions = computed(() => [
  { value: 'nebenkosten_check', label: t('checksPage.types.nebenkosten_check') },
  { value: 'mietvertrag_check', label: t('checksPage.types.mietvertrag_check') },
  { value: 'rent_increase_check', label: t('checksPage.types.rent_increase_check') },
  { value: 'deposit_return_check', label: t('checksPage.types.deposit_return_check') }
])

const statusOptions = computed(() => [
  { value: 'completed', label: t('checksPage.processing.completed') },
  { value: 'failed', label: t('checksPage.processing.failed') },
  { value: 'payment_required', label: t('checksPage.processing.payment_required') },
  { value: 'extracting', label: t('checksPage.processing.extracting') },
  { value: 'evaluating_rules', label: t('checksPage.processing.evaluating_rules') },
  { value: 'generating_summary', label: t('checksPage.processing.generating_summary') }
])

const riskOptions = computed(() => [
  { value: 'low', label: t('checksPage.risk.low') },
  { value: 'medium', label: t('checksPage.risk.medium') },
  { value: 'high', label: t('checksPage.risk.high') },
  { value: 'none', label: t('checksPage.risk.none') }
])

const { data, pending, refresh } = await useAsyncData('checks-list', () => $fetch<ChecksResponse>('/api/checks'))

const checks = computed(() => data.value?.data.items || [])
const readyChecks = computed(() => checks.value.filter(item => item.processing.code === 'completed').length)
const activeChecks = computed(() => checks.value.filter(item => ['queued', 'extracting', 'normalizing', 'structuring', 'evaluating_rules', 'generating_summary'].includes(item.processing.code)).length)
const paymentRequiredChecks = computed(() => checks.value.filter(item => item.status === 'payment_required').length)
const highRiskChecks = computed(() => checks.value.filter(item => item.riskScore === 'high').length)

const filteredChecks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return checks.value.filter(check => {
    const matchesQuery = !query
      || check.caseTitle.toLowerCase().includes(query)
      || check.primaryDocument?.originalName.toLowerCase().includes(query)
      || check.primaryDocument?.mimeType.toLowerCase().includes(query)
    const matchesType = typeFilter.value === 'all' || check.type === typeFilter.value
    const matchesStatus = statusFilter.value === 'all' || check.processing.code === statusFilter.value
    const matchesRisk = riskFilter.value === 'all'
      || (riskFilter.value === 'none' ? !check.riskScore : check.riskScore === riskFilter.value)

    return matchesQuery && matchesType && matchesStatus && matchesRisk
  })
})

async function handleRefresh() {
  await refresh()
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

function badgeTone(tone?: string | null) {
  if (tone === 'danger') {
    return 'bg-rose-50 text-rose-700'
  }

  if (tone === 'progress') {
    return 'bg-sky-50 text-sky-700'
  }

  if (tone === 'success') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (tone === 'neutral') {
    return 'bg-slate-100 text-slate-600'
  }

  if (tone === 'high' || tone === 'failed') {
    return 'bg-rose-50 text-rose-700'
  }

  if (tone === 'medium' || tone === 'warning' || tone === 'payment_required') {
    return 'bg-amber-50 text-amber-700'
  }

  if (tone === 'low' || tone === 'ready' || tone === 'info') {
    return 'bg-emerald-50 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function progressTone(code: string) {
  if (code === 'failed') {
    return 'bg-rose-500'
  }

  if (code === 'payment_required') {
    return 'bg-amber-500'
  }

  if (code === 'completed') {
    return 'bg-emerald-500'
  }

  return 'bg-sky-500'
}

function findingsTone(count: number) {
  if (count >= 3) {
    return 'text-rose-700'
  }

  if (count >= 1) {
    return 'text-amber-700'
  }

  return 'text-emerald-700'
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {{ t('checksPage.eyebrow') }}
          </p>
          <h1 class="mt-4 text-[2rem] font-semibold tracking-tight text-slate-950">
            {{ t('checksPage.title') }}
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
            {{ t('checksPage.description') }}
          </p>
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            @click="handleRefresh"
          >
            <RefreshCw class="h-4 w-4" />
            <span>{{ t('checksPage.actions.refresh') }}</span>
          </button>
          <NuxtLink
            :to="localePath('/pricing')"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <ArrowRight class="h-4 w-4" />
            <span>{{ t('checksPage.actions.startCheck') }}</span>
          </NuxtLink>
        </div>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-4">
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('checksPage.stats.total') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ checks.length }}</p>
        </div>
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('checksPage.stats.active') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ activeChecks }}</p>
        </div>
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('checksPage.stats.ready') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ readyChecks }}</p>
          <p v-if="paymentRequiredChecks" class="mt-2 text-sm font-medium text-amber-600">
            {{ paymentRequiredChecks }} {{ t('checksPage.stats.awaitingPayment') }}
          </p>
        </div>
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('checksPage.stats.highRisk') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ highRiskChecks }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-950">
            {{ t('checksPage.list.title') }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            {{ t('checksPage.filters.results', { count: filteredChecks.length, total: checks.length }) }}
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:min-w-[840px]">
          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checksPage.filters.searchLabel') }}</span>
            <div class="relative">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('checksPage.filters.searchPlaceholder')"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
              >
            </div>
          </label>

          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checksPage.filters.typeLabel') }}</span>
            <select
              v-model="typeFilter"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            >
              <option value="all">{{ t('checksPage.filters.typeAll') }}</option>
              <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checksPage.filters.statusLabel') }}</span>
            <select
              v-model="statusFilter"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            >
              <option value="all">{{ t('checksPage.filters.statusAll') }}</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checksPage.filters.riskLabel') }}</span>
            <select
              v-model="riskFilter"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            >
              <option value="all">{{ t('checksPage.filters.riskAll') }}</option>
              <option v-for="option in riskOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="pending" class="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle class="h-4 w-4 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="filteredChecks.length" class="mt-5 grid gap-4">
        <article
          v-for="check in filteredChecks"
          :key="check.id"
          class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5"
        >
          <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex items-start gap-4">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <FileSearch class="h-5 w-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-start gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="text-base font-semibold text-slate-950">
                        {{ check.caseTitle }}
                      </p>
                      <p class="mt-1 text-sm text-slate-500">
                        {{ t(`checksPage.types.${check.type}`, check.type) }}
                      </p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(check.processing.tone)]">
                        {{ check.processing.label }}
                      </span>
                      <span
                        :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(check.riskScore || 'neutral')]"
                      >
                        {{ check.riskScore ? t(`checksPage.risk.${check.riskScore}`, check.riskScore) : t('checksPage.risk.none') }}
                      </span>
                    </div>
                  </div>

                  <div class="mt-4">
                    <div class="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>{{ check.processing.detail }}</span>
                      <span>{{ check.processing.progressPercent }}%</span>
                    </div>
                    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="progressTone(check.processing.code)"
                        :style="{ width: `${check.processing.progressPercent}%` }"
                      />
                    </div>
                  </div>

                  <div class="mt-4 grid gap-3 lg:grid-cols-3">
                    <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checksPage.card.summary') }}</p>
                      <p class="mt-2 text-sm leading-6 text-slate-600">
                        {{ check.summaryText || t('checksPage.noSummary') }}
                      </p>
                    </div>

                    <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checksPage.card.findings') }}</p>
                      <p :class="['mt-2 text-sm font-semibold', findingsTone(check.findingsCount)]">
                        {{ t('checksPage.card.findingsCount', { count: check.findingsCount }) }}
                      </p>
                      <p class="mt-1 text-xs text-slate-500">
                        {{ t('checksPage.card.createdAt') }}: {{ formatDate(check.createdAt) }}
                      </p>
                    </div>

                    <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checksPage.card.sourceDocument') }}</p>
                      <template v-if="check.primaryDocument">
                        <p class="mt-2 truncate text-sm font-semibold text-slate-900">
                          {{ check.primaryDocument.originalName }}
                        </p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ t(`documentsPage.kinds.${check.primaryDocument.kind}`, check.primaryDocument.kind) }}
                        </p>
                      </template>
                      <p v-else class="mt-2 text-sm text-slate-500">
                        {{ t('checksPage.card.noSourceDocument') }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 xl:pl-4">
              <span
                v-if="check.findingsCount > 0"
                class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600"
              >
                <TriangleAlert class="h-4 w-4" />
              </span>
              <span
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400"
              >
                <ShieldCheck class="h-4 w-4" />
              </span>
              <NuxtLink
                :to="localePath(`/checks/${check.id}`)"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                <span>{{ t('checksPage.actions.viewDetails') }}</span>
                <ArrowRight class="h-4 w-4" />
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p class="text-sm font-medium text-slate-700">{{ t('checksPage.empty.title') }}</p>
        <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('checksPage.empty.description') }}</p>
        <NuxtLink
          :to="localePath('/pricing')"
          class="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <ArrowRight class="h-4 w-4" />
          <span>{{ t('checksPage.actions.startCheck') }}</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
