<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: ['guest'] })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const form = reactive({
  token: typeof route.query.token === 'string' ? route.query.token : '',
  password: ''
})

const state = reactive({
  pending: false,
  error: '',
  success: ''
})

watch(
  () => route.query.token,
  (value) => {
    if (typeof value === 'string') {
      form.token = value
    }
  }
)

async function submit() {
  state.pending = true
  state.error = ''
  state.success = ''

  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: form
    })

    state.success = t('auth.reset.success')
    await router.push({
      path: '/auth/login',
      query: { email: typeof route.query.email === 'string' ? route.query.email : undefined }
    })
  } catch (error) {
    state.error = error instanceof Error ? error.message : t('auth.common.genericError')
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <div>
    <p class="text-xs uppercase tracking-[0.3em] text-slate-500">{{ t('auth.reset.eyebrow') }}</p>
    <h2 class="mt-4 font-serif text-4xl tracking-tight">{{ t('auth.reset.title') }}</h2>
    <p class="mt-3 text-sm leading-6 text-slate-600">{{ t('auth.reset.description') }}</p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <div>
        <label class="text-sm font-medium text-slate-700" for="reset-token">{{ t('auth.fields.resetToken') }}</label>
        <input
          id="reset-token"
          v-model.trim="form.token"
          type="text"
          required
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white"
        >
      </div>

      <div>
        <label class="text-sm font-medium text-slate-700" for="reset-password">{{ t('auth.fields.newPassword') }}</label>
        <input
          id="reset-password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          minlength="8"
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
        {{ state.pending ? t('common.loading') : t('auth.reset.submit') }}
      </button>

      <p v-if="state.success" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {{ state.success }}
      </p>
    </form>
  </div>
</template>
