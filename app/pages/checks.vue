<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, FileSearch, LoaderCircle, ShieldCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

type CheckListItem = {
  id: number
  caseId: number
  caseTitle: string
  type: string
  status: string
  riskScore: string | null
  summaryText: string | null
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

const { data, pending, refresh } = await useAsyncData('checks-list', () => $fetch<ChecksResponse>('/api/checks'))

const checks = computed(() => data.value?.data.items || [])
const readyChecks = computed(() => checks.value.filter(item => item.status === 'ready').length)
const activeChecks = computed(() => checks.value.filter(item => ['uploaded', 'extracting', 'analyzing'].includes(item.status)).length)
const paymentRequiredChecks = computed(() => checks.value.filter(item => item.status === 'payment_required').length)

async function handleRefresh() {
  await refresh()
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat(locale.value === 'de' ? 'de-CH' : locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

function badgeTone(tone?: string | null) {
  if (tone === 'high' || tone === 'failed') {
    return 'bg-rose-50 text-rose-700'
  }

  if (tone === 'medium' || tone === 'payment_required') {
    return 'bg-amber-50 text-amber-700'
  }

  if (tone === 'low' || tone === 'ready') {
    return 'bg-emerald-50 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-600'
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
            class="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            @click="handleRefresh"
          >
            {{ t('checksPage.actions.refresh') }}
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

      <div class="mt-6 grid gap-4 xl:grid-cols-3">
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
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold text-slate-950">
          {{ t('checksPage.list.title') }}
        </h2>
      </div>

      <div v-if="pending" class="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle class="h-4 w-4 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="checks.length" class="mt-5 grid gap-4">
        <article
          v-for="check in checks"
          :key="check.id"
          class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex items-start gap-4">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <FileSearch class="h-5 w-5" />
              </div>
              <div>
                <p class="text-base font-semibold text-slate-950">
                  {{ check.caseTitle }}
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {{ t(`checksPage.types.${check.type}`, check.type) }}
                  </span>
                  <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(check.status)]">
                    {{ t(`checksPage.status.${check.status}`, check.status) }}
                  </span>
                  <span
                    v-if="check.riskScore"
                    :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(check.riskScore)]"
                  >
                    {{ t(`checksPage.risk.${check.riskScore}`, check.riskScore) }}
                  </span>
                </div>
                <p class="mt-3 text-sm leading-6 text-slate-500">
                  {{ check.summaryText || t('checksPage.noSummary') }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  {{ t('checksPage.createdAt') }}
                </p>
                <p class="mt-1 text-sm text-slate-600">
                  {{ formatDate(check.createdAt) }}
                </p>
              </div>
              <NuxtLink
                :to="localePath(`/checks/${check.id}`)"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                <span>{{ t('checksPage.actions.viewDetails') }}</span>
                <ArrowRight class="h-4 w-4" />
              </NuxtLink>
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <ShieldCheck class="h-4 w-4" />
              </span>
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
