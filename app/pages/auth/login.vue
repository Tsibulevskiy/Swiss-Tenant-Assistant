<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: ['guest'] })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const auth = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const state = reactive({
  pending: false,
  error: '',
  success: ''
})

if (typeof route.query.email === 'string') {
  form.email = route.query.email
}

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
    }>('/api/auth/login', {
      method: 'POST',
      body: form,
      credentials: 'include'
    })

    auth.setUser(response.data.user)
    state.success = t('auth.login.success')
    await router.push(localePath('/'))
  } catch (error) {
    state.error = error instanceof Error ? error.message : t('auth.common.genericError')
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <div>
    <p class="text-xs uppercase tracking-[0.3em] text-slate-500">{{ t('auth.login.eyebrow') }}</p>
    <h2 class="mt-4 font-serif text-4xl tracking-tight">{{ t('auth.login.title') }}</h2>
    <p class="mt-3 text-sm leading-6 text-slate-600">{{ t('auth.login.description') }}</p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <div>
        <label class="text-sm font-medium text-slate-700" for="login-email">{{ t('auth.fields.email') }}</label>
        <input
          id="login-email"
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          required
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white"
        >
      </div>

      <div>
        <label class="text-sm font-medium text-slate-700" for="login-password">{{ t('auth.fields.password') }}</label>
        <input
          id="login-password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
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
        {{ state.pending ? t('common.loading') : t('auth.login.submit') }}
      </button>

      <p v-if="state.success" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {{ state.success }}
      </p>
    </form>

    <div class="mt-6 flex flex-col gap-3 text-sm text-slate-600">
      <NuxtLink class="font-medium text-slate-950 underline-offset-4 hover:underline" :to="localePath('/auth/forgot-password')">
        {{ t('auth.login.forgotPassword') }}
      </NuxtLink>
      <p>
        {{ t('auth.login.noAccount') }}
        <NuxtLink class="font-medium text-slate-950 underline-offset-4 hover:underline" :to="localePath('/auth/register')">
          {{ t('auth.login.createAccount') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
