<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ArrowRight, Download, FileText, LoaderCircle, RefreshCw, Save, Sparkles } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

type LetterListItem = {
  id: number
  caseId: number | null
  checkId: number | null
  pdfDocumentId: number | null
  type: string
  locale: string
  subject: string
  bodyText: string
  status: string
  createdAt: string | Date
  updatedAt: string | Date
  caseTitle: string | null
  checkType: string | null
  checkRiskScore: string | null
}

type LettersResponse = {
  ok: true
  data: {
    items: LetterListItem[]
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
  }
  riskScore: string | null
  summaryText: string | null
  findingsCount: number
}

type ChecksResponse = {
  ok: true
  data: {
    items: CheckListItem[]
  }
}

type GeneratedLetterResponse = {
  ok: true
  data: {
    id: number
    caseId: number | null
    checkId: number | null
    type: string
    locale: string
    status: string
    subject: string
    bodyText: string
    variables: Array<{
      key: string
      label: string
      value: string
      source: 'user_input' | 'check_context' | 'system'
    }>
    aiResultJson: Record<string, unknown>
  }
}

type VariableField = {
  key: string
  labelKey: string
  placeholderKey: string
  required?: boolean
  multiline?: boolean
}

const { t, locale } = useI18n()
const localePath = useLocalePath()

const form = reactive({
  type: 'belege_request',
  checkId: '',
  recipientName: '',
  recipientAddress: '',
  senderName: '',
  senderAddress: '',
  senderCity: '',
  objectionReason: '',
  requestedDocuments: '',
  issueDescription: '',
  issueLocation: '',
  requestedDeadline: '',
  depositContext: '',
  rentIncreaseContext: '',
  additionalNotes: ''
})

const isSubmitting = ref(false)
const exportPendingId = ref<number | null>(null)
const submitError = ref('')
const submitSuccess = ref('')
const generatedLetter = ref<GeneratedLetterResponse['data'] | null>(null)
const selectedSavedLetterId = ref<number | null>(null)

const letterTypeOptions = computed(() => [
  { value: 'belege_request', label: t('lettersPage.types.belege_request') },
  { value: 'nebenkosten_objection', label: t('lettersPage.types.nebenkosten_objection') },
  { value: 'repair_request', label: t('lettersPage.types.repair_request') },
  { value: 'deposit_return_request', label: t('lettersPage.types.deposit_return_request') },
  { value: 'rent_increase_objection', label: t('lettersPage.types.rent_increase_objection') }
])

const { data: lettersData, pending: lettersPending, refresh: refreshLetters } = await useAsyncData(
  'letters-list',
  () => $fetch<LettersResponse>('/api/letters')
)
const { data: checksData, pending: checksPending, refresh: refreshChecks } = await useAsyncData(
  'letters-checks',
  () => $fetch<ChecksResponse>('/api/checks')
)

const letters = computed(() => lettersData.value?.data.items || [])
const checks = computed(() => checksData.value?.data.items || [])
const availableChecks = computed(() => checks.value.filter(item => item.processing.code === 'completed'))
const requiresCheck = computed(() => form.type !== 'repair_request')
const totalLetters = computed(() => letters.value.length)
const linkedLetters = computed(() => letters.value.filter(item => item.checkId || item.caseId).length)
const selectedSavedLetter = computed(() => {
  if (!selectedSavedLetterId.value) {
    return letters.value[0] || null
  }

  return letters.value.find(item => item.id === selectedSavedLetterId.value) || letters.value[0] || null
})
const previewLetter = computed(() => generatedLetter.value || selectedSavedLetter.value)

const commonFields: VariableField[] = [
  { key: 'recipientName', labelKey: 'lettersPage.form.fields.recipientName.label', placeholderKey: 'lettersPage.form.fields.recipientName.placeholder', required: true },
  { key: 'recipientAddress', labelKey: 'lettersPage.form.fields.recipientAddress.label', placeholderKey: 'lettersPage.form.fields.recipientAddress.placeholder', multiline: true },
  { key: 'senderName', labelKey: 'lettersPage.form.fields.senderName.label', placeholderKey: 'lettersPage.form.fields.senderName.placeholder', required: true },
  { key: 'senderAddress', labelKey: 'lettersPage.form.fields.senderAddress.label', placeholderKey: 'lettersPage.form.fields.senderAddress.placeholder', multiline: true },
  { key: 'senderCity', labelKey: 'lettersPage.form.fields.senderCity.label', placeholderKey: 'lettersPage.form.fields.senderCity.placeholder' }
]

const typeSpecificFields = computed<VariableField[]>(() => {
  switch (form.type) {
    case 'belege_request':
      return [
        { key: 'requestedDocuments', labelKey: 'lettersPage.form.fields.requestedDocuments.label', placeholderKey: 'lettersPage.form.fields.requestedDocuments.placeholder', multiline: true },
        { key: 'objectionReason', labelKey: 'lettersPage.form.fields.context.label', placeholderKey: 'lettersPage.form.fields.context.placeholder', multiline: true }
      ]
    case 'nebenkosten_objection':
      return [
        { key: 'objectionReason', labelKey: 'lettersPage.form.fields.objectionReason.label', placeholderKey: 'lettersPage.form.fields.objectionReason.placeholder', required: true, multiline: true }
      ]
    case 'repair_request':
      return [
        { key: 'issueDescription', labelKey: 'lettersPage.form.fields.issueDescription.label', placeholderKey: 'lettersPage.form.fields.issueDescription.placeholder', required: true, multiline: true },
        { key: 'issueLocation', labelKey: 'lettersPage.form.fields.issueLocation.label', placeholderKey: 'lettersPage.form.fields.issueLocation.placeholder' },
        { key: 'requestedDeadline', labelKey: 'lettersPage.form.fields.requestedDeadline.label', placeholderKey: 'lettersPage.form.fields.requestedDeadline.placeholder' }
      ]
    case 'deposit_return_request':
      return [
        { key: 'depositContext', labelKey: 'lettersPage.form.fields.depositContext.label', placeholderKey: 'lettersPage.form.fields.depositContext.placeholder', multiline: true }
      ]
    case 'rent_increase_objection':
      return [
        { key: 'rentIncreaseContext', labelKey: 'lettersPage.form.fields.rentIncreaseContext.label', placeholderKey: 'lettersPage.form.fields.rentIncreaseContext.placeholder', multiline: true }
      ]
    default:
      return []
  }
})

const formFields = computed(() => [
  ...commonFields,
  ...typeSpecificFields.value,
  { key: 'additionalNotes', labelKey: 'lettersPage.form.fields.additionalNotes.label', placeholderKey: 'lettersPage.form.fields.additionalNotes.placeholder', multiline: true }
])

watch(() => letters.value[0]?.id, (newId) => {
  if (!selectedSavedLetterId.value && newId) {
    selectedSavedLetterId.value = newId
  }
}, { immediate: true })

watch(() => form.type, () => {
  submitError.value = ''
  submitSuccess.value = ''

  if (!requiresCheck.value) {
    form.checkId = ''
  }
})

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

function typeLabel(type: string) {
  return t(`lettersPage.types.${type}`, type)
}

function riskTone(risk: string | null) {
  if (risk === 'high') {
    return 'bg-rose-50 text-rose-700'
  }

  if (risk === 'medium') {
    return 'bg-amber-50 text-amber-700'
  }

  if (risk === 'low') {
    return 'bg-emerald-50 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function buildVariablesPayload() {
  return Object.fromEntries(
    formFields.value
      .map(field => [field.key, form[field.key as keyof typeof form]])
      .filter(([, value]) => typeof value === 'string' && value.trim())
  )
}

async function handleGenerateLetter() {
  submitError.value = ''
  submitSuccess.value = ''

  if (requiresCheck.value && !form.checkId) {
    submitError.value = t('lettersPage.form.errors.checkRequired')
    return
  }

  isSubmitting.value = true

  try {
    const response = await $fetch<GeneratedLetterResponse>('/api/letters/generate', {
      method: 'POST',
      body: {
        type: form.type,
        ...(form.checkId ? { checkId: Number(form.checkId) } : {}),
        locale: locale.value,
        variables: buildVariablesPayload()
      }
    })

    generatedLetter.value = response.data
    submitSuccess.value = t('lettersPage.form.success')
    await refreshLetters()
    selectedSavedLetterId.value = response.data.id
  } catch (error) {
    submitError.value = error instanceof Error
      ? error.message
      : t('lettersPage.form.errors.generic')
  } finally {
    isSubmitting.value = false
  }
}

async function handleRefresh() {
  await Promise.all([refreshLetters(), refreshChecks()])
}

async function handleExportPdf(letterId: number) {
  exportPendingId.value = letterId

  try {
    const response = await $fetch<{ ok: true, data: { downloadUrl: string } }>(`/api/letters/${letterId}/export-pdf`, {
      method: 'POST'
    })

    await refreshLetters()
    await navigateTo(response.data.downloadUrl, {
      external: true,
      open: {
        target: '_blank'
      }
    })
  } finally {
    exportPendingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {{ t('lettersPage.eyebrow') }}
          </p>
          <h1 class="mt-4 text-[2rem] font-semibold tracking-tight text-slate-950">
            {{ t('lettersPage.title') }}
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
            {{ t('lettersPage.description') }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          @click="handleRefresh"
        >
          <RefreshCw class="h-4 w-4" />
          <span>{{ t('lettersPage.actions.refresh') }}</span>
        </button>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-3">
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('lettersPage.stats.total') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ totalLetters }}</p>
        </div>
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('lettersPage.stats.saved') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ letters.length }}</p>
        </div>
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('lettersPage.stats.linked') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ linkedLetters }}</p>
        </div>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Sparkles class="h-5 w-5" />
          </span>
          <div>
            <h2 class="text-lg font-semibold text-slate-950">{{ t('lettersPage.form.title') }}</h2>
            <p class="mt-1 text-sm text-slate-500">{{ t('lettersPage.form.description') }}</p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('lettersPage.form.typeLabel') }}</span>
            <select
              v-model="form.type"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            >
              <option v-for="option in letterTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('lettersPage.form.checkLabel') }}</span>
            <select
              v-model="form.checkId"
              :disabled="!requiresCheck"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-400 focus:border-emerald-300"
            >
              <option value="">
                {{ requiresCheck ? t('lettersPage.form.checkPlaceholder') : t('lettersPage.form.checkNotRequired') }}
              </option>
              <option v-for="check in availableChecks" :key="check.id" :value="String(check.id)">
                {{ check.caseTitle }} · {{ t(`checksPage.risk.${check.riskScore || 'none'}`, check.riskScore || 'none') }}
              </option>
            </select>
          </label>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <div
            v-for="field in formFields"
            :key="field.key"
            :class="field.multiline ? 'md:col-span-2' : ''"
            class="space-y-2"
          >
            <label :for="field.key" class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {{ t(field.labelKey) }}
            </label>
            <textarea
              v-if="field.multiline"
              :id="field.key"
              v-model="form[field.key as keyof typeof form]"
              :placeholder="t(field.placeholderKey)"
              rows="4"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-emerald-300"
            />
            <input
              v-else
              :id="field.key"
              v-model="form[field.key as keyof typeof form]"
              type="text"
              :placeholder="t(field.placeholderKey)"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            >
          </div>
        </div>

        <div v-if="submitError" class="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ submitError }}
        </div>
        <div v-else-if="submitSuccess" class="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {{ submitSuccess }}
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            :disabled="isSubmitting || checksPending"
            @click="handleGenerateLetter"
          >
            <LoaderCircle v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            <Sparkles v-else class="h-4 w-4" />
            <span>{{ t('lettersPage.actions.generate') }}</span>
          </button>
          <NuxtLink
            :to="localePath('/checks')"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          >
            <ArrowRight class="h-4 w-4" />
            <span>{{ t('lettersPage.actions.openChecks') }}</span>
          </NuxtLink>
        </div>
      </div>

      <div class="space-y-6">
        <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-600">
              <FileText class="h-5 w-5" />
            </span>
            <div>
              <h2 class="text-lg font-semibold text-slate-950">{{ t('lettersPage.preview.title') }}</h2>
              <p class="mt-1 text-sm text-slate-500">{{ t('lettersPage.preview.description') }}</p>
            </div>
          </div>

          <div v-if="previewLetter" class="mt-6 space-y-5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {{ typeLabel(previewLetter.type) }}
              </span>
              <span v-if="'checkRiskScore' in previewLetter" :class="['rounded-full px-2.5 py-1 text-xs font-medium', riskTone(previewLetter.checkRiskScore)]">
                {{ previewLetter.checkRiskScore ? t(`checksPage.risk.${previewLetter.checkRiskScore}`) : t('checksPage.risk.none') }}
              </span>
              <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {{ t('lettersPage.preview.saved') }}
              </span>
            </div>

            <div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-5 py-5">
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('lettersPage.preview.subject') }}</p>
              <p class="mt-2 text-base font-semibold text-slate-950">
                {{ previewLetter.subject }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
                :disabled="exportPendingId === previewLetter.id"
                @click="handleExportPdf(previewLetter.id)"
              >
                <LoaderCircle v-if="exportPendingId === previewLetter.id" class="h-4 w-4 animate-spin" />
                <Download v-else class="h-4 w-4" />
                <span>{{ t('lettersPage.actions.exportPdf') }}</span>
              </button>
            </div>

            <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('lettersPage.preview.body') }}</p>
              <pre class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{{ previewLetter.bodyText }}</pre>
            </div>

            <div
              v-if="'variables' in previewLetter && previewLetter.variables?.length"
              class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5"
            >
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('lettersPage.preview.variables') }}</p>
              <div class="mt-3 grid gap-3">
                <div
                  v-for="variable in previewLetter.variables"
                  :key="variable.key"
                  class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-medium text-slate-900">{{ variable.label }}</p>
                    <span class="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {{ t(`lettersPage.preview.sources.${variable.source}`) }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm leading-6 text-slate-600">{{ variable.value }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p class="text-sm font-medium text-slate-700">{{ t('lettersPage.preview.emptyTitle') }}</p>
            <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('lettersPage.preview.emptyDescription') }}</p>
          </div>
        </section>

        <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-950">{{ t('lettersPage.saved.title') }}</h2>
              <p class="mt-1 text-sm text-slate-500">{{ t('lettersPage.saved.description') }}</p>
            </div>
            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {{ letters.length }}
            </span>
          </div>

          <div v-if="lettersPending" class="mt-5 flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle class="h-4 w-4 animate-spin" />
            <span>{{ t('common.loading') }}</span>
          </div>

          <div v-else-if="letters.length" class="mt-5 grid gap-4">
            <button
              v-for="letter in letters"
              :key="letter.id"
              type="button"
              class="w-full rounded-[1.25rem] border px-5 py-5 text-left transition"
              :class="selectedSavedLetterId === letter.id ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-slate-300'"
              @click="selectedSavedLetterId = letter.id"
            >
              <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {{ typeLabel(letter.type) }}
                    </span>
                    <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', riskTone(letter.checkRiskScore)]">
                      {{ letter.checkRiskScore ? t(`checksPage.risk.${letter.checkRiskScore}`) : t('checksPage.risk.none') }}
                    </span>
                  </div>
                  <p class="mt-3 truncate text-base font-semibold text-slate-950">{{ letter.subject }}</p>
                  <p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{{ letter.bodyText }}</p>
                </div>

                <div class="shrink-0 text-sm text-slate-500">
                  <p>{{ formatDate(letter.createdAt) }}</p>
                  <p class="mt-1">{{ letter.caseTitle || t('lettersPage.saved.noCase') }}</p>
                </div>
              </div>
            </button>
          </div>

          <div v-else class="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p class="text-sm font-medium text-slate-700">{{ t('lettersPage.saved.emptyTitle') }}</p>
            <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('lettersPage.saved.emptyDescription') }}</p>
            <span class="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white">
              <Save class="h-4 w-4" />
              <span>{{ t('lettersPage.saved.emptyHint') }}</span>
            </span>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>
