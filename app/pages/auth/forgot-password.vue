<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: ['guest'] })

const { t } = useI18n()

const form = reactive({
  email: ''
})

const state = reactive({
  pending: false,
  error: '',
  success: '',
  debugToken: ''
})

async function submit() {
  state.pending = true
  state.error = ''
  state.success = ''
  state.debugToken = ''

  try {
    const response = await $fetch<{
      ok: boolean
      data: {
        message: string
        debug?: {
          resetToken: string
        }
      }
    }>('/api/auth/forgot-password', {
      method: 'POST',
      body: form
    })

    state.success = response.data.message
    state.debugToken = response.data.debug?.resetToken || ''
  } catch (error) {
    state.error = error instanceof Error ? error.message : t('auth.common.genericError')
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <div>
    <p class="text-xs uppercase tracking-[0.3em] text-slate-500">{{ t('auth.forgot.eyebrow') }}</p>
    <h2 class="mt-4 font-serif text-4xl tracking-tight">{{ t('auth.forgot.title') }}</h2>
    <p class="mt-3 text-sm leading-6 text-slate-600">{{ t('auth.forgot.description') }}</p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <div>
        <label class="text-sm font-medium text-slate-700" for="forgot-email">{{ t('auth.fields.email') }}</label>
        <input
          id="forgot-email"
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          required
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white"
        >
      </div>

      <p v-if="state.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ state.error }}
      </p>

      <button
        type="submit"
        :disabled="state.pending"
        class="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ state.pending ? t('common.loading') : t('auth.forgot.submit') }}
      </button>
    </form>

    <div v-if="state.success" class="mt-5 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-4">
      <p class="text-sm text-emerald-700">{{ state.success }}</p>
      <div v-if="state.debugToken" class="mt-4 text-sm text-emerald-900">
        <p class="font-medium">{{ t('auth.forgot.debugToken') }}</p>
        <NuxtLink
          class="mt-2 inline-block break-all font-medium underline underline-offset-4"
          :to="`/auth/reset-password?token=${state.debugToken}`"
        >
          {{ state.debugToken }}
        </NuxtLink>
      </div>
    </div>

    <p class="mt-6 text-sm text-slate-600">
      <NuxtLink class="font-medium text-slate-950 underline-offset-4 hover:underline" to="/auth/login">
        {{ t('auth.forgot.backToLogin') }}
      </NuxtLink>
    </p>
  </div>
</template>
