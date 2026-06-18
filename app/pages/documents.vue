<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Download, FileText, LoaderCircle, RefreshCw, Upload } from 'lucide-vue-next'

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

const { t, locale } = useI18n()
const localePath = useLocalePath()

const kindOptions = computed(() => [
  { value: 'mietvertrag', label: t('documentsPage.kinds.mietvertrag') },
  { value: 'nebenkostenabrechnung', label: t('documentsPage.kinds.nebenkostenabrechnung') },
  { value: 'rent_increase_letter', label: t('documentsPage.kinds.rentIncrease') },
  { value: 'landlord_letter', label: t('documentsPage.kinds.landlordLetter') },
  { value: 'other', label: t('documentsPage.kinds.other') }
])

const selectedKind = ref(kindOptions.value[0]?.value || 'mietvertrag')
const selectedFile = ref<File | null>(null)
const uploadError = ref('')
const uploadPending = ref(false)
const downloadPendingId = ref<number | null>(null)
const createCheckPendingId = ref<number | null>(null)
const createCheckError = ref('')

const { data, pending, refresh } = await useAsyncData('documents-list', () => $fetch<DocumentsResponse>('/api/documents'))

const documents = computed(() => data.value?.data.items || [])
const totalDocuments = computed(() => documents.value.length)
const readyDocuments = computed(() => documents.value.filter(item => item.status === 'ready').length)
const processingDocuments = computed(() => documents.value.filter(item => item.status === 'processing').length)

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

  return 'bg-slate-100 text-slate-600'
}

function supportsCheckCreation(kind: string) {
  return ['mietvertrag', 'nebenkostenabrechnung', 'rent_increase_letter', 'deduction_list'].includes(kind)
}

function setSelectedFile(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] || null
}

async function uploadDocument() {
  uploadError.value = ''

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

    selectedFile.value = null
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
            :disabled="uploadPending"
            @click="uploadDocument"
          >
            <LoaderCircle v-if="uploadPending" class="h-4 w-4 animate-spin" />
            <Upload v-else class="h-4 w-4" />
            <span>{{ t('documentsPage.upload.submit') }}</span>
          </button>
        </div>
      </div>

      <p v-if="uploadError" class="mt-3 text-sm text-rose-600">
        {{ uploadError }}
      </p>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold text-slate-950">
          {{ t('documentsPage.list.title') }}
        </h2>
      </div>

      <p v-if="createCheckError" class="mt-3 text-sm text-rose-600">
        {{ createCheckError }}
      </p>

      <div v-if="pending" class="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle class="h-4 w-4 animate-spin" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="documents.length" class="mt-5 overflow-x-auto">
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
              v-for="document in documents"
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
                <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', statusTone(document.status)]">
                  {{ t(`documentsPage.status.${document.status}`, document.status) }}
                </span>
              </td>
              <td class="py-4 pr-4 text-sm text-slate-500">
                {{ formatDate(document.createdAt) }}
              </td>
              <td class="py-4 text-right">
                <div class="flex justify-end gap-2">
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

      <div v-else class="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p class="text-sm font-medium text-slate-700">{{ t('documentsPage.empty.title') }}</p>
        <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('documentsPage.empty.description') }}</p>
      </div>
    </section>
  </div>
</template>
