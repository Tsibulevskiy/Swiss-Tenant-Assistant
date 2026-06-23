<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, ArrowRight, FileSearch, ShieldCheck, TriangleAlert } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

type ProcessingStatus = {
  code: string
  label: string
  detail: string
  tone: string
  progressPercent: number
  retryable: boolean
}

type CheckDetailResponse = {
  ok: true
  data: {
    check: {
      id: number
      caseId: number
      caseTitle: string
      type: string
      status: string
      inputPayloadJson: unknown
      processing: ProcessingStatus
      riskScore: string | null
      summaryText: string | null
      disclaimerText: string | null
      errorMessage: string | null
      startedAt: string | Date | null
      finishedAt: string | Date | null
      createdAt: string | Date
      updatedAt: string | Date
    }
    paymentGate: {
      requiresPayment: boolean
      hasPaidAccess: boolean
      productCode: string | null
      paymentStatus: string
      latestPaymentId: number | null
    }
    primaryDocument: null | {
      id: number
      kind: string
      originalName: string
      mimeType: string
      fileSize: number
      status: string
      createdAt: string | Date
    }
    extraction: null | {
      id: number
      engine: string
      status: string
      rawText: string | null
      normalizedText: string | null
      structuredDataJson: unknown
      confidenceScore: string | null
      errorMessage: string | null
      createdAt: string | Date
    }
    findings: Array<{
      id: number
      ruleCode: string
      severity: string
      title: string
      description: string
      matchedValue: string | null
      metadataJson: unknown
      createdAt: string | Date
    }>
    analysis: {
      aiSummary: {
        title: string
        body: string | null
        status: string
      }
      ruleFindings: {
        title: string
        count: number
        previewLocked?: boolean
        items: Array<{
          id: number
          ruleCode: string
          severity: string
          title: string
          description: string
          matchedValue: string | null
          metadataJson: unknown
          createdAt: string | Date
        }>
        status: string
      }
      recommendedAction: {
        level: string
        title: string
        body: string
      }
    }
  }
}

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const checkId = computed(() => Number(route.params.id))

const { data, pending, error } = await useAsyncData(
  () => `check-detail-${checkId.value}`,
  () => $fetch<CheckDetailResponse>(`/api/checks/${checkId.value}`),
  {
    watch: [checkId]
  }
)

const check = computed(() => data.value?.data.check || null)
const paymentGate = computed(() => data.value?.data.paymentGate || null)
const primaryDocument = computed(() => data.value?.data.primaryDocument || null)
const extraction = computed(() => data.value?.data.extraction || null)
const findings = computed(() => data.value?.data.findings || [])
const analysis = computed(() => data.value?.data.analysis || null)

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

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(locale.value === 'de' ? 'de-CH' : locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function formatFileSize(value?: number | null) {
  if (!value) {
    return '—'
  }

  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function explanationFromMetadata(value: unknown) {
  const metadata = asRecord(value)

  return typeof metadata?.explanation === 'string'
    ? metadata.explanation
    : null
}

const extractionSummary = computed(() => {
  const extractionValue = extraction.value

  if (!extractionValue) {
    return null
  }

  const structuredRoot = asRecord(extractionValue.structuredDataJson)
  const structuredExtraction = asRecord(structuredRoot?.structuredExtraction)
  const extractor = asRecord(structuredExtraction?.extractor)
  const candidates = asRecord(structuredExtraction?.candidates)
  const extracted = asRecord(structuredExtraction?.extracted)

  return {
    schema: typeof structuredExtraction?.schema === 'string' ? structuredExtraction.schema : '—',
    normalizedTextLength: typeof extractor?.normalizedTextLength === 'number' ? extractor.normalizedTextLength : null,
    dateCandidates: Array.isArray(candidates?.dates) ? candidates.dates.length : 0,
    amountCandidates: Array.isArray(candidates?.amounts) ? candidates.amounts.length : 0,
    lineItems: Array.isArray(extracted?.lineItems) ? extracted.lineItems.length : 0
  }
})

const checkoutQuery = computed(() => {
  if (!check.value || !paymentGate.value?.productCode) {
    return null
  }

  return localePath({
    path: '/checkout',
    query: {
      product: paymentGate.value.productCode,
      checkId: String(check.value.id),
      caseId: String(check.value.caseId)
    }
  })
})
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <NuxtLink
        :to="localePath('/checks')"
        class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft class="h-4 w-4" />
        <span>{{ t('checkDetailPage.back') }}</span>
      </NuxtLink>

      <div v-if="pending" class="mt-6 text-sm text-slate-500">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="error || !check" class="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {{ t('checkDetailPage.notFound') }}
      </div>

      <template v-else>
        <div class="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {{ t('checkDetailPage.eyebrow') }}
            </p>
            <h1 class="mt-4 text-[2rem] font-semibold tracking-tight text-slate-950">
              {{ check.caseTitle }}
            </h1>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {{ t(`checksPage.types.${check.type}`, check.type) }}
              </span>
              <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(check.processing.tone)]">
                {{ check.processing.label }}
              </span>
              <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(check.riskScore || 'neutral')]">
                {{ check.riskScore ? t(`checksPage.risk.${check.riskScore}`, check.riskScore) : t('checksPage.risk.none') }}
              </span>
            </div>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ check.processing.detail }}
            </p>

            <div
              v-if="paymentGate?.requiresPayment && !paymentGate.hasPaidAccess"
              class="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800"
            >
              <p class="font-medium">{{ t('checkDetailPage.paymentGate.previewTitle') }}</p>
              <p class="mt-2 leading-6">{{ t('checkDetailPage.paymentGate.previewBody') }}</p>
              <NuxtLink
                v-if="checkoutQuery"
                :to="checkoutQuery"
                class="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-medium text-white transition hover:bg-amber-600"
              >
                <span>{{ t('checkDetailPage.paymentGate.unlockAction') }}</span>
                <ArrowRight class="h-4 w-4" />
              </NuxtLink>
            </div>

            <div class="mt-4">
              <div class="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{{ t('checkDetailPage.processingProgress') }}</span>
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
          </div>

          <div class="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
            <div class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
              <p class="text-xs font-medium text-slate-500">{{ t('checkDetailPage.startedAt') }}</p>
              <p class="mt-2 text-sm font-medium text-slate-900">{{ formatDate(check.startedAt || check.createdAt) }}</p>
            </div>
            <div class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
              <p class="text-xs font-medium text-slate-500">{{ t('checkDetailPage.finishedAt') }}</p>
              <p class="mt-2 text-sm font-medium text-slate-900">{{ formatDate(check.finishedAt) }}</p>
            </div>
            <div class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
              <p class="text-xs font-medium text-slate-500">{{ t('checkDetailPage.findingsCount') }}</p>
              <p class="mt-2 text-sm font-medium text-slate-900">{{ findings.length }}</p>
            </div>
            <div class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
              <p class="text-xs font-medium text-slate-500">{{ t('checkDetailPage.riskScoreTitle') }}</p>
              <p class="mt-2 text-sm font-medium text-slate-900">
                {{ check.riskScore ? t(`checksPage.risk.${check.riskScore}`, check.riskScore) : t('checksPage.risk.none') }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </section>

    <template v-if="check">
      <section class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck class="h-5 w-5" />
            </span>
            <div>
              <h2 class="text-lg font-semibold text-slate-950">
                {{ t('checkDetailPage.summaryTitle') }}
              </h2>
            </div>
          </div>

          <p class="mt-5 text-sm leading-7 text-slate-600">
            {{ analysis?.aiSummary.body || t('checkDetailPage.noSummary') }}
          </p>

          <div v-if="check.errorMessage" class="mt-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {{ check.errorMessage }}
          </div>

          <div v-if="check.disclaimerText" class="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            {{ check.disclaimerText }}
          </div>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div class="flex items-center gap-3">
            <span :class="['flex h-11 w-11 items-center justify-center rounded-full', analysis?.recommendedAction.level === 'warning' || analysis?.recommendedAction.level === 'attention' ? 'bg-amber-50 text-amber-600' : analysis?.recommendedAction.level === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600']">
              <ShieldCheck class="h-5 w-5" />
            </span>
            <h2 class="text-lg font-semibold text-slate-950">
              {{ t('checkDetailPage.resultCardTitle') }}
            </h2>
          </div>

          <div class="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-5 py-5">
            <p class="text-base font-semibold text-slate-950">
              {{ analysis?.recommendedAction.title }}
            </p>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              {{ analysis?.recommendedAction.body }}
            </p>
          </div>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <TriangleAlert class="h-5 w-5" />
            </span>
            <h2 class="text-lg font-semibold text-slate-950">
              {{ t('checkDetailPage.ruleFindingsTitle') }}
            </h2>
          </div>

          <div v-if="analysis?.ruleFindings.items.length" class="mt-5 grid gap-4">
            <article
              v-for="finding in analysis.ruleFindings.items"
              :key="finding.id"
              class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-base font-semibold text-slate-950">{{ finding.title }}</p>
                    <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {{ finding.ruleCode }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm leading-6 text-slate-500">{{ finding.description }}</p>
                  <p v-if="explanationFromMetadata(finding.metadataJson)" class="mt-2 text-sm leading-6 text-slate-600">
                    {{ explanationFromMetadata(finding.metadataJson) }}
                  </p>
                </div>
                <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(finding.severity)]">
                  {{ finding.severity }}
                </span>
              </div>
              <p v-if="finding.matchedValue" class="mt-3 text-sm text-slate-600">
                <span class="font-medium text-slate-800">{{ t('checkDetailPage.matchedValue') }}:</span> {{ finding.matchedValue }}
              </p>
            </article>
          </div>
          <div v-else class="mt-5 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
            {{ t('checkDetailPage.noFindings') }}
          </div>
          <p
            v-if="analysis?.ruleFindings.previewLocked"
            class="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800"
          >
            {{ t('checkDetailPage.paymentGate.findingsLocked') }}
          </p>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <FileSearch class="h-5 w-5" />
            </span>
            <div>
              <h2 class="text-lg font-semibold text-slate-950">
                {{ t('checkDetailPage.documentTitle') }}
              </h2>
            </div>
          </div>

          <div v-if="primaryDocument" class="mt-5 space-y-3 text-sm text-slate-600">
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.documentName') }}</p>
              <p class="mt-1 break-words font-medium text-slate-900">{{ primaryDocument.originalName }}</p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.documentType') }}</p>
                <p class="mt-1">{{ t(`documentsPage.kinds.${primaryDocument.kind}`, primaryDocument.kind) }}</p>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.documentSize') }}</p>
                <p class="mt-1">{{ formatFileSize(primaryDocument.fileSize) }}</p>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.documentStatus') }}</p>
                <p class="mt-1">{{ t(`documentsPage.status.${primaryDocument.status}`, primaryDocument.status) }}</p>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.documentCreatedAt') }}</p>
                <p class="mt-1">{{ formatDate(primaryDocument.createdAt) }}</p>
              </div>
            </div>

            <NuxtLink
              :to="localePath('/documents')"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              <span>{{ t('checkDetailPage.viewDocumentVault') }}</span>
              <ArrowRight class="h-4 w-4" />
            </NuxtLink>
          </div>
          <p v-else class="mt-5 text-sm text-slate-500">
            {{ t('checkDetailPage.noDocument') }}
          </p>
        </article>
      </section>

      <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-slate-950">
            {{ t('checkDetailPage.extractionTitle') }}
          </h2>
          <span v-if="extraction" :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(extraction.status)]">
            {{ extraction.engine }} / {{ extraction.status }}
          </span>
        </div>

        <div v-if="extraction" class="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div class="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.extractionEngine') }}</p>
              <p class="mt-1 text-slate-900">{{ extraction.engine }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.extractionConfidence') }}</p>
              <p class="mt-1 text-slate-900">{{ extraction.confidenceScore || '—' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.extractionCreated') }}</p>
              <p class="mt-1 text-slate-900">{{ formatDateTime(extraction.createdAt) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.extractionSchema') }}</p>
              <p class="mt-1 text-slate-900">{{ extractionSummary?.schema || '—' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.normalizedLength') }}</p>
              <p class="mt-1 text-slate-900">{{ extractionSummary?.normalizedTextLength ?? '—' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('checkDetailPage.extractionStats') }}</p>
              <p class="mt-1 text-slate-900">
                {{ t('checkDetailPage.extractionStatsValue', { dates: extractionSummary?.dateCandidates ?? 0, amounts: extractionSummary?.amountCandidates ?? 0, lineItems: extractionSummary?.lineItems ?? 0 }) }}
              </p>
            </div>
            <p v-if="extraction.errorMessage" class="rounded-xl bg-rose-50 px-3 py-3 text-sm text-rose-700">
              {{ extraction.errorMessage }}
            </p>
          </div>

          <div class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
            <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {{ t('checkDetailPage.extractedText') }}
            </p>
            <pre
              v-if="extraction.normalizedText || extraction.rawText"
              class="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-600"
            >{{ extraction.normalizedText || extraction.rawText }}</pre>
            <p v-else class="mt-3 text-sm leading-6 text-slate-500">
              {{ paymentGate?.requiresPayment && !paymentGate.hasPaidAccess ? t('checkDetailPage.paymentGate.extractionLocked') : t('checkDetailPage.noExtractionText') }}
            </p>
          </div>
        </div>
        <div v-else class="mt-5 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
          {{ t('checkDetailPage.noExtraction') }}
        </div>
      </section>
    </template>
  </div>
</template>
