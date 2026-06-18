<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const { locale, t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
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

const showPassword = ref(false)

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
    const product = typeof route.query.product === 'string' ? route.query.product : ''

    if (product) {
      await router.push(localePath({
        path: '/checkout',
        query: { product }
      }))
      return
    }

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
    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B8A9B]">{{ t('auth.register.eyebrow') }}</p>
    <h2 class="mt-4 font-serif text-[2rem] leading-none tracking-tight text-[#0A1F44] sm:text-[2.35rem]">{{ t('auth.register.title') }}</h2>
    <p class="mt-3 max-w-md text-sm leading-6 text-[#4E6279]">{{ t('auth.register.description') }}</p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <div
        v-if="typeof route.query.product === 'string'"
        class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
      >
        {{ t('auth.register.selectedProductNotice', { product: route.query.product }) }}
      </div>

      <div>
        <label class="text-sm font-medium text-[#163A5F]" for="register-email">{{ t('auth.fields.email') }}</label>
        <input
          id="register-email"
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          required
          :placeholder="t('auth.fields.emailPlaceholder')"
          class="mt-2 h-11 w-full rounded-xl border border-[#E6EBF1] bg-white px-4 text-sm outline-none transition focus:border-[#1E9F47]"
        >
      </div>

      <div>
        <label class="text-sm font-medium text-[#163A5F]" for="register-password">{{ t('auth.fields.password') }}</label>
        <div class="relative mt-2">
          <input
            id="register-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            minlength="8"
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
        <p class="mt-2 text-xs text-[#7B8A9B]">
          {{ t('auth.register.passwordHint') }}
        </p>
      </div>

      <div>
        <label class="text-sm font-medium text-[#163A5F]" for="register-locale">{{ t('auth.register.localeLabel') }}</label>
        <select
          id="register-locale"
          v-model="form.locale"
          class="mt-2 h-11 w-full rounded-xl border border-[#E6EBF1] bg-white px-4 text-sm outline-none transition focus:border-[#1E9F47]"
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="it">Italiano</option>
        </select>
      </div>

      <div class="space-y-3 rounded-[1.25rem] border border-[#E6EBF1] bg-[#F8FAFC] p-4">
        <label class="flex items-start gap-3 text-sm leading-6 text-[#4E6279]">
          <input v-model="form.termsAccepted" type="checkbox" class="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#1E9F47]">
          <span>{{ t('auth.register.consents.terms') }}</span>
        </label>
        <label class="flex items-start gap-3 text-sm leading-6 text-[#4E6279]">
          <input v-model="form.privacyAccepted" type="checkbox" class="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#1E9F47]">
          <span>{{ t('auth.register.consents.privacy') }}</span>
        </label>
        <label class="flex items-start gap-3 text-sm leading-6 text-[#4E6279]">
          <input v-model="form.disclaimerAccepted" type="checkbox" class="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#1E9F47]">
          <span>{{ t('auth.register.consents.disclaimer') }}</span>
        </label>
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
        {{ state.pending ? t('common.loading') : t('auth.register.submit') }}
      </button>

      <AuthNotice
        v-if="state.success"
        tone="success"
        :message="state.success"
      />
    </form>

    <p class="mt-6 text-sm text-[#4E6279]">
      {{ t('auth.register.haveAccount') }}
      <NuxtLink class="font-medium text-[#1E9F47] hover:text-[#166534]" :to="localePath('/auth/login')">
        {{ t('auth.register.signIn') }}
      </NuxtLink>
    </p>
  </div>
</template>
