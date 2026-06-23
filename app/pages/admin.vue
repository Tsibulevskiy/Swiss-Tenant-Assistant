<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import { AlertTriangle, Bot, CreditCard, FileSearch, FolderOpen, RefreshCw, Shield, Users } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: ['admin'] })

type AdminOverviewResponse = {
  ok: true
  data: {
    summary: {
      users: number
      payments: number
      checks: number
      documents: number
      aiRuns: number
      systemErrors: number
    }
    users: Array<{
      id: number
      email: string
      role: string
      locale: string
      firstName: string | null
      lastName: string | null
      emailVerifiedAt: string | Date | null
      createdAt: string | Date
      deletedAt: string | Date | null
    }>
    payments: Array<{
      id: number
      userEmail: string | null
      productName: string | null
      amount: string
      currency: string
      provider: string
      providerSessionId: string | null
      providerPaymentIntentId: string | null
      status: string
      checkId: number | null
      caseId: number | null
      createdAt: string | Date
      paidAt: string | Date | null
    }>
    checks: Array<{
      id: number
      userEmail: string | null
      caseId: number
      caseTitle: string | null
      type: string
      status: string
      riskScore: string | null
      summaryText: string | null
      errorMessage: string | null
      createdAt: string | Date
      finishedAt: string | Date | null
    }>
    documents: Array<{
      id: number
      userEmail: string | null
      caseId: number | null
      caseTitle: string | null
      kind: string
      originalName: string
      mimeType: string
      status: string
      fileSize: number
      createdAt: string | Date
      deletedAt: string | Date | null
    }>
    aiRuns: Array<{
      id: number
      userEmail: string | null
      caseId: number | null
      checkId: number | null
      purpose: string
      model: string
      promptVersion: string
      status: string
      tokenInput: number | null
      tokenOutput: number | null
      errorMessage: string | null
      inputJson: unknown
      outputJson: unknown
      createdAt: string | Date
      finishedAt: string | Date | null
    }>
    systemErrors: Array<{
      id: number
      scope: string
      relatedEntityType: string | null
      relatedEntityId: number | null
      message: string
      stackTrace: string | null
      status: string
      createdAt: string | Date
      resolvedAt: string | Date | null
    }>
  }
}

const { locale } = useI18n()

const {
  data,
  pending,
  refresh
} = await useAsyncData('admin-overview', () => $fetch<AdminOverviewResponse>('/api/admin/overview'))

const currentTab = ref<'users' | 'payments' | 'checks' | 'documents' | 'aiRuns' | 'systemErrors'>('users')
const searchQuery = ref('')
const statusFilter = ref('all')
const selectedRecordId = ref<number | null>(null)
const actionPending = ref(false)
const actionMessage = ref<string | null>(null)
const actionError = ref<string | null>(null)

const isGerman = computed(() => locale.value.startsWith('de'))

const labels = computed(() => isGerman.value ? {
  eyebrow: 'Admin',
  title: 'Operative Uebersicht',
  description: 'Zentrale Sicht auf Benutzer, Zahlungen, Checks, Dokumente, AI-Laeufe und Systemfehler.',
  refresh: 'Aktualisieren',
  users: 'Users',
  payments: 'Payments',
  checks: 'Checks',
  documents: 'Documents',
  aiRuns: 'AI logs',
  systemErrors: 'System errors',
  empty: 'Keine Eintraege vorhanden.',
  search: 'Suche',
  searchPlaceholder: 'Nach ID, E-Mail, Status oder Referenz suchen',
  filterStatus: 'Filter',
  filterAll: 'Alle',
  details: 'Details',
  selectRecord: 'Waehlen Sie einen Eintrag aus, um die Details zu sehen.',
  openDetails: 'Details',
  closeDetails: 'Schliessen',
  retry: 'Retry',
  reprocess: 'Reprocess',
  forceRerun: 'Force re-run',
  actionSuccess: 'Aktion abgeschlossen.',
  actionError: 'Aktion fehlgeschlagen.',
  createdAt: 'Erstellt',
  status: 'Status',
  user: 'User',
  actions: 'Aktionen',
  email: 'E-Mail',
  role: 'Rolle',
  locale: 'Sprache',
  verified: 'Verifiziert',
  product: 'Produkt',
  amount: 'Betrag',
  provider: 'Provider',
  checkType: 'Check-Typ',
  risk: 'Risiko',
  summary: 'Zusammenfassung',
  case: 'Fall',
  file: 'Datei',
  kind: 'Typ',
  size: 'Groesse',
  purpose: 'Zweck',
  model: 'Modell',
  tokens: 'Tokens',
  scope: 'Bereich',
  message: 'Meldung',
  entity: 'Entity',
  completedAt: 'Abgeschlossen',
  paidAt: 'Bezahlt',
  resolvedAt: 'Geloest',
  yes: 'Ja',
  no: 'Nein'
} : {
  eyebrow: 'Admin',
  title: 'Operations overview',
  description: 'Central view of users, payments, checks, documents, AI runs, and system errors.',
  refresh: 'Refresh',
  users: 'Users',
  payments: 'Payments',
  checks: 'Checks',
  documents: 'Documents',
  aiRuns: 'AI logs',
  systemErrors: 'System errors',
  empty: 'No records available.',
  search: 'Search',
  searchPlaceholder: 'Search by ID, email, status, or reference',
  filterStatus: 'Filter',
  filterAll: 'All',
  details: 'Details',
  selectRecord: 'Select a record to inspect the details.',
  openDetails: 'Details',
  closeDetails: 'Close',
  retry: 'Retry',
  reprocess: 'Reprocess',
  forceRerun: 'Force re-run',
  actionSuccess: 'Action completed.',
  actionError: 'Action failed.',
  createdAt: 'Created',
  status: 'Status',
  user: 'User',
  actions: 'Actions',
  email: 'Email',
  role: 'Role',
  locale: 'Locale',
  verified: 'Verified',
  product: 'Product',
  amount: 'Amount',
  provider: 'Provider',
  checkType: 'Check type',
  risk: 'Risk',
  summary: 'Summary',
  case: 'Case',
  file: 'File',
  kind: 'Kind',
  size: 'Size',
  purpose: 'Purpose',
  model: 'Model',
  tokens: 'Tokens',
  scope: 'Scope',
  message: 'Message',
  entity: 'Entity',
  completedAt: 'Completed',
  paidAt: 'Paid',
  resolvedAt: 'Resolved',
  yes: 'Yes',
  no: 'No'
})

const tabs = computed(() => [
  { key: 'users', label: labels.value.users, icon: markRaw(Users), count: data.value?.data.summary.users || 0 },
  { key: 'payments', label: labels.value.payments, icon: markRaw(CreditCard), count: data.value?.data.summary.payments || 0 },
  { key: 'checks', label: labels.value.checks, icon: markRaw(FileSearch), count: data.value?.data.summary.checks || 0 },
  { key: 'documents', label: labels.value.documents, icon: markRaw(FolderOpen), count: data.value?.data.summary.documents || 0 },
  { key: 'aiRuns', label: labels.value.aiRuns, icon: markRaw(Bot), count: data.value?.data.summary.aiRuns || 0 },
  { key: 'systemErrors', label: labels.value.systemErrors, icon: markRaw(AlertTriangle), count: data.value?.data.summary.systemErrors || 0 }
])

async function handleRefresh() {
  await refresh()
}

function resetAdminSelection() {
  selectedRecordId.value = null
}

function setCurrentTab(tab: typeof currentTab.value) {
  currentTab.value = tab
  searchQuery.value = ''
  statusFilter.value = 'all'
  resetAdminSelection()
  actionMessage.value = null
  actionError.value = null
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(isGerman.value ? 'de-CH' : 'en-CH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function formatCurrency(amount: string, currency: string) {
  const numeric = Number(amount)

  return new Intl.NumberFormat(isGerman.value ? 'de-CH' : 'en-CH', {
    style: 'currency',
    currency
  }).format(Number.isFinite(numeric) ? numeric : 0)
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function badgeTone(value: string | null | undefined) {
  const normalized = (value || '').toLowerCase()

  if (['failed', 'high', 'open', 'payment_required', 'expired'].includes(normalized)) {
    return 'bg-rose-50 text-rose-700'
  }

  if (['pending', 'processing', 'warning', 'medium', 'checkout_created'].includes(normalized)) {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-emerald-50 text-emerald-700'
}

function truncate(value: string | null | undefined, length = 120) {
  if (!value) {
    return '—'
  }

  return value.length > length ? `${value.slice(0, length)}…` : value
}

function stringifyUnknown(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return '[unserializable]'
  }
}

function getStatusOptions() {
  switch (currentTab.value) {
    case 'users':
      return ['all', 'admin', 'user']
    case 'payments':
      return ['all', 'pending', 'checkout_created', 'paid', 'failed', 'expired']
    case 'checks':
      return ['all', 'draft', 'extracting', 'analyzing', 'payment_required', 'ready', 'failed']
    case 'documents':
      return ['all', 'uploaded', 'processing', 'ready', 'failed', 'deleted']
    case 'aiRuns':
      return ['all', 'pending', 'completed', 'failed']
    case 'systemErrors':
      return ['all', 'open', 'resolved', 'ignored']
  }
}

const statusOptions = computed(() => getStatusOptions())

function matchesSearch(item: Record<string, unknown>) {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return true
  }

  return Object.values(item).some(value => stringifyUnknown(value).toLowerCase().includes(query))
}

function matchesStatus(item: Record<string, unknown>) {
  if (statusFilter.value === 'all') {
    return true
  }

  const statusLike = [
    item.status,
    item.role,
    item.scope,
    item.purpose
  ].map(value => stringifyUnknown(value).toLowerCase())

  return statusLike.includes(statusFilter.value.toLowerCase())
}

const filteredUsers = computed(() => (data.value?.data.users || [])
  .filter(item => matchesSearch(item as unknown as Record<string, unknown>) && matchesStatus(item as unknown as Record<string, unknown>)))
const filteredPayments = computed(() => (data.value?.data.payments || [])
  .filter(item => matchesSearch(item as unknown as Record<string, unknown>) && matchesStatus(item as unknown as Record<string, unknown>)))
const filteredChecks = computed(() => (data.value?.data.checks || [])
  .filter(item => matchesSearch(item as unknown as Record<string, unknown>) && matchesStatus(item as unknown as Record<string, unknown>)))
const filteredDocuments = computed(() => (data.value?.data.documents || [])
  .filter(item => matchesSearch(item as unknown as Record<string, unknown>) && matchesStatus(item as unknown as Record<string, unknown>)))
const filteredAiRuns = computed(() => (data.value?.data.aiRuns || [])
  .filter(item => matchesSearch(item as unknown as Record<string, unknown>) && matchesStatus(item as unknown as Record<string, unknown>)))
const filteredSystemErrors = computed(() => (data.value?.data.systemErrors || [])
  .filter(item => matchesSearch(item as unknown as Record<string, unknown>) && matchesStatus(item as unknown as Record<string, unknown>)))

const selectedRecord = computed(() => {
  const collections = {
    users: filteredUsers.value,
    payments: filteredPayments.value,
    checks: filteredChecks.value,
    documents: filteredDocuments.value,
    aiRuns: filteredAiRuns.value,
    systemErrors: filteredSystemErrors.value
  }

  return collections[currentTab.value].find(item => item.id === selectedRecordId.value) || null
})

const selectedRecordEntries = computed(() => {
  if (!selectedRecord.value) {
    return []
  }

  return Object.entries(selectedRecord.value).map(([key, value]) => ({
    key,
    value: stringifyUnknown(value)
  }))
})

const canReprocessDocument = computed(() =>
  currentTab.value === 'documents'
  && selectedRecord.value
  && 'status' in selectedRecord.value
  && selectedRecord.value.status === 'failed'
)

const canRetryCheck = computed(() =>
  currentTab.value === 'checks'
  && selectedRecord.value
  && 'status' in selectedRecord.value
  && selectedRecord.value.status === 'failed'
)

async function runAdminAction(action: () => Promise<void>) {
  actionPending.value = true
  actionMessage.value = null
  actionError.value = null

  try {
    await action()
    actionMessage.value = labels.value.actionSuccess
    await refresh()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : labels.value.actionError
  } finally {
    actionPending.value = false
  }
}

async function handleDocumentReprocess() {
  const selected = selectedRecord.value

  if (!selected || currentTab.value !== 'documents') {
    return
  }

  await runAdminAction(async () => {
    await $fetch(`/api/admin/documents/${selected.id}/reprocess`, {
      method: 'POST'
    })
  })
}

async function handleCheckRerun(retryMode: 'reuse_extraction' | 'force_reextract') {
  const selected = selectedRecord.value

  if (!selected || currentTab.value !== 'checks') {
    return
  }

  await runAdminAction(async () => {
    await $fetch(`/api/admin/checks/${selected.id}/rerun`, {
      method: 'POST',
      body: {
        retryMode
      }
    })
  })
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-sm font-medium text-emerald-600">{{ labels.eyebrow }}</p>
          <h2 class="mt-2 text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.2rem]">
            {{ labels.title }}
          </h2>
          <p class="mt-2 text-sm text-slate-500 sm:text-base">
            {{ labels.description }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          @click="handleRefresh"
        >
          <RefreshCw class="h-4 w-4" :class="pending ? 'animate-spin' : ''" />
          <span>{{ labels.refresh }}</span>
        </button>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-6">
        <article
          v-for="tab in tabs"
          :key="tab.key"
          class="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <component :is="tab.icon" class="h-5 w-5" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">{{ tab.label }}</p>
              <p class="mt-2 text-[2rem] font-semibold leading-none text-slate-950">{{ tab.count }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-7">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="[
            'inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition',
            currentTab === tab.key
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
          ]"
          @click="setCurrentTab(tab.key as typeof currentTab)"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <div v-if="pending" class="mt-6 text-sm text-slate-500">
        Loading...
      </div>

      <div v-else class="mt-6 space-y-6">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label class="block">
            <span class="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">{{ labels.search }}</span>
            <input
              v-model="searchQuery"
              type="text"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
              :placeholder="labels.searchPlaceholder"
            >
          </label>

          <label class="block">
            <span class="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">{{ labels.filterStatus }}</span>
            <select
              v-model="statusFilter"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            >
              <option v-for="option in statusOptions" :key="option" :value="option">
                {{ option === 'all' ? labels.filterAll : option }}
              </option>
            </select>
          </label>
        </div>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <div>
        <div v-if="currentTab === 'users'">
          <div v-if="!filteredUsers.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            {{ labels.empty }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead>
                <tr class="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th class="pb-3 pr-4">ID</th>
                  <th class="pb-3 pr-4">{{ labels.email }}</th>
                  <th class="pb-3 pr-4">{{ labels.role }}</th>
                  <th class="pb-3 pr-4">{{ labels.locale }}</th>
                  <th class="pb-3 pr-4">{{ labels.verified }}</th>
                  <th class="pb-3">{{ labels.createdAt }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredUsers"
                  :key="item.id"
                  :class="['border-b border-slate-100 last:border-b-0 transition', selectedRecordId === item.id ? 'bg-emerald-50/60' : 'hover:bg-slate-50']"
                >
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.id }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.email }}</td>
                  <td class="py-4 pr-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.role)]">{{ item.role }}</span></td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ item.locale }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ item.emailVerifiedAt ? labels.yes : labels.no }}</td>
                  <td class="py-4 text-right text-sm">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-slate-500">{{ formatDate(item.createdAt) }}</span>
                      <button type="button" class="font-medium text-emerald-600" @click="selectedRecordId = item.id">
                        {{ labels.openDetails }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="currentTab === 'payments'">
          <div v-if="!filteredPayments.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            {{ labels.empty }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead>
                <tr class="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th class="pb-3 pr-4">ID</th>
                  <th class="pb-3 pr-4">{{ labels.user }}</th>
                  <th class="pb-3 pr-4">{{ labels.product }}</th>
                  <th class="pb-3 pr-4">{{ labels.amount }}</th>
                  <th class="pb-3 pr-4">{{ labels.provider }}</th>
                  <th class="pb-3 pr-4">{{ labels.status }}</th>
                  <th class="pb-3 pr-4">{{ labels.paidAt }}</th>
                  <th class="pb-3">{{ labels.createdAt }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredPayments"
                  :key="item.id"
                  :class="['border-b border-slate-100 last:border-b-0 transition', selectedRecordId === item.id ? 'bg-emerald-50/60' : 'hover:bg-slate-50']"
                >
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.id }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.userEmail || '—' }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.productName || '—' }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ formatCurrency(item.amount, item.currency) }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ item.provider }}</td>
                  <td class="py-4 pr-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.status)]">{{ item.status }}</span></td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ formatDate(item.paidAt) }}</td>
                  <td class="py-4 text-right text-sm">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-slate-500">{{ formatDate(item.createdAt) }}</span>
                      <button type="button" class="font-medium text-emerald-600" @click="selectedRecordId = item.id">
                        {{ labels.openDetails }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="currentTab === 'checks'">
          <div v-if="!filteredChecks.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            {{ labels.empty }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead>
                <tr class="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th class="pb-3 pr-4">ID</th>
                  <th class="pb-3 pr-4">{{ labels.user }}</th>
                  <th class="pb-3 pr-4">{{ labels.case }}</th>
                  <th class="pb-3 pr-4">{{ labels.checkType }}</th>
                  <th class="pb-3 pr-4">{{ labels.risk }}</th>
                  <th class="pb-3 pr-4">{{ labels.status }}</th>
                  <th class="pb-3 pr-4">{{ labels.summary }}</th>
                  <th class="pb-3">{{ labels.createdAt }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredChecks"
                  :key="item.id"
                  :class="['border-b border-slate-100 last:border-b-0 transition', selectedRecordId === item.id ? 'bg-emerald-50/60' : 'hover:bg-slate-50']"
                >
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.id }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.userEmail || '—' }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.caseTitle || '—' }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.type }}</td>
                  <td class="py-4 pr-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.riskScore)]">{{ item.riskScore || '—' }}</span></td>
                  <td class="py-4 pr-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.status)]">{{ item.status }}</span></td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ truncate(item.summaryText, 90) }}</td>
                  <td class="py-4 text-right text-sm">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-slate-500">{{ formatDate(item.createdAt) }}</span>
                      <button type="button" class="font-medium text-emerald-600" @click="selectedRecordId = item.id">
                        {{ labels.openDetails }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="currentTab === 'documents'">
          <div v-if="!filteredDocuments.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            {{ labels.empty }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead>
                <tr class="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th class="pb-3 pr-4">ID</th>
                  <th class="pb-3 pr-4">{{ labels.user }}</th>
                  <th class="pb-3 pr-4">{{ labels.file }}</th>
                  <th class="pb-3 pr-4">{{ labels.kind }}</th>
                  <th class="pb-3 pr-4">{{ labels.size }}</th>
                  <th class="pb-3 pr-4">{{ labels.status }}</th>
                  <th class="pb-3">{{ labels.createdAt }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredDocuments"
                  :key="item.id"
                  :class="['border-b border-slate-100 last:border-b-0 transition', selectedRecordId === item.id ? 'bg-emerald-50/60' : 'hover:bg-slate-50']"
                >
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.id }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.userEmail || '—' }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.originalName }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.kind }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ formatBytes(item.fileSize) }}</td>
                  <td class="py-4 pr-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.status)]">{{ item.status }}</span></td>
                  <td class="py-4 text-right text-sm">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-slate-500">{{ formatDate(item.createdAt) }}</span>
                      <button type="button" class="font-medium text-emerald-600" @click="selectedRecordId = item.id">
                        {{ labels.openDetails }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="currentTab === 'aiRuns'">
          <div v-if="!filteredAiRuns.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            {{ labels.empty }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead>
                <tr class="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th class="pb-3 pr-4">ID</th>
                  <th class="pb-3 pr-4">{{ labels.user }}</th>
                  <th class="pb-3 pr-4">{{ labels.purpose }}</th>
                  <th class="pb-3 pr-4">{{ labels.model }}</th>
                  <th class="pb-3 pr-4">{{ labels.tokens }}</th>
                  <th class="pb-3 pr-4">{{ labels.status }}</th>
                  <th class="pb-3 pr-4">{{ labels.message }}</th>
                  <th class="pb-3">{{ labels.createdAt }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredAiRuns"
                  :key="item.id"
                  :class="['border-b border-slate-100 last:border-b-0 transition', selectedRecordId === item.id ? 'bg-emerald-50/60' : 'hover:bg-slate-50']"
                >
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.id }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.userEmail || '—' }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.purpose }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.model }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ item.tokenInput || 0 }} / {{ item.tokenOutput || 0 }}</td>
                  <td class="py-4 pr-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.status)]">{{ item.status }}</span></td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ truncate(item.errorMessage, 80) }}</td>
                  <td class="py-4 text-right text-sm">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-slate-500">{{ formatDate(item.createdAt) }}</span>
                      <button type="button" class="font-medium text-emerald-600" @click="selectedRecordId = item.id">
                        {{ labels.openDetails }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else>
          <div v-if="!filteredSystemErrors.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            {{ labels.empty }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead>
                <tr class="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th class="pb-3 pr-4">ID</th>
                  <th class="pb-3 pr-4">{{ labels.scope }}</th>
                  <th class="pb-3 pr-4">{{ labels.entity }}</th>
                  <th class="pb-3 pr-4">{{ labels.message }}</th>
                  <th class="pb-3 pr-4">{{ labels.status }}</th>
                  <th class="pb-3 pr-4">{{ labels.resolvedAt }}</th>
                  <th class="pb-3">{{ labels.createdAt }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredSystemErrors"
                  :key="item.id"
                  :class="['border-b border-slate-100 last:border-b-0 transition', selectedRecordId === item.id ? 'bg-emerald-50/60' : 'hover:bg-slate-50']"
                >
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.id }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-700">{{ item.scope }}</td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ item.relatedEntityType || '—' }}<span v-if="item.relatedEntityId"> #{{ item.relatedEntityId }}</span></td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ truncate(item.message, 100) }}</td>
                  <td class="py-4 pr-4"><span :class="['rounded-full px-2.5 py-1 text-xs font-medium', badgeTone(item.status)]">{{ item.status }}</span></td>
                  <td class="py-4 pr-4 text-sm text-slate-500">{{ formatDate(item.resolvedAt) }}</td>
                  <td class="py-4 text-right text-sm">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-slate-500">{{ formatDate(item.createdAt) }}</span>
                      <button type="button" class="font-medium text-emerald-600" @click="selectedRecordId = item.id">
                        {{ labels.openDetails }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          </div>

          <aside class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <Shield class="h-4 w-4 text-emerald-600" />
                <h3 class="text-sm font-semibold text-slate-900">{{ labels.details }}</h3>
              </div>
              <button
                v-if="selectedRecord"
                type="button"
                class="text-xs font-medium text-slate-500"
                @click="resetAdminSelection"
              >
                {{ labels.closeDetails }}
              </button>
            </div>

            <div v-if="!selectedRecord" class="mt-4 text-sm leading-6 text-slate-500">
              {{ labels.selectRecord }}
            </div>

            <div v-else class="mt-4 space-y-4">
              <div v-if="canReprocessDocument || canRetryCheck" class="flex flex-wrap gap-2">
                <button
                  v-if="canReprocessDocument"
                  type="button"
                  class="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="actionPending"
                  @click="handleDocumentReprocess"
                >
                  {{ labels.reprocess }}
                </button>
                <button
                  v-if="canRetryCheck"
                  type="button"
                  class="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="actionPending"
                  @click="handleCheckRerun('reuse_extraction')"
                >
                  {{ labels.retry }}
                </button>
                <button
                  v-if="canRetryCheck"
                  type="button"
                  class="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="actionPending"
                  @click="handleCheckRerun('force_reextract')"
                >
                  {{ labels.forceRerun }}
                </button>
              </div>

              <p v-if="actionMessage" class="text-sm text-emerald-700">
                {{ actionMessage }}
              </p>
              <p v-if="actionError" class="text-sm text-rose-700">
                {{ actionError }}
              </p>

            <dl class="space-y-3">
              <div
                v-for="entry in selectedRecordEntries"
                :key="entry.key"
                class="rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {{ entry.key }}
                </dt>
                <dd class="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-700">
                  {{ entry.value }}
                </dd>
              </div>
            </dl>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>
