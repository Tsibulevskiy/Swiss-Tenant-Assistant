<script setup lang="ts">
import { Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, FileSearch, FileText, FolderOpen, Languages, Lock, Mail, Menu, OctagonAlert, Scale, Search, ShieldCheck, Sparkles, Upload, UserRound, Wallet, X } from 'lucide-vue-next'
import { type StandaloneProductCode } from '~/constants/products'

const { locale, locales, t } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const auth = useAuth()
const localeOrder = ['en', 'de', 'fr', 'it'] as const
type LocaleCode = typeof localeOrder[number]
const logoSrc = '/swiss-tenant-assistant-logo.svg'
const heroImageSrc = '/hero-swiss-alps.png'
const mobileNavOpen = ref(false)
const activeFaq = ref('documents')

await auth.fetchCurrentUser()

const availableLocales = computed(() =>
  [...locales.value]
    .sort((left, right) => localeOrder.indexOf(left.code) - localeOrder.indexOf(right.code))
    .map(localeOption => ({
      code: localeOption.code,
      label: localeOption.code.toUpperCase(),
      to: switchLocalePath(localeOption.code)
    }))
)

async function handleLocaleSelect(event: Event) {
  const target = event.target as HTMLSelectElement | null
  const nextLocale = target?.value

  if (!nextLocale || !localeOrder.includes(nextLocale as LocaleCode)) {
    return
  }

  const targetPath = switchLocalePath(nextLocale as LocaleCode)

  if (targetPath) {
    mobileNavOpen.value = false
    await navigateTo(targetPath)
  }
}

const navigationItems = computed(() => [
  {
    label: t('landing.nav.howItWorks'),
    to: '#process'
  },
  {
    label: t('landing.nav.features'),
    to: '#features'
  },
  {
    label: t('landing.nav.pricing'),
    to: '#pricing'
  },
  {
    label: t('landing.nav.faq'),
    to: '#faq'
  }
])

const primaryAction = computed(() =>
  auth.user.value
    ? {
        label: t('landing.hero.openDashboard'),
        to: localePath('/dashboard')
      }
    : {
        label: t('landing.hero.documentCheck'),
        to: localePath('/auth/register')
      }
)

const secondaryAction = computed(() =>
  auth.user.value
    ? {
        label: t('landing.hero.watchDemo'),
        to: '#process'
      }
    : {
        label: t('landing.hero.watchDemo'),
        to: '#process'
      }
)

const bulletItems = computed(() => [
  {
    icon: FileSearch,
    label: t('landing.hero.points.documents')
  },
  {
    icon: ShieldCheck,
    label: t('landing.hero.points.reports')
  },
  {
    icon: CheckCircle2,
    label: t('landing.hero.points.speed')
  }
])

function buildStandaloneProductPath(product: StandaloneProductCode) {
  return localePath({
    path: '/pricing',
    query: { product }
  })
}

function buildBundlePath() {
  if (auth.user.value) {
    return localePath({
      path: '/checkout',
      query: { product: 'tenant_bundle' }
    })
  }

  return localePath({
    path: '/register',
    query: { product: 'tenant_bundle' }
  })
}

const proofItems = computed(() => [
  {
    icon: Clock3,
    title: t('landing.proof.fastTitle'),
    body: t('landing.proof.fastBody')
  },
  {
    icon: ShieldCheck,
    title: t('landing.proof.safeTitle'),
    body: t('landing.proof.safeBody')
  },
  {
    icon: Languages,
    title: t('landing.proof.clearTitle'),
    body: t('landing.proof.clearBody')
  },
  {
    icon: Wallet,
    title: t('landing.proof.valueTitle'),
    body: t('landing.proof.valueBody')
  }
])

const processSteps = computed(() => [
  {
    icon: Upload,
    title: t('landing.process.uploadTitle'),
    body: t('landing.process.uploadBody')
  },
  {
    icon: Search,
    title: t('landing.process.analysisTitle'),
    body: t('landing.process.analysisBody')
  },
  {
    icon: FileText,
    title: t('landing.process.reportTitle'),
    body: t('landing.process.reportBody')
  },
  {
    icon: Mail,
    title: t('landing.process.actionTitle'),
    body: t('landing.process.actionBody')
  }
])

const processTrustItems = computed(() => [
  {
    icon: Clock3,
    title: t('landing.process.fastTrust'),
    body: t('landing.process.fastTrustBody')
  },
  {
    icon: ShieldCheck,
    title: t('landing.process.swissTrust'),
    body: t('landing.process.swissTrustBody')
  },
  {
    icon: FileText,
    title: t('landing.process.pdfTrust'),
    body: t('landing.process.pdfTrustBody')
  },
  {
    icon: ShieldCheck,
    title: t('landing.process.privateTrust'),
    body: t('landing.process.privateTrustBody')
  },
  {
    icon: Wallet,
    title: t('landing.process.subscriptionTrust'),
    body: t('landing.process.subscriptionTrustBody')
  }
])

const featureCards = computed(() => [
  {
    icon: FileSearch,
    title: t('landing.features.cards.aiTitle'),
    body: t('landing.features.cards.aiBody')
  },
  {
    icon: ShieldCheck,
    title: t('landing.features.cards.risksTitle'),
    body: t('landing.features.cards.risksBody')
  },
  {
    icon: FileText,
    title: t('landing.features.cards.pdfTitle'),
    body: t('landing.features.cards.pdfBody')
  },
  {
    icon: Mail,
    title: t('landing.features.cards.lettersTitle'),
    body: t('landing.features.cards.lettersBody')
  },
  {
    icon: Lock,
    title: t('landing.features.cards.securityTitle'),
    body: t('landing.features.cards.securityBody')
  },
  {
    icon: Clock3,
    title: t('landing.features.cards.speedTitle'),
    body: t('landing.features.cards.speedBody')
  },
  {
    icon: FolderOpen,
    title: t('landing.features.cards.storageTitle'),
    body: t('landing.features.cards.storageBody')
  },
  {
    icon: UserRound,
    title: t('landing.features.cards.tenantTitle'),
    body: t('landing.features.cards.tenantBody')
  }
])

const featureTrustItems = computed(() => [
  {
    icon: ShieldCheck,
    title: t('landing.features.bar.swissTitle'),
    body: t('landing.features.bar.swissBody')
  },
  {
    icon: Wallet,
    title: t('landing.features.bar.noSubscriptionTitle'),
    body: t('landing.features.bar.noSubscriptionBody')
  },
  {
    icon: CheckCircle2,
    title: t('landing.features.bar.clearTitle'),
    body: t('landing.features.bar.clearBody')
  },
  {
    icon: UserRound,
    title: t('landing.features.bar.supportTitle'),
    body: t('landing.features.bar.supportBody')
  }
])

const pricingChecks = computed(() => [
  {
    code: 'mietvertrag_check',
    title: t('landing.pricingSection.contractTitle'),
    body: t('landing.pricingSection.contractBody'),
    price: t('landing.pricingSection.contractPrice'),
    icon: FileSearch,
    to: buildStandaloneProductPath('mietvertrag_check')
  },
  {
    code: 'nebenkosten_check',
    title: t('landing.pricingSection.nebenkostenTitle'),
    body: t('landing.pricingSection.nebenkostenBody'),
    price: t('landing.pricingSection.nebenkostenPrice'),
    icon: Wallet,
    to: buildStandaloneProductPath('nebenkosten_check')
  },
  {
    code: 'mietzinserhoehung_check',
    title: t('landing.pricingSection.rentIncreaseTitle'),
    body: t('landing.pricingSection.rentIncreaseBody'),
    price: t('landing.pricingSection.rentIncreasePrice'),
    icon: CheckCircle2,
    to: buildStandaloneProductPath('mietzinserhoehung_check')
  },
  {
    code: 'deposit_return_check',
    title: t('landing.pricingSection.depositTitle'),
    body: t('landing.pricingSection.depositBody'),
    price: t('landing.pricingSection.depositPrice'),
    icon: ShieldCheck,
    to: buildStandaloneProductPath('deposit_return_check')
  },
  {
    code: 'letter_generator',
    title: t('landing.pricingSection.letterTitle'),
    body: t('landing.pricingSection.letterBody'),
    price: t('landing.pricingSection.letterPrice'),
    icon: Languages,
    to: buildStandaloneProductPath('letter_generator')
  }
])

const pricingHighlights = computed(() => [
  {
    title: t('landing.pricingSection.highlightRiskTitle'),
    body: t('landing.pricingSection.highlightRiskBody'),
    icon: ShieldCheck
  },
  {
    title: t('landing.pricingSection.highlightSafetyTitle'),
    body: t('landing.pricingSection.highlightSafetyBody'),
    icon: CheckCircle2
  },
  {
    title: t('landing.pricingSection.highlightNoHiddenTitle'),
    body: t('landing.pricingSection.highlightNoHiddenBody'),
    icon: Wallet
  },
  {
    title: t('landing.pricingSection.highlightPrivateTitle'),
    body: t('landing.pricingSection.highlightPrivateBody'),
    icon: FileSearch
  }
])

const bundleFeatures = computed(() => [
  t('landing.pricingSection.bundleFeatureChecks'),
  t('landing.pricingSection.bundleFeatureLetters'),
  t('landing.pricingSection.bundleFeatureReports'),
  t('landing.pricingSection.bundleFeatureStorage'),
  t('landing.pricingSection.bundleFeaturePriority'),
  t('landing.pricingSection.bundleFeatureSavings')
])

const faqPrimaryAction = computed(() => buildStandaloneProductPath('mietvertrag_check'))

const faqItems = computed(() => [
  {
    id: 'documents',
    icon: FileSearch,
    question: t('landing.faq.items.documents.question'),
    answer: t('landing.faq.items.documents.answer')
  },
  {
    id: 'timing',
    icon: Clock3,
    question: t('landing.faq.items.timing.question'),
    answer: t('landing.faq.items.timing.answer')
  },
  {
    id: 'result',
    icon: CheckCircle2,
    question: t('landing.faq.items.result.question'),
    answer: t('landing.faq.items.result.answer')
  },
  {
    id: 'legal',
    icon: Scale,
    question: t('landing.faq.items.legal.question'),
    answer: t('landing.faq.items.legal.answer')
  },
  {
    id: 'security',
    icon: ShieldCheck,
    question: t('landing.faq.items.security.question'),
    answer: t('landing.faq.items.security.answer')
  },
  {
    id: 'pdf',
    icon: FileText,
    question: t('landing.faq.items.pdf.question'),
    answer: t('landing.faq.items.pdf.answer')
  },
  {
    id: 'letters',
    icon: Mail,
    question: t('landing.faq.items.letters.question'),
    answer: t('landing.faq.items.letters.answer')
  },
  {
    id: 'languages',
    icon: Languages,
    question: t('landing.faq.items.languages.question'),
    answer: t('landing.faq.items.languages.answer')
  },
  {
    id: 'serious',
    icon: OctagonAlert,
    question: t('landing.faq.items.serious.question'),
    answer: t('landing.faq.items.serious.answer')
  },
  {
    id: 'subscription',
    icon: UserRound,
    question: t('landing.faq.items.subscription.question'),
    answer: t('landing.faq.items.subscription.answer')
  }
])

const faqColumns = computed(() => {
  const items = faqItems.value
  const midpoint = Math.ceil(items.length / 2)

  return [
    items.slice(0, midpoint),
    items.slice(midpoint)
  ]
})

const faqTrustItems = computed(() => [
  t('landing.faq.trust.securePayment'),
  t('landing.faq.trust.pdfReports'),
  t('landing.faq.trust.swissFocused'),
  t('landing.faq.trust.noSubscription')
])

function toggleFaq(id: string) {
  activeFaq.value = activeFaq.value === id ? '' : id
}
</script>

<template>
  <div>
    <section id="how-it-works" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="overflow-hidden rounded-[1.5rem] border border-[#D9E0E8] bg-white shadow-[0_10px_30px_rgba(10,31,68,0.05)]">
        <div class="border-b border-[#E6EBF1] px-5 py-4 sm:px-8 sm:py-5">
          <div class="flex items-center justify-between gap-3 sm:gap-4">
            <NuxtLink :to="localePath('/')" class="min-w-0 shrink-0">
              <img :src="logoSrc" :alt="t('app.name')" class="h-10 w-auto max-w-[14rem] sm:h-12 sm:max-w-[18rem]">
            </NuxtLink>

            <div class="flex items-center justify-end gap-2 sm:gap-4 lg:gap-6">
              <nav class="hidden items-center gap-6 lg:flex">
                <NuxtLink
                  v-for="item in navigationItems"
                  :key="item.to"
                  :to="item.to"
                  class="text-sm font-medium text-[#4E6279] transition hover:text-[#0A1F44]"
                >
                  {{ item.label }}
                </NuxtLink>
              </nav>

              <label class="relative hidden sm:block">
                <span class="sr-only">Language</span>
                <select
                  :value="locale"
                  class="h-10 appearance-none border border-transparent bg-white pl-3 pr-8 text-sm font-medium text-[#163A5F] outline-none transition hover:border-[#D9E0E8]"
                  @change="handleLocaleSelect"
                >
                  <option
                    v-for="localeOption in availableLocales"
                    :key="localeOption.code"
                    :value="localeOption.code"
                  >
                    {{ localeOption.label }}
                  </option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E6279]" />
              </label>

              <NuxtLink
                :to="auth.user.value ? localePath('/dashboard') : localePath('/auth/login')"
                class="hidden rounded-full border border-[#D9E0E8] bg-white px-4 py-2 text-sm font-medium text-[#163A5F] transition hover:border-[#0A1F44] hover:text-[#0A1F44] sm:inline-flex"
              >
                {{ auth.user.value ? t('landing.header.account') : t('landing.header.signIn') }}
              </NuxtLink>

              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center border border-[#D9E0E8] bg-white text-[#163A5F] lg:hidden"
                :aria-expanded="mobileNavOpen ? 'true' : 'false'"
                :aria-label="mobileNavOpen ? t('shell.actions.closeNavigation') : t('shell.actions.openNavigation')"
                @click="mobileNavOpen = !mobileNavOpen"
              >
                <X v-if="mobileNavOpen" class="h-4.5 w-4.5" />
                <Menu v-else class="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          <div
            v-if="mobileNavOpen"
            class="mt-4 grid gap-4 border-t border-[#E6EBF1] pt-4 lg:hidden"
          >
            <nav class="grid gap-2">
              <NuxtLink
                v-for="item in navigationItems"
                :key="item.to"
                :to="item.to"
                class="border border-[#E6EBF1] bg-[#FAFBFC] px-4 py-3 text-sm font-medium text-[#163A5F]"
                @click="mobileNavOpen = false"
              >
                {{ item.label }}
              </NuxtLink>
            </nav>

            <label class="relative block">
              <span class="sr-only">Language</span>
              <select
                :value="locale"
                class="h-11 w-full appearance-none border border-[#D9E0E8] bg-white px-4 pr-10 text-sm font-medium text-[#163A5F] outline-none"
                @change="handleLocaleSelect"
              >
                <option
                  v-for="localeOption in availableLocales"
                  :key="localeOption.code"
                  :value="localeOption.code"
                >
                  {{ localeOption.label }}
                </option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E6279]" />
            </label>

            <NuxtLink
              :to="auth.user.value ? localePath('/dashboard') : localePath('/auth/login')"
              class="inline-flex min-h-11 items-center justify-center border border-[#D9E0E8] bg-white px-4 py-3 text-sm font-medium text-[#163A5F]"
              @click="mobileNavOpen = false"
            >
              {{ auth.user.value ? t('landing.header.account') : t('landing.header.signIn') }}
            </NuxtLink>
          </div>
        </div>

        <div class="grid gap-8 px-5 py-6 sm:px-8 sm:py-10 xl:grid-cols-[minmax(0,0.92fr)_minmax(380px,1.08fr)] xl:items-center">
          <div class="min-w-0">
            <h1 class="max-w-4xl font-serif text-[2.7rem] leading-[0.98] tracking-tight sm:text-6xl xl:text-[4.35rem]">
              <span class="block text-[#0A1F44]">{{ t('landing.hero.titleLead') }}</span>
              <span class="block text-[#0A1F44]">{{ t('landing.hero.titleLeadSecondary') }}</span>
              <span class="block text-[#1E9F47]">{{ t('landing.hero.titleAccent') }}</span>
            </h1>
            <p class="mt-5 max-w-lg text-[15px] leading-7 text-[#4E6279] sm:mt-6 sm:text-lg">
              {{ t('landing.hero.description') }}
            </p>

            <div class="mt-7 space-y-3.5 sm:mt-8 sm:space-y-4">
              <div
                v-for="item in bulletItems"
                :key="item.label"
                class="flex items-start gap-3"
              >
                <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF6EE] text-[#1E9F47]">
                  <component :is="item.icon" class="h-3.5 w-3.5" />
                </div>
                <p class="text-sm leading-6 text-[#163A5F] sm:text-base">
                  {{ item.label }}
                </p>
              </div>
            </div>

            <div class="mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
              <NuxtLink
                :to="primaryAction.to"
                class="inline-flex min-h-12 items-center justify-center rounded-[0.875rem] bg-[#D52B1E] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(213,43,30,0.18)] transition hover:bg-[#B52116] sm:w-auto"
              >
                {{ primaryAction.label }}
              </NuxtLink>
              <NuxtLink
                :to="secondaryAction.to"
                class="inline-flex min-h-12 items-center justify-center rounded-[0.875rem] border border-[#D9E0E8] bg-white px-5 py-3 text-sm font-medium text-[#163A5F] transition hover:border-[#BFCBDA] hover:text-[#0A1F44] sm:w-auto"
              >
                {{ secondaryAction.label }}
              </NuxtLink>
            </div>
          </div>

          <div class="relative min-h-[290px] sm:min-h-[460px]">
            <div class="absolute inset-0 overflow-hidden rounded-[1.25rem] border border-[#D9E0E8] bg-[#F7F8FA] shadow-[0_10px_30px_rgba(10,31,68,0.06)] sm:rounded-[1.5rem]">
              <img
                :src="heroImageSrc"
                :alt="t('landing.hero.imageAlt')"
                class="h-full w-full object-cover"
              >
              <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_32%,rgba(255,255,255,0)_100%)]" />
              <div class="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.45)_100%)]" />
            </div>

            <div class="absolute bottom-4 left-4 w-[13.5rem] rounded-[1rem] border border-[#E6EBF1] bg-white/96 p-4 shadow-[0_12px_30px_rgba(10,31,68,0.12)] backdrop-blur sm:bottom-8 sm:left-8 sm:w-[19rem] sm:rounded-[1.25rem] sm:p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-medium leading-5 text-[#163A5F]">
                    {{ t('landing.hero.card.document') }}
                  </p>
                  <p class="mt-1 text-xs uppercase tracking-[0.24em] text-[#7B8A9B]">
                    {{ t('landing.hero.card.year') }}
                  </p>
                </div>
                <div class="relative h-9 w-9 rounded-lg bg-[#FF3B30] shadow-[0_6px_18px_rgba(255,59,48,0.22)] sm:h-11 sm:w-11 sm:rounded-xl">
                  <span class="absolute left-1/2 top-1/2 h-[56%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-white" />
                  <span class="absolute left-1/2 top-1/2 h-[18%] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-white" />
                </div>
              </div>

              <p class="mt-5 font-serif text-[1.55rem] leading-none text-[#0A1F44] sm:mt-6 sm:text-[2rem]">
                {{ t('landing.hero.card.amount') }}
              </p>

              <div class="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
                <div class="h-2.5 w-24 rounded-full bg-[#E8EDF3]" />
                <div class="h-2.5 w-full rounded-full bg-[#EFF3F7]" />
                <div class="h-2.5 w-[88%] rounded-full bg-[#EFF3F7]" />
                <div class="h-2.5 w-[70%] rounded-full bg-[#EFF3F7]" />
              </div>

              <div class="mt-5 flex items-center justify-between gap-3 sm:mt-6">
                <div class="inline-flex items-center gap-2 rounded-full bg-[#FFF3F0] px-2.5 py-1.5 text-[11px] font-semibold text-[#D52B1E] sm:px-3 sm:text-xs">
                  <FileSearch class="h-3.5 w-3.5" />
                  <span>{{ t('landing.hero.card.finding') }}</span>
                </div>
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E9F47] text-white sm:h-11 sm:w-11">
                  <Check class="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="trust-bar" class="border-t border-[#E6EBF1] bg-[#FBFCFD] px-6 py-5 sm:px-8">
          <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <div
              v-for="item in proofItems"
              :key="item.title"
              class="flex items-start gap-3 border border-[#E6EBF1] bg-white px-3 py-3 sm:px-4 sm:py-4"
            >
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF6EE] text-[#1E9F47] sm:h-10 sm:w-10">
                <component :is="item.icon" class="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[#0A1F44]">
                  {{ item.title }}
                </p>
                <p class="mt-1 text-xs leading-5 text-[#4E6279] sm:text-sm sm:leading-6">
                  {{ item.body }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="process" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="overflow-hidden rounded-[1.5rem] border border-[#D9E0E8] bg-white shadow-[0_10px_30px_rgba(10,31,68,0.04)]">
        <div class="px-5 py-7 sm:px-8 sm:py-9">
          <div class="mx-auto max-w-3xl text-center">
            <div class="inline-flex items-center gap-2 rounded-full bg-[#EAF6EE] px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#1E9F47]">
              <ShieldCheck class="h-4 w-4" />
              <span>{{ t('landing.process.eyebrow') }}</span>
            </div>
            <h2 class="mt-5 font-serif text-[2.45rem] leading-[0.98] tracking-tight sm:text-[4rem]">
              <span class="text-[#0A1F44]">{{ t('landing.process.titleLead') }}</span>
              <span class="text-[#1E9F47]">{{ ` ${t('landing.process.titleAccent')}` }}</span>
            </h2>
            <p class="mx-auto mt-4 max-w-3xl text-base leading-8 text-[#4E6279]">
              {{ t('landing.process.description') }}
            </p>
          </div>
        </div>

        <div class="px-5 pb-5 sm:px-8 sm:pb-6">
          <div class="grid gap-8 lg:grid-cols-4 lg:gap-6">
            <article
              v-for="(step, index) in processSteps"
              :key="step.title"
              class="relative flex flex-col items-center text-center"
            >
              <div class="flex h-28 w-28 items-center justify-center rounded-full border border-[#E6EBF1] bg-[radial-gradient(circle_at_top,_#F7FCF8,_#EEF7F1)] text-[#166534] shadow-[0_8px_24px_rgba(10,31,68,0.04)] sm:h-32 sm:w-32">
                <component :is="step.icon" class="h-11 w-11 sm:h-12 sm:w-12" />
              </div>
              <div class="mt-4 inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-[#EAF6EE] px-3 text-[1.15rem] font-semibold leading-none text-[#1E9F47]">
                {{ index + 1 }}
              </div>
              <h3 class="mt-5 text-[1.05rem] font-semibold leading-7 text-[#0A1F44] sm:text-[1.12rem]">
                {{ step.title }}
              </h3>
              <p class="mt-3 max-w-[16rem] text-sm leading-7 text-[#4E6279]">
                {{ step.body }}
              </p>

              <div
                v-if="index < processSteps.length - 1"
                class="pointer-events-none absolute left-[calc(100%-0.1rem)] top-[3.45rem] hidden w-[4.5rem] items-center justify-center lg:flex"
              >
                <div class="flex w-full items-center gap-1.5 text-[#B8C4D2]">
                  <div class="h-px flex-1 border-t border-dashed border-[#CBD5E1]" />
                  <ChevronRight class="h-4 w-4 shrink-0" />
                </div>
              </div>
            </article>
          </div>

          <div class="mt-8 rounded-[1.25rem] border border-[#E6EBF1] bg-[#FCFDFE] p-3 shadow-[0_8px_20px_rgba(10,31,68,0.04)] sm:p-4">
            <div class="grid gap-2 sm:gap-3 lg:grid-cols-5">
            <div
              v-for="item in processTrustItems"
              :key="item.title"
              class="flex min-h-[6.5rem] items-start gap-3 rounded-[0.875rem] bg-white px-3 py-3.5 sm:px-4 sm:py-4"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF6EE] text-[#1E9F47] sm:h-11 sm:w-11">
                <component :is="item.icon" class="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold leading-6 text-[#0A1F44]">
                  {{ item.title }}
                </p>
                <p class="mt-1 text-[13px] leading-5 text-[#4E6279] sm:text-sm sm:leading-6">
                  {{ item.body }}
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="overflow-hidden rounded-[1.5rem] border border-[#D9E0E8] bg-white shadow-[0_10px_30px_rgba(10,31,68,0.04)]">
        <div class="border-b border-[#E6EBF1] px-5 py-7 sm:px-8 sm:py-9">
          <div class="mx-auto max-w-4xl text-center">
            <div class="inline-flex items-center gap-1.5 rounded-full bg-[#EAF6EE] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1E9F47]">
              <Sparkles class="h-3.5 w-3.5" />
              <span>{{ t('landing.features.eyebrow') }}</span>
            </div>
            <h2 class="font-serif text-[2.2rem] leading-[1.02] tracking-tight text-[#0A1F44] sm:text-[3rem]">
              {{ t('landing.features.title') }}
            </h2>
            <p class="mx-auto mt-4 max-w-3xl text-base leading-8 text-[#4E6279]">
              {{ t('landing.features.description') }}
            </p>
          </div>
        </div>

        <div class="px-5 py-5 sm:px-8 sm:py-6">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article
              v-for="card in featureCards"
              :key="card.title"
              class="flex h-full min-h-[15rem] flex-col rounded-[1.25rem] border border-[#E6EBF1] bg-[#FCFDFE] p-5 shadow-[0_6px_16px_rgba(10,31,68,0.03)] sm:p-5"
            >
              <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF6EE] text-[#1E9F47]">
                <component :is="card.icon" class="h-5 w-5" />
              </div>
              <h3 class="mt-4 text-[1.05rem] font-semibold leading-6 text-[#0A1F44]">
                {{ card.title }}
              </h3>
              <p class="mt-2.5 flex-1 text-sm leading-6 text-[#4E6279]">
                {{ card.body }}
              </p>
            </article>
          </div>

          <div class="mt-6 overflow-hidden rounded-[1.25rem] border border-[#E6EBF1] bg-[#FCFDFE] shadow-[0_6px_16px_rgba(10,31,68,0.03)]">
            <div class="grid sm:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="item in featureTrustItems"
                :key="item.title"
                class="flex min-h-[6rem] items-start gap-3 border-b border-[#E6EBF1] bg-[#FCFDFE] px-5 py-4 last:border-b-0 sm:px-6 xl:border-b-0 xl:border-r xl:last:border-r-0"
              >
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E9F47] text-white shadow-[0_3px_8px_rgba(30,159,71,0.18)]">
                  <Check class="h-3.5 w-3.5" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold leading-5 text-[#0A1F44]">
                    {{ item.title }}
                  </p>
                  <p class="mt-1 text-[13px] leading-5 text-[#4E6279]">
                    {{ item.body }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="pricing" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="overflow-hidden rounded-[1.5rem] border border-[#D9E0E8] bg-white shadow-[0_10px_30px_rgba(10,31,68,0.04)]">
        <div class="border-b border-[#E6EBF1] px-5 py-5 sm:px-8 sm:py-7">
          <div class="mx-auto max-w-3xl text-center">
            <h2 class="font-serif text-[2.35rem] leading-[1.02] tracking-tight text-[#0A1F44] sm:text-5xl">
              {{ t('landing.pricingSection.titleLead') }}
              <span class="text-[#1E9F47]">{{ ` ${t('landing.pricingSection.titleAccent')}` }}</span>
            </h2>
            <p class="mt-4 text-base leading-8 text-[#4E6279]">
              {{ t('landing.pricingSection.description') }}
            </p>
          </div>
        </div>

        <div class="px-5 py-5 sm:px-8 sm:py-6">
          <div class="grid gap-4 border-b border-[#E6EBF1] pb-6 sm:gap-5 lg:grid-cols-4">
            <div
              v-for="item in pricingHighlights"
              :key="item.title"
              class="flex items-start gap-3"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF6EE] text-[#1E9F47]">
                <component :is="item.icon" class="h-4.5 w-4.5" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[#0A1F44]">
                  {{ item.title }}
                </p>
                <p class="mt-1 text-sm leading-6 text-[#4E6279]">
                  {{ item.body }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.03fr)_minmax(330px,0.97fr)] xl:items-stretch">
            <div class="rounded-[1.25rem] border border-[#E6EBF1] bg-[#FCFDFE] p-5 shadow-[0_12px_28px_rgba(10,31,68,0.04)] sm:p-6">
              <h3 class="font-serif text-[1.85rem] leading-[1.04] tracking-tight text-[#0A1F44] sm:text-[2.05rem]">
                {{ t('landing.pricingSection.listTitle') }}
              </h3>

              <div class="mt-5 divide-y divide-[#E6EBF1] border-y border-[#E6EBF1]">
                <NuxtLink
                  v-for="item in pricingChecks"
                  :key="item.code"
                  :to="item.to"
                  class="flex items-center gap-3 py-3.5 transition hover:bg-white sm:gap-4 sm:py-4"
                >
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF6EE] text-[#1E9F47] sm:h-11 sm:w-11">
                    <component :is="item.icon" class="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="text-[1.02rem] font-semibold leading-6 text-[#0A1F44]">
                      {{ item.title }}
                    </p>
                    <p class="mt-0.5 text-[13px] leading-5 text-[#4E6279] sm:text-sm">
                      {{ item.body }}
                    </p>
                  </div>

                  <div class="flex shrink-0 items-center gap-2.5 pl-2 sm:gap-3 sm:pl-3">
                    <span class="text-[1.85rem] font-semibold leading-none tracking-tight text-[#0A1F44] sm:text-[2rem]">
                      {{ item.price }}
                    </span>
                    <ChevronRight class="h-4.5 w-4.5 text-[#1E9F47] sm:h-5 sm:w-5" />
                  </div>
                </NuxtLink>
              </div>

              <div class="mt-5 rounded-[0.875rem] bg-[#F7F9FB] px-4 py-3 text-[13px] leading-6 text-[#4E6279] sm:text-sm">
                <span class="font-semibold text-[#163A5F]">{{ t('landing.pricingSection.noteLead') }}</span>
                {{ t('landing.pricingSection.noteBody') }}
              </div>
            </div>

            <div class="relative rounded-[1.25rem] border border-[#50B973] bg-white p-5 shadow-[0_16px_34px_rgba(30,159,71,0.1)] sm:p-6">
              <div class="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 lg:left-8 lg:translate-x-0">
                <div class="inline-flex rounded-full bg-[#1E9F47] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_18px_rgba(30,159,71,0.18)]">
                  {{ t('landing.pricingSection.bundleBadge') }}
                </div>
              </div>

              <div class="mt-4 flex h-full flex-col">
                <div class="flex items-start gap-4">
                <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EAF6EE] text-[#1E9F47]">
                  <ShieldCheck class="h-7 w-7" />
                </div>
                <div>
                  <h3 class="font-serif text-[2rem] leading-[1.04] tracking-tight text-[#0A1F44] sm:text-[2.35rem]">
                    {{ t('landing.pricingSection.bundleTitle') }}
                  </h3>
                  <p class="mt-2 text-sm leading-6 text-[#4E6279] sm:text-base">
                    {{ t('landing.pricingSection.bundleBody') }}
                  </p>
                </div>
              </div>

                <div class="mt-5 flex flex-1 flex-col border-t border-[#E6EBF1] pt-5">
                <div class="flex flex-wrap items-center gap-3">
                  <p class="font-serif text-[3.3rem] leading-none tracking-tight text-[#1E9F47] sm:text-[3.9rem]">
                    {{ t('landing.pricingSection.bundlePrice') }}
                  </p>
                  <span class="rounded-full bg-[#EAF6EE] px-3 py-1.5 text-[13px] font-semibold text-[#1E9F47] sm:text-sm">
                    {{ t('landing.pricingSection.bundleSavings') }}
                  </span>
                </div>

                <div class="mt-5 space-y-3.5">
                  <div
                    v-for="feature in bundleFeatures"
                    :key="feature"
                    class="flex items-start gap-3"
                  >
                    <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E9F47] text-white">
                      <Check class="h-3 w-3" />
                    </div>
                    <p class="text-sm leading-6 text-[#163A5F] sm:text-[15px]">
                      {{ feature }}
                    </p>
                  </div>
                </div>

                <NuxtLink
                  :to="buildBundlePath()"
                  class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[0.875rem] bg-[#1E9F47] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(30,159,71,0.18)] transition hover:bg-[#19863C]"
                >
                  {{ t('landing.pricingSection.bundleCta') }}
                </NuxtLink>

                <div class="mt-4 flex items-center justify-center gap-2 text-sm text-[#4E6279]">
                  <ShieldCheck class="h-4 w-4 text-[#1E9F47]" />
                  <span>{{ t('landing.pricingSection.bundleFootnote') }}</span>
                </div>
              </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <section id="faq" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="overflow-hidden rounded-[1.5rem] border border-[#D9E0E8] bg-white shadow-[0_10px_30px_rgba(10,31,68,0.04)]">
        <div class="border-b border-[#E6EBF1] px-5 py-5 sm:px-8 sm:py-7">
          <div class="mx-auto max-w-3xl text-center">
            <h2 class="font-serif text-[2.2rem] leading-[1.02] tracking-tight text-[#0A1F44] sm:text-[3rem]">
              {{ t('landing.faq.title') }}
            </h2>
            <p class="mt-4 text-base leading-8 text-[#4E6279]">
              {{ t('landing.faq.description') }}
            </p>
          </div>
        </div>

        <div class="px-5 py-5 sm:px-8 sm:py-6">
          <div class="mx-auto max-w-4xl">
            <div class="grid gap-4 lg:grid-cols-2 lg:gap-5">
              <div
                v-for="(column, columnIndex) in faqColumns"
                :key="`faq-column-${columnIndex}`"
                class="grid gap-4 lg:content-start"
              >
                <div
                  v-for="item in column"
                  :key="item.id"
                  :class="[
                    'overflow-hidden rounded-[1.25rem] border bg-[#FCFDFE] shadow-[0_8px_20px_rgba(10,31,68,0.04)] transition-[border-color,box-shadow,background-color] duration-200',
                    activeFaq === item.id ? 'border-[#8CD0A4]' : 'border-[#E6EBF1]'
                  ]"
                >
                  <button
                    type="button"
                    class="flex min-h-[5.25rem] w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white sm:px-6 sm:py-5"
                    :aria-expanded="activeFaq === item.id ? 'true' : 'false'"
                    @click="toggleFaq(item.id)"
                  >
                    <div class="flex min-w-0 items-center gap-3 sm:gap-4">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF6EE] text-[#1E9F47] sm:h-11 sm:w-11">
                        <component :is="item.icon" class="h-4.5 w-4.5" />
                      </div>
                      <span class="text-[1rem] font-semibold leading-7 text-[#0A1F44] sm:text-[1.05rem]">
                        {{ item.question }}
                      </span>
                    </div>
                    <ChevronDown
                      :class="[
                        'h-5 w-5 shrink-0 text-[#4E6279] transition-transform duration-200',
                        activeFaq === item.id ? 'rotate-180' : ''
                      ]"
                    />
                  </button>

                  <div
                    :class="[
                      'grid overflow-hidden bg-white transition-all duration-300 ease-out',
                      activeFaq === item.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    ]"
                  >
                    <div class="min-h-0">
                      <p class="max-w-3xl px-5 pb-5 text-sm leading-7 text-[#4E6279] sm:px-6 sm:pb-6 sm:text-[15px]">
                        {{ item.answer }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 rounded-[1.25rem] border border-[#E6EBF1] bg-[#FCFDFE] px-5 py-6 sm:px-6 sm:py-7">
              <div class="text-center">
                <h3 class="font-serif text-[1.8rem] leading-[1.04] tracking-tight text-[#0A1F44] sm:text-[2.2rem]">
                  {{ t('landing.faq.ctaTitle') }}
                </h3>
                <p class="mt-3 text-sm leading-7 text-[#4E6279] sm:text-base">
                  {{ t('landing.faq.ctaDescription') }}
                </p>
              </div>

              <div class="mt-5 flex justify-center">
                <NuxtLink
                  :to="faqPrimaryAction"
                  class="inline-flex min-h-12 items-center justify-center rounded-[0.875rem] bg-[#D52B1E] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(213,43,30,0.18)] transition hover:bg-[#B52116]"
                >
                  {{ t('landing.faq.ctaAction') }}
                </NuxtLink>
              </div>

              <div class="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <div
                  v-for="item in faqTrustItems"
                  :key="item"
                  class="flex items-center gap-2 rounded-[0.875rem] border border-[#E6EBF1] bg-white px-3 py-3 text-sm font-medium text-[#163A5F]"
                >
                  <Check class="h-4 w-4 shrink-0 text-[#1E9F47]" />
                  <span>{{ item }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <div class="overflow-hidden rounded-[1.5rem] border border-[#D9E0E8] bg-white shadow-[0_10px_30px_rgba(10,31,68,0.04)]">
        <div class="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p class="text-xs uppercase tracking-[0.34em] text-[#7B8A9B]">
              {{ t('landing.finalCta.eyebrow') }}
            </p>
            <h2 class="mt-4 max-w-4xl font-serif text-[2.35rem] leading-[1.05] tracking-tight text-[#0A1F44] sm:text-5xl">
              {{ t('landing.finalCta.title') }}
            </h2>
            <p class="mt-5 max-w-3xl text-base leading-8 text-[#4E6279]">
              {{ t('landing.finalCta.description') }}
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            <div
              class="inline-flex min-h-12 items-center justify-center rounded-[0.875rem] border border-[#D9E0E8] bg-[#FAFBFC] px-5 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#4E6279]"
            >
              {{ t('landing.finalCta.badge') }}
            </div>
            <NuxtLink
              :to="primaryAction.to"
              class="inline-flex min-h-12 items-center justify-center rounded-[0.875rem] bg-[#D52B1E] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(213,43,30,0.18)] transition hover:bg-[#B52116]"
            >
              {{ primaryAction.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
