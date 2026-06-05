<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: ['guest'] })

const { locale, t } = useI18n()
const router = useRouter()
const auth = useAuth()

const form = reactive({
  email: '',
  password: '',
  locale: locale.value,
  termsAccepted: false,
  privacyAccepted: false,
  disclaimerAccepted: false
})

const state = reactive({
  pending: false,
  error: '',
  success: ''
})

watch(locale, (value) => {
  form.locale = value
})

async function submit() {
  state.pending = true
  state.error = ''
  state.success = ''

  try {
    const response = await $fetch<{
      ok: true
      data: {
        user: {
          id: number
          email: string
          role: 'user' | 'admin'
          locale: string
          createdAt: string | Date
        }
      }
    }>('/api/auth/register', {
      method: 'POST',
      body: form,
      credentials: 'include'
    })

    auth.setUser(response.data.user)
    state.success = t('auth.register.success')
    await router.push('/')
  } catch (error) {
    state.error = error instanceof Error ? error.message : t('auth.common.genericError')
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <div>
    <p class="text-xs uppercase tracking-[0.3em] text-slate-500">{{ t('auth.register.eyebrow') }}</p>
    <h2 class="mt-4 font-serif text-4xl tracking-tight">{{ t('auth.register.title') }}</h2>
    <p class="mt-3 text-sm leading-6 text-slate-600">{{ t('auth.register.description') }}</p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <div>
        <label class="text-sm font-medium text-slate-700" for="register-email">{{ t('auth.fields.email') }}</label>
        <input
          id="register-email"
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          required
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white"
        >
      </div>

      <div>
        <label class="text-sm font-medium text-slate-700" for="register-password">{{ t('auth.fields.password') }}</label>
        <input
          id="register-password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white"
        >
      </div>

      <div class="space-y-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
        <label class="flex items-start gap-3 text-sm leading-6 text-slate-700">
          <input v-model="form.termsAccepted" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950">
          <span>{{ t('auth.register.consents.terms') }}</span>
        </label>
        <label class="flex items-start gap-3 text-sm leading-6 text-slate-700">
          <input v-model="form.privacyAccepted" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950">
          <span>{{ t('auth.register.consents.privacy') }}</span>
        </label>
        <label class="flex items-start gap-3 text-sm leading-6 text-slate-700">
          <input v-model="form.disclaimerAccepted" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950">
          <span>{{ t('auth.register.consents.disclaimer') }}</span>
        </label>
      </div>

      <p v-if="state.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ state.error }}
      </p>

      <button
        type="submit"
        :disabled="state.pending"
        class="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ state.pending ? t('common.loading') : t('auth.register.submit') }}
      </button>

      <p v-if="state.success" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {{ state.success }}
      </p>
    </form>

    <p class="mt-6 text-sm text-slate-600">
      {{ t('auth.register.haveAccount') }}
      <NuxtLink class="font-medium text-slate-950 underline-offset-4 hover:underline" to="/auth/login">
        {{ t('auth.register.signIn') }}
      </NuxtLink>
    </p>
  </div>
</template>
