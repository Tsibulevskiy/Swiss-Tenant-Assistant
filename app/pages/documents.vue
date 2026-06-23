<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Download,
  Eye,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  Upload
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed' | 'deleted'
type ExtractionStatus = 'pending' | 'running' | 'completed' | 'failed'

type DocumentListItem = {
  id: number
  caseId: number | null
  kind: string
  originalName: string
  mimeType: string
  fileSize: number
  status: DocumentStatus | string
  createdAt: string | Date
  updatedAt: string | Date
}

type DocumentsResponse = {
  ok: true
  data: {
    items: DocumentListItem[]
  }
}

type DownloadLinkResponse = {
  ok: true
  data: {
    downloadUrl: string
  }
}

type CreateCheckResponse = {
  ok: true
  data: {
    caseId: number | null
    checkId: number
    reused: boolean
  }
}

type DocumentDetailResponse = {
  ok: true
  data: {
    document: {
      id: number
      userId: number
      caseId: number | null
      kind: string
      originalName: string
      storagePath: string
      mimeType: string
      fileSize: number
      sha256: string
      isEncrypted: boolean
      status: DocumentStatus | string
      deleteAfterAt: string | Date | null
      createdAt: string | Date
      updatedAt: string | Date
    }
    extraction: null | {
      id: number
      engine: string
      status: ExtractionStatus | string
      confidenceScore: string | null
      errorMessage: string | null
      structuredDataJson: unknown
      createdAt: string | Date
      updatedAt: string | Date
    }
  }
}

const { t, locale } = useI18n()
const localePath = useLocalePath()

const fileInput = ref<HTMLInputElement | null>(null)

const kindOptions = computed(() => [
  { value: 'mietvertrag', label: t('documentsPage.kinds.mietvertrag') },
  { value: 'nebenkostenabrechnung', label: t('documentsPage.kinds.nebenkostenabrechnung') },
  { value: 'rent_increase_letter', label: t('documentsPage.kinds.rent_increase_letter') },
  { value: 'landlord_letter', label: t('documentsPage.kinds.landlord_letter') },
  { value: 'other', label: t('documentsPage.kinds.other') }
])

const statusOptions = computed(() => [
  { value: 'uploaded', label: t('documentsPage.status.uploaded') },
  { value: 'processing', label: t('documentsPage.status.processing') },
  { value: 'ready', label: t('documentsPage.status.ready') },
  { value: 'failed', label: t('documentsPage.status.failed') }
])

const selectedKind = ref(kindOptions.value[0]?.value || 'mietvertrag')
const selectedFile = ref<File | null>(null)
const uploadError = ref('')
const uploadSuccess = ref('')
const uploadPending = ref(false)
const downloadPendingId = ref<number | null>(null)
const createCheckPendingId = ref<number | null>(null)
const createCheckError = ref('')
const searchQuery = ref('')
const kindFilter = ref('all')
const statusFilter = ref('all')
const previewPending = ref(false)
const previewError = ref('')
const previewDocumentId = ref<number | null>(null)
const previewData = ref<DocumentDetailResponse['data'] | null>(null)

const { data, pending, refresh } = await useAsyncData('documents-list', () => $fetch<DocumentsResponse>('/api/documents'))

const documents = computed(() => data.value?.data.items || [])
const totalDocuments = computed(() => documents.value.length)
const readyDocuments = computed(() => documents.value.filter(item => item.status === 'ready').length)
const processingDocuments = computed(() => documents.value.filter(item => item.status === 'processing').length)

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return documents.value.filter(document => {
    const matchesQuery = !query
      || document.originalName.toLowerCase().includes(query)
      || document.mimeType.toLowerCase().includes(query)
    const matchesKind = kindFilter.value === 'all' || document.kind === kindFilter.value
    const matchesStatus = statusFilter.value === 'all' || document.status === statusFilter.value

    return matchesQuery && matchesKind && matchesStatus
  })
})

const selectedPreviewSummary = computed(() => (
  documents.value.find(document => document.id === previewDocumentId.value) || null
))

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

function formatFileSize(value: number) {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function statusTone(status: string) {
  if (status === 'ready') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (status === 'processing') {
    return 'bg-amber-50 text-amber-700'
  }

  if (status === 'failed') {
    return 'bg-rose-50 text-rose-700'
  }

  if (status === 'uploaded') {
    return 'bg-sky-50 text-sky-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function documentProgress(status: string) {
  if (status === 'ready') {
    return 100
  }

  if (status === 'processing') {
    return 65
  }

  if (status === 'failed') {
    return 100
  }

  return 20
}

function documentStatusDetail(status: string) {
  if (status === 'ready') {
    return t('documentsPage.statusDetails.ready')
  }

  if (status === 'processing') {
    return t('documentsPage.statusDetails.processing')
  }

  if (status === 'failed') {
    return t('documentsPage.statusDetails.failed')
  }

  return t('documentsPage.statusDetails.uploaded')
}

function supportsCheckCreation(kind: string) {
  return ['mietvertrag', 'nebenkostenabrechnung', 'rent_increase_letter', 'deduction_list'].includes(kind)
}

function setSelectedFile(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] || null
  uploadError.value = ''
  uploadSuccess.value = ''
}

function clearSelectedFile() {
  selectedFile.value = null

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleRefresh() {
  await refresh()
}

async function uploadDocument() {
  uploadError.value = ''
  uploadSuccess.value = ''

  if (!selectedFile.value) {
    uploadError.value = t('documentsPage.upload.errors.fileRequired')
    return
  }

  uploadPending.value = true

  try {
    const formData = new FormData()
    formData.append('kind', selectedKind.value)
    formData.append('file', selectedFile.value)

    await $fetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    })

    uploadSuccess.value = t('documentsPage.upload.success')
    clearSelectedFile()
    await refresh()
  } catch (error: any) {
    uploadError.value = error?.data?.statusMessage || error?.statusMessage || t('documentsPage.upload.errors.generic')
  } finally {
    uploadPending.value = false
  }
}

async function downloadDocument(documentId: number) {
  downloadPendingId.value = documentId

  try {
    const response = await $fetch<DownloadLinkResponse>(`/api/documents/${documentId}/download-link`, {
      method: 'POST',
      body: {
        expiresInMinutes: 15
      }
    })

    await navigateTo(response.data.downloadUrl, {
      external: true,
      open: {
        target: '_blank'
      }
    })
  } finally {
    downloadPendingId.value = null
  }
}

async function createCheck(documentId: number) {
  createCheckError.value = ''
  createCheckPendingId.value = documentId

  try {
    await $fetch<CreateCheckResponse>('/api/checks/from-document', {
      method: 'POST',
      body: {
        documentId
      }
    })

    await Promise.all([refresh(), navigateTo(localePath('/checks'))])
  } catch (error: any) {
    createCheckError.value = error?.data?.statusMessage || error?.statusMessage || t('documentsPage.actions.createCheckError')
  } finally {
    createCheckPendingId.value = null
  }
}

async function togglePreview(documentId: number) {
  if (previewDocumentId.value === documentId && previewData.value) {
    previewDocumentId.value = null
    previewData.value = null
    previewError.value = ''
    return
  }

  previewPending.value = true
  previewError.value = ''
  previewDocumentId.value = documentId

  try {
    const response = await $fetch<DocumentDetailResponse>(`/api/documents/${documentId}`)
    previewData.value = response.data
  } catch (error: any) {
    previewData.value = null
    previewError.value = error?.data?.statusMessage || error?.statusMessage || t('documentsPage.preview.errors.generic')
  } finally {
    previewPending.value = false
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

const previewExtractionSummary = computed(() => {
  const extraction = previewData.value?.extraction

  if (!extraction) {
    return null
  }

  const structuredRoot = asRecord(extraction.structuredDataJson)
  const structuredExtraction = asRecord(structuredRoot?.structuredExtraction)
  const extractor = asRecord(structuredExtraction?.extractor)
  const candidates = asRecord(structuredExtraction?.candidates)
  const extracted = asRecord(structuredExtraction?.extracted)
  const amountCandidates = Array.isArray(candidates?.amounts) ? candidates?.amounts.length : 0
  const dateCandidates = Array.isArray(candidates?.dates) ? candidates?.dates.length : 0
  const lineItems = Array.isArray(extracted?.lineItems) ? extracted?.lineItems.length : 0

  return {
    schema: typeof structuredExtraction?.schema === 'string' ? structuredExtraction.schema : '—',
    normalizedTextLength: typeof extractor?.normalizedTextLength === 'number' ? extractor.normalizedTextLength : null,
    dateCandidates,
    amountCandidates,
    lineItems
  }
})
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {{ t('documentsPage.eyebrow') }}
          </p>
          <h1 class="mt-4 text-[2rem] font-semibold tracking-tight text-slate-950">
            {{ t('documentsPage.title') }}
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
            {{ t('documentsPage.description') }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          @click="handleRefresh"
        >
          <RefreshCw class="h-4 w-4" />
          <span>{{ t('documentsPage.actions.refresh') }}</span>
        </button>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-3">
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('documentsPage.stats.total') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ totalDocuments }}</p>
        </div>
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('documentsPage.stats.ready') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ readyDocuments }}</p>
        </div>
        <div class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5">
          <p class="text-xs font-medium text-slate-500">{{ t('documentsPage.stats.processing') }}</p>
          <p class="mt-2 text-[2rem] font-semibold text-slate-950">{{ processingDocuments }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold text-slate-950">
          {{ t('documentsPage.upload.title') }}
        </h2>
      </div>

      <div class="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_auto]">
        <label class="space-y-2">
          <span class="text-sm font-medium text-slate-700">{{ t('documentsPage.upload.kindLabel') }}</span>
          <select
            v-model="selectedKind"
            class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
          >
            <option v-for="option in kindOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="text-sm font-medium text-slate-700">{{ t('documentsPage.upload.fileLabel') }}</span>
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            class="block h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-medium"
            @change="setSelectedFile"
          >
        </label>

        <div class="flex items-end">
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="uploadPending || !selectedFile"
            @click="uploadDocument"
          >
            <LoaderCircle v-if="uploadPending" class="h-4 w-4 animate-spin" />
            <Upload v-else class="h-4 w-4" />
            <span>{{ t('documentsPage.upload.submit') }}</span>
          </button>
        </div>
      </div>

      <div class="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-slate-900">
              {{ selectedFile ? t('documentsPage.upload.selectedFile') : t('documentsPage.upload.readyToUpload') }}
            </p>
            <p class="mt-1 text-sm text-slate-500">
              <span v-if="selectedFile">{{ selectedFile.name }} · {{ formatFileSize(selectedFile.size) }}</span>
              <span v-else>{{ t('documentsPage.upload.helper') }}</span>
            </p>
          </div>

          <div v-if="uploadPending" class="min-w-[220px] flex-1 xl:max-w-[320px]">
            <div class="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>{{ t('documentsPage.upload.uploading') }}</span>
              <span>{{ t('documentsPage.status.processing') }}</span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        <p v-if="uploadError" class="mt-3 flex items-center gap-2 text-sm text-rose-600">
          <CircleAlert class="h-4 w-4" />
          <span>{{ uploadError }}</span>
        </p>
        <p v-else-if="uploadSuccess" class="mt-3 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 class="h-4 w-4" />
          <span>{{ uploadSuccess }}</span>
        </p>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-950">
            {{ t('documentsPage.list.title') }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            {{ t('documentsPage.filters.results', { count: filteredDocuments.length, total: documents.length }) }}
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 xl:min-w-[720px]">
          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('documentsPage.filters.searchLabel') }}</span>
            <div class="relative">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('documentsPage.filters.searchPlaceholder')"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
              >
            </div>
          </label>

          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('documentsPage.filters.kindLabel') }}</span>
            <select
              v-model="kindFilter"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            >
              <option value="all">{{ t('documentsPage.filters.kindAll') }}</option>
              <option v-for="option in kindOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{{ t('documentsPage.filters.statusLabel') }}</span>
            <select
              v-model="statusFilter"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            >
              <option value="all">{{ t('documentsPage.filters.statusAll') }}</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <p v-if="createCheckError" class="mt-3 flex items-center gap-2 text-sm text-rose-600">
        <CircleAlert class="h-4 w-4" />
        <span>{{ createCheckError }}</span>
      </p>

      <div v-if="pending" class="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle class="h-4 w-4 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="filteredDocuments.length" class="mt-5 space-y-5">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead>
              <tr class="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th class="pb-3 pr-4">{{ t('documentsPage.table.name') }}</th>
                <th class="pb-3 pr-4">{{ t('documentsPage.table.kind') }}</th>
                <th class="pb-3 pr-4">{{ t('documentsPage.table.size') }}</th>
                <th class="pb-3 pr-4">{{ t('documentsPage.table.status') }}</th>
                <th class="pb-3 pr-4">{{ t('documentsPage.table.uploaded') }}</th>
                <th class="pb-3 text-right">{{ t('documentsPage.table.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="document in filteredDocuments"
                :key="document.id"
                class="border-b border-slate-100 last:border-b-0"
              >
                <td class="py-4 pr-4">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                      <FileText class="h-4 w-4" />
                    </span>
                    <div>
                      <p class="text-sm font-medium text-slate-800">{{ document.originalName }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ document.mimeType }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 pr-4 text-sm text-slate-600">
                  {{ t(`documentsPage.kinds.${document.kind}`, document.kind) }}
                </td>
                <td class="py-4 pr-4 text-sm text-slate-600">
                  {{ formatFileSize(document.fileSize) }}
                </td>
                <td class="py-4 pr-4">
                  <div class="space-y-2">
                    <span :class="['inline-flex rounded-full px-2.5 py-1 text-xs font-medium', statusTone(document.status)]">
                      {{ t(`documentsPage.status.${document.status}`, document.status) }}
                    </span>
                    <div class="max-w-[180px]">
                      <div class="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          class="h-full rounded-full"
                          :class="document.status === 'failed' ? 'bg-rose-500' : 'bg-emerald-500'"
                          :style="{ width: `${documentProgress(document.status)}%` }"
                        />
                      </div>
                      <p class="mt-1 text-xs text-slate-500">
                        {{ documentStatusDetail(document.status) }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="py-4 pr-4 text-sm text-slate-500">
                  {{ formatDate(document.createdAt) }}
                </td>
                <td class="py-4 text-right">
                  <div class="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60"
                      :disabled="previewPending && previewDocumentId === document.id"
                      @click="togglePreview(document.id)"
                    >
                      <LoaderCircle v-if="previewPending && previewDocumentId === document.id" class="h-4 w-4 animate-spin" />
                      <Eye v-else class="h-4 w-4" />
                      <span>{{ t('documentsPage.actions.preview') }}</span>
                    </button>

                    <button
                      v-if="supportsCheckCreation(document.kind)"
                      type="button"
                      class="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      :disabled="createCheckPendingId === document.id"
                      @click="createCheck(document.id)"
                    >
                      <LoaderCircle v-if="createCheckPendingId === document.id" class="h-4 w-4 animate-spin" />
                      <ArrowRight v-else class="h-4 w-4" />
                      <span>{{ t('documentsPage.actions.createCheck') }}</span>
                    </button>

                    <button
                      type="button"
                      class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60"
                      :disabled="downloadPendingId === document.id"
                      @click="downloadDocument(document.id)"
                    >
                      <LoaderCircle v-if="downloadPendingId === document.id" class="h-4 w-4 animate-spin" />
                      <Download v-else class="h-4 w-4" />
                      <span>{{ t('documentsPage.actions.download') }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-base font-semibold text-slate-950">
                {{ t('documentsPage.preview.title') }}
              </h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ selectedPreviewSummary ? selectedPreviewSummary.originalName : t('documentsPage.preview.empty') }}
              </p>
            </div>
          </div>

          <p v-if="previewError" class="mt-4 flex items-center gap-2 text-sm text-rose-600">
            <CircleAlert class="h-4 w-4" />
            <span>{{ previewError }}</span>
          </p>

          <div v-else-if="previewPending" class="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle class="h-4 w-4 animate-spin" />
            <span>{{ t('common.loading') }}</span>
          </div>

          <div v-else-if="previewData" class="mt-4 grid gap-4 xl:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-white px-4 py-4">
              <h4 class="text-sm font-semibold text-slate-900">{{ t('documentsPage.preview.documentMeta') }}</h4>
              <dl class="mt-4 space-y-3 text-sm">
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.documentId') }}</dt>
                  <dd class="text-right font-medium text-slate-800">{{ previewData.document.id }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.caseId') }}</dt>
                  <dd class="text-right font-medium text-slate-800">{{ previewData.document.caseId ?? '—' }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.mimeType') }}</dt>
                  <dd class="text-right font-medium text-slate-800">{{ previewData.document.mimeType }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.fileSize') }}</dt>
                  <dd class="text-right font-medium text-slate-800">{{ formatFileSize(previewData.document.fileSize) }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.encrypted') }}</dt>
                  <dd class="text-right font-medium text-slate-800">{{ previewData.document.isEncrypted ? t('documentsPage.preview.values.yes') : t('documentsPage.preview.values.no') }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.uploadedAt') }}</dt>
                  <dd class="text-right font-medium text-slate-800">{{ formatDateTime(previewData.document.createdAt) }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.updatedAt') }}</dt>
                  <dd class="text-right font-medium text-slate-800">{{ formatDateTime(previewData.document.updatedAt) }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.retention') }}</dt>
                  <dd class="text-right font-medium text-slate-800">{{ formatDate(previewData.document.deleteAfterAt) }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-slate-500">{{ t('documentsPage.preview.labels.checksum') }}</dt>
                  <dd class="max-w-[220px] break-all text-right font-medium text-slate-800">{{ previewData.document.sha256 }}</dd>
                </div>
              </dl>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white px-4 py-4">
              <h4 class="text-sm font-semibold text-slate-900">{{ t('documentsPage.preview.extractionMeta') }}</h4>

              <div v-if="previewData.extraction" class="mt-4">
                <dl class="space-y-3 text-sm">
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.extractionEngine') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ previewData.extraction.engine }}</dd>
                  </div>
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.extractionStatus') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ previewData.extraction.status }}</dd>
                  </div>
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.extractionConfidence') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ previewData.extraction.confidenceScore ? `${previewData.extraction.confidenceScore}%` : '—' }}</dd>
                  </div>
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.extractionCreatedAt') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ formatDateTime(previewData.extraction.createdAt) }}</dd>
                  </div>
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.extractionSchema') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ previewExtractionSummary?.schema || '—' }}</dd>
                  </div>
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.normalizedLength') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ previewExtractionSummary?.normalizedTextLength ?? '—' }}</dd>
                  </div>
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.dateCandidates') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ previewExtractionSummary?.dateCandidates ?? 0 }}</dd>
                  </div>
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.amountCandidates') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ previewExtractionSummary?.amountCandidates ?? 0 }}</dd>
                  </div>
                  <div class="flex items-start justify-between gap-4">
                    <dt class="text-slate-500">{{ t('documentsPage.preview.labels.lineItems') }}</dt>
                    <dd class="text-right font-medium text-slate-800">{{ previewExtractionSummary?.lineItems ?? 0 }}</dd>
                  </div>
                </dl>

                <p v-if="previewData.extraction.errorMessage" class="mt-4 rounded-xl bg-rose-50 px-3 py-3 text-sm text-rose-700">
                  <span class="font-medium">{{ t('documentsPage.preview.labels.extractionError') }}:</span>
                  {{ previewData.extraction.errorMessage }}
                </p>
              </div>

              <p v-else class="mt-4 text-sm text-slate-500">
                {{ t('documentsPage.preview.noExtraction') }}
              </p>
            </div>
          </div>

          <p v-else class="mt-4 text-sm text-slate-500">
            {{ t('documentsPage.preview.empty') }}
          </p>
        </div>
      </div>

      <div v-else class="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p class="text-sm font-medium text-slate-700">{{ t('documentsPage.empty.title') }}</p>
        <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('documentsPage.empty.description') }}</p>
      </div>
    </section>
  </div>
</template>
