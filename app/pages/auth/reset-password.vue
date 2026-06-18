<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const { t } = useI18n()
const localePath = useLocalePath()
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

const showPassword = ref(false)
const infoMessage = computed(() =>
  form.token
    ? t('auth.reset.tokenDetected')
    : t('auth.reset.tokenMissing')
)

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
      path: localePath('/auth/login'),
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
    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B8A9B]">{{ t('auth.reset.eyebrow') }}</p>
    <h2 class="mt-4 font-serif text-[2rem] leading-none tracking-tight text-[#0A1F44] sm:text-[2.35rem]">{{ t('auth.reset.title') }}</h2>
    <p class="mt-3 max-w-md text-sm leading-6 text-[#4E6279]">{{ t('auth.reset.description') }}</p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <AuthNotice
        tone="info"
        :message="infoMessage"
      />

      <div>
        <label class="text-sm font-medium text-[#163A5F]" for="reset-token">{{ t('auth.fields.resetToken') }}</label>
        <input
          id="reset-token"
          v-model.trim="form.token"
          type="text"
          required
          class="mt-2 h-11 w-full rounded-xl border border-[#E6EBF1] bg-white px-4 text-sm outline-none transition focus:border-[#1E9F47]"
        >
      </div>

      <div>
        <label class="text-sm font-medium text-[#163A5F]" for="reset-password">{{ t('auth.fields.newPassword') }}</label>
        <div class="relative mt-2">
          <input
            id="reset-password"
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
        {{ state.pending ? t('common.loading') : t('auth.reset.submit') }}
      </button>

      <AuthNotice
        v-if="state.success"
        tone="success"
        :message="state.success"
      />
    </form>
  </div>
</template>
