<script setup lang="ts">
import { isProductCode } from '~/constants/products'

const route = useRoute()
const localePath = useLocalePath()
const auth = useAuth()
const { t } = useI18n()

await auth.fetchCurrentUser()

const product = typeof route.query.product === 'string' ? route.query.product : ''

useHead(() => ({
  title: `${t('pricingRedirect.title')} · ${t('app.name')}`
}))

if (!product || !isProductCode(product)) {
  await navigateTo(localePath('/'), { replace: true })
} else if (auth.user.value) {
  await navigateTo(localePath({
    path: '/checkout',
    query: { product }
  }), { replace: true })
} else {
  await navigateTo(localePath({
    path: '/register',
    query: { product }
  }), { replace: true })
}
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="rounded-[1.5rem] border border-[#D9E0E8] bg-white px-6 py-8 text-center shadow-[0_10px_30px_rgba(10,31,68,0.04)]">
      <p class="text-sm text-[#4E6279]">
        {{ t('pricingRedirect.body') }}
      </p>
    </div>
  </section>
</template>
