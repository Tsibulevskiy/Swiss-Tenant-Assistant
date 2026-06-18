<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: ['guest'] })

const { t } = useI18n()
const localePath = useLocalePath()

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
    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B8A9B]">{{ t('auth.forgot.eyebrow') }}</p>
    <h2 class="mt-4 font-serif text-[2rem] leading-none tracking-tight text-[#0A1F44] sm:text-[2.35rem]">{{ t('auth.forgot.title') }}</h2>
    <p class="mt-3 max-w-md text-sm leading-6 text-[#4E6279]">{{ t('auth.forgot.description') }}</p>

    <form class="mt-8 space-y-5" @submit.prevent="submit">
      <div>
        <label class="text-sm font-medium text-[#163A5F]" for="forgot-email">{{ t('auth.fields.email') }}</label>
        <input
          id="forgot-email"
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          required
          :placeholder="t('auth.fields.emailPlaceholder')"
          class="mt-2 h-11 w-full rounded-xl border border-[#E6EBF1] bg-white px-4 text-sm outline-none transition focus:border-[#1E9F47]"
        >
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
        {{ state.pending ? t('common.loading') : t('auth.forgot.submit') }}
      </button>
    </form>

    <div v-if="state.success" class="mt-5 space-y-4">
      <AuthNotice
        tone="success"
        :message="state.success"
      />
      <div v-if="state.debugToken" class="mt-4 text-sm text-emerald-900">
        <p class="font-medium">{{ t('auth.forgot.debugToken') }}</p>
        <NuxtLink
          class="mt-2 inline-block break-all font-medium text-[#166534] underline underline-offset-4"
          :to="localePath(`/auth/reset-password?token=${state.debugToken}`)"
        >
          {{ state.debugToken }}
        </NuxtLink>
      </div>
    </div>

    <p class="mt-6 text-sm text-[#4E6279]">
      <NuxtLink class="font-medium text-[#1E9F47] hover:text-[#166534]" :to="localePath('/auth/login')">
        {{ t('auth.forgot.backToLogin') }}
      </NuxtLink>
    </p>
  </div>
</template>
