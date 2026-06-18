<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const auth = useAuth()

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const state = reactive({
  pending: false,
  error: '',
  success: ''
})

const showPassword = ref(false)

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
      body: {
        email: form.email,
        password: form.password
      },
      credentials: 'include'
    })

    auth.setUser(response.data.user)
    state.success = t('auth.login.success')
    await router.push(localePath('/dashboard'))
  } catch (error) {
    state.error = error instanceof Error ? error.message : t('auth.common.genericError')
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <div>
    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B8A9B]">{{ t('auth.login.eyebrow') }}</p>
    <h2 class="mt-4 font-serif text-[2rem] leading-none tracking-tight text-[#0A1F44] sm:text-[2.35rem]">{{ t('auth.login.title') }}</h2>
    <p class="mt-3 max-w-md text-sm leading-6 text-[#4E6279]">{{ t('auth.login.description') }}</p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <div>
        <label class="text-sm font-medium text-[#163A5F]" for="login-email">{{ t('auth.fields.email') }}</label>
        <input
          id="login-email"
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          required
          :placeholder="t('auth.fields.emailPlaceholder')"
          class="mt-2 h-11 w-full rounded-xl border border-[#E6EBF1] bg-white px-4 text-sm outline-none transition focus:border-[#1E9F47]"
        >
      </div>

      <div>
        <label class="text-sm font-medium text-[#163A5F]" for="login-password">{{ t('auth.fields.password') }}</label>
        <div class="relative mt-2">
          <input
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            :placeholder="t('auth.fields.passwordPlaceholder')"
            class="h-11 w-full rounded-xl border border-[#E6EBF1] bg-white px-4 pr-11 text-sm outline-none transition focus:border-[#1E9F47]"
          >
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8A9B] transition hover:text-[#163A5F]"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label class="flex items-center gap-2 text-[#4E6279]">
          <input v-model="form.remember" type="checkbox" class="h-4 w-4 rounded border-[#CBD5E1] text-[#1E9F47]">
          <span>{{ t('auth.login.rememberMe') }}</span>
        </label>
        <NuxtLink class="font-medium text-[#1E9F47] hover:text-[#166534]" :to="localePath('/auth/forgot-password')">
          {{ t('auth.login.forgotPassword') }}
        </NuxtLink>
      </div>

      <AuthNotice
        v-if="state.error"
        tone="error"
        :message="state.error"
      />

      <button
        type="submit"
        :disabled="state.pending"
        class="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#1E9F47] px-5 text-sm font-semibold text-white transition hover:bg-[#19863C] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ state.pending ? t('common.loading') : t('auth.login.submit') }}
      </button>

      <AuthNotice
        v-if="state.success"
        tone="success"
        :message="state.success"
      />
    </form>

    <div class="mt-6 text-sm text-[#4E6279]">
      <p>
        {{ t('auth.login.noAccount') }}
        <NuxtLink class="font-medium text-[#1E9F47] hover:text-[#166534]" :to="localePath('/auth/register')">
          {{ t('auth.login.createAccount') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
