<script setup lang="ts">
import { Check, ShieldCheck } from 'lucide-vue-next'
import { isProductCode, type ProductCode } from '~/constants/products'

const route = useRoute()
const localePath = useLocalePath()
const auth = useAuth()
const { t } = useI18n()
const isSubmitting = ref(false)
const checkoutError = ref('')

await auth.fetchCurrentUser()

const product = computed(() => {
  const raw = typeof route.query.product === 'string' ? route.query.product : ''
  return isProductCode(raw) ? raw : null
})

if (!auth.user.value) {
  await navigateTo(localePath({
    path: '/register',
    query: product.value ? { product: product.value } : undefined
  }), { replace: true })
}

if (!product.value) {
  await navigateTo(localePath('/'), { replace: true })
}

const checkoutProduct = computed(() => {
  const current = product.value as ProductCode

  switch (current) {
    case 'mietvertrag_check':
      return {
        title: t('landing.pricingSection.contractTitle'),
        body: t('landing.pricingSection.contractBody'),
        price: t('landing.pricingSection.contractPrice')
      }
    case 'nebenkosten_check':
      return {
        title: t('landing.pricingSection.nebenkostenTitle'),
        body: t('landing.pricingSection.nebenkostenBody'),
        price: t('landing.pricingSection.nebenkostenPrice')
      }
    case 'mietzinserhoehung_check':
      return {
        title: t('landing.pricingSection.rentIncreaseTitle'),
        body: t('landing.pricingSection.rentIncreaseBody'),
        price: t('landing.pricingSection.rentIncreasePrice')
      }
    case 'deposit_return_check':
      return {
        title: t('landing.pricingSection.depositTitle'),
        body: t('landing.pricingSection.depositBody'),
        price: t('landing.pricingSection.depositPrice')
      }
    case 'letter_generator':
      return {
        title: t('landing.pricingSection.letterTitle'),
        body: t('landing.pricingSection.letterBody'),
        price: t('landing.pricingSection.letterPrice')
      }
    case 'tenant_bundle':
      return {
        title: t('landing.pricingSection.bundleTitle'),
        body: t('landing.pricingSection.bundleBody'),
        price: t('landing.pricingSection.bundlePrice')
      }
  }
})

const paymentStatus = computed(() => {
  const raw = typeof route.query.payment === 'string' ? route.query.payment : ''

  return raw === 'success' || raw === 'cancel' ? raw : null
})

async function startCheckout() {
  if (!product.value) {
    return
  }

  const checkId = typeof route.query.checkId === 'string' && /^\d+$/.test(route.query.checkId)
    ? Number(route.query.checkId)
    : undefined
  const caseId = typeof route.query.caseId === 'string' && /^\d+$/.test(route.query.caseId)
    ? Number(route.query.caseId)
    : undefined

  isSubmitting.value = true
  checkoutError.value = ''

  try {
    const response = await $fetch<{ ok: true, data: { checkoutUrl: string } }>('/api/payments/checkout-session', {
      method: 'POST',
      body: {
        productCode: product.value,
        ...(checkId ? { checkId } : {}),
        ...(caseId ? { caseId } : {})
      }
    })

    await navigateTo(response.data.checkoutUrl, {
      external: true
    })
  } catch (error: any) {
    checkoutError.value = error?.data?.statusMessage || error?.statusMessage || t('checkout.errors.generic')
  } finally {
    isSubmitting.value = false
  }
}

useHead(() => ({
  title: `${t('checkout.title')} · ${t('app.name')}`
}))
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
    <div class="overflow-hidden rounded-[1.5rem] border border-[#D9E0E8] bg-white shadow-[0_10px_30px_rgba(10,31,68,0.05)]">
      <div class="border-b border-[#E6EBF1] px-5 py-5 sm:px-8 sm:py-7">
        <p class="text-sm font-medium uppercase tracking-[0.08em] text-[#4E6279]">
          {{ t('checkout.eyebrow') }}
        </p>
        <h1 class="mt-3 font-serif text-[2.2rem] leading-[0.98] tracking-tight text-[#0A1F44] sm:text-[3.2rem]">
          {{ checkoutProduct.title }}
        </h1>
        <p class="mt-4 max-w-3xl text-[15px] leading-7 text-[#4E6279] sm:text-lg">
          {{ t('checkout.description') }}
        </p>
      </div>

      <div class="grid gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.05fr)_360px]">
        <div class="rounded-[1.25rem] border border-[#E6EBF1] bg-[#FCFDFE] p-5 sm:p-6">
          <p class="text-sm font-semibold text-[#0A1F44]">
            {{ t('checkout.selectedLabel') }}
          </p>
          <p class="mt-3 font-serif text-[1.95rem] leading-[1.04] tracking-tight text-[#0A1F44]">
            {{ checkoutProduct.title }}
          </p>
          <p class="mt-3 text-sm leading-7 text-[#4E6279] sm:text-base">
            {{ checkoutProduct.body }}
          </p>

          <div class="mt-6 space-y-3.5">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E9F47] text-white">
                <Check class="h-3 w-3" />
              </div>
              <p class="text-sm leading-6 text-[#163A5F]">{{ t('checkout.points.first') }}</p>
            </div>
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E9F47] text-white">
                <Check class="h-3 w-3" />
              </div>
              <p class="text-sm leading-6 text-[#163A5F]">{{ t('checkout.points.second') }}</p>
            </div>
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E9F47] text-white">
                <Check class="h-3 w-3" />
              </div>
              <p class="text-sm leading-6 text-[#163A5F]">{{ t('checkout.points.third') }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-[1.25rem] border border-[#8CD0A4] bg-white p-5 shadow-[0_16px_34px_rgba(30,159,71,0.1)] sm:p-6">
          <p class="text-sm font-semibold text-[#4E6279]">
            {{ t('checkout.totalLabel') }}
          </p>
          <p class="mt-2 font-serif text-[3rem] leading-none tracking-tight text-[#1E9F47]">
            {{ checkoutProduct.price }}
          </p>

          <div
            v-if="paymentStatus"
            class="mt-6 rounded-[0.875rem] px-4 py-3 text-sm leading-6"
            :class="paymentStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
          >
            {{ paymentStatus === 'success' ? t('checkout.status.success') : t('checkout.status.cancel') }}
          </div>
          <div v-else class="mt-6 rounded-[0.875rem] bg-[#F7F9FB] px-4 py-3 text-sm leading-6 text-[#4E6279]">
            {{ t('checkout.placeholder') }}
          </div>

          <div v-if="checkoutError" class="mt-4 rounded-[0.875rem] bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
            {{ checkoutError }}
          </div>

          <button
            type="button"
            :disabled="isSubmitting"
            class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[0.875rem] bg-[#1E9F47] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-80"
            @click="startCheckout"
          >
            {{ isSubmitting ? t('checkout.processing') : t('checkout.payAction') }}
          </button>

          <div class="mt-4 flex items-center justify-center gap-2 text-sm text-[#4E6279]">
            <ShieldCheck class="h-4 w-4 text-[#1E9F47]" />
            <span>{{ t('checkout.secureNote') }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
