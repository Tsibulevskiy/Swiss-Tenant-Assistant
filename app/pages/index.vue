<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()

const stats = computed(() => [
  {
    label: t('dashboard.stats.openCases'),
    value: '0',
    detail: t('dashboard.stats.openCasesDetail'),
    tone: 'from-emerald-500/18 to-emerald-100'
  },
  {
    label: t('dashboard.stats.documents'),
    value: '0',
    detail: t('dashboard.stats.documentsDetail'),
    tone: 'from-sky-500/18 to-sky-100'
  },
  {
    label: t('dashboard.stats.pendingActions'),
    value: '0',
    detail: t('dashboard.stats.pendingActionsDetail'),
    tone: 'from-amber-500/18 to-amber-100'
  },
  {
    label: t('dashboard.stats.reports'),
    value: '0',
    detail: t('dashboard.stats.reportsDetail'),
    tone: 'from-rose-500/18 to-rose-100'
  }
])

const quickActions = computed(() => [
  {
    title: t('dashboard.actions.nebenkosten.title'),
    description: t('dashboard.actions.nebenkosten.description'),
    badge: t('dashboard.actions.nebenkosten.badge'),
    href: '#'
  },
  {
    title: t('dashboard.actions.contract.title'),
    description: t('dashboard.actions.contract.description'),
    badge: t('dashboard.actions.contract.badge'),
    href: '#'
  },
  {
    title: t('dashboard.actions.letter.title'),
    description: t('dashboard.actions.letter.description'),
    badge: t('dashboard.actions.letter.badge'),
    href: '#'
  }
])

const workflow = computed(() => [
  t('dashboard.workflow.upload'),
  t('dashboard.workflow.analyze'),
  t('dashboard.workflow.pay'),
  t('dashboard.workflow.download')
])

const activity = computed(() => [
  {
    title: t('dashboard.activity.authReadyTitle'),
    body: t('dashboard.activity.authReadyBody'),
    status: t('dashboard.activity.done')
  },
  {
    title: t('dashboard.activity.resetReadyTitle'),
    body: t('dashboard.activity.resetReadyBody'),
    status: t('dashboard.activity.done')
  },
  {
    title: t('dashboard.activity.nextUiTitle'),
    body: t('dashboard.activity.nextUiBody'),
    status: t('dashboard.activity.inProgress')
  }
])
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
      <div class="rounded-[2.25rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
        <p class="text-xs uppercase tracking-[0.34em] text-slate-500">
          {{ t('dashboard.hero.eyebrow') }}
        </p>

        <h2 class="mt-5 max-w-4xl font-serif text-4xl leading-none tracking-tight text-slate-950 sm:text-5xl">
          {{ t('dashboard.hero.title') }}
        </h2>

        <p class="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {{ t('dashboard.hero.description') }}
        </p>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            :class="['rounded-[1.75rem] border border-slate-200 bg-gradient-to-br p-5', stat.tone]"
          >
            <p class="text-xs uppercase tracking-[0.28em] text-slate-500">
              {{ stat.label }}
            </p>
            <p class="mt-4 font-serif text-4xl text-slate-950">
              {{ stat.value }}
            </p>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              {{ stat.detail }}
            </p>
          </div>
        </div>
      </div>

      <aside class="rounded-[2.25rem] border border-slate-950/10 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-8">
        <p class="text-xs uppercase tracking-[0.34em] text-white/55">
          {{ t('dashboard.workflow.eyebrow') }}
        </p>
        <p class="mt-4 font-serif text-3xl leading-tight">
          {{ t('dashboard.workflow.title') }}
        </p>
        <p class="mt-4 text-sm leading-7 text-white/72">
          {{ t('dashboard.workflow.description') }}
        </p>

        <div class="mt-8 space-y-3">
          <div
            v-for="(step, index) in workflow"
            :key="step"
            class="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-white">
              {{ index + 1 }}
            </div>
            <p class="text-sm font-medium text-white">
              {{ step }}
            </p>
          </div>
        </div>
      </aside>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
      <div class="rounded-[2.25rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-slate-500">
              {{ t('dashboard.cases.eyebrow') }}
            </p>
            <h3 class="mt-4 font-serif text-3xl tracking-tight text-slate-950">
              {{ t('dashboard.cases.title') }}
            </h3>
          </div>
          <div class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
            {{ t('dashboard.cases.emptyBadge') }}
          </div>
        </div>

        <div class="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            +
          </div>
          <p class="mt-5 font-medium text-slate-950">
            {{ t('dashboard.cases.emptyTitle') }}
          </p>
          <p class="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
            {{ t('dashboard.cases.emptyDescription') }}
          </p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.title"
              :to="action.href"
              class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              {{ action.title }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="grid gap-6">
        <section class="rounded-[2.25rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-500">
            {{ t('dashboard.quickActions.eyebrow') }}
          </p>
          <h3 class="mt-4 font-serif text-3xl tracking-tight text-slate-950">
            {{ t('dashboard.quickActions.title') }}
          </h3>

          <div class="mt-6 grid gap-4">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.title"
              :to="action.href"
              class="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-slate-950 hover:bg-white"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-medium text-slate-950">{{ action.title }}</p>
                  <p class="mt-2 text-sm leading-6 text-slate-600">{{ action.description }}</p>
                </div>
                <span class="rounded-full bg-slate-950 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white">
                  {{ action.badge }}
                </span>
              </div>
            </NuxtLink>
          </div>
        </section>

        <section class="rounded-[2.25rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-500">
            {{ t('dashboard.activity.eyebrow') }}
          </p>
          <h3 class="mt-4 font-serif text-3xl tracking-tight text-slate-950">
            {{ t('dashboard.activity.title') }}
          </h3>

          <div class="mt-6 space-y-4">
            <div
              v-for="item in activity"
              :key="item.title"
              class="rounded-[1.75rem] border border-slate-200 bg-white p-5"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-medium text-slate-950">{{ item.title }}</p>
                  <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.body }}</p>
                </div>
                <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-600">
                  {{ item.status }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>
