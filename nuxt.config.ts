import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/tailwind.css'],
  modules: ['@pinia/nuxt', 'shadcn-nuxt', '@nuxtjs/i18n'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    compressPublicAssets: true
  },
  routeRules: {
    '/api/**': {
      headers: {
        'cache-control': 'no-store'
      }
    }
  },
  runtimeConfig: {
    appUrl: '',
    openAiApiKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    brevoApiKey: '',
    storageUploadsDir: 'storage/uploads',
    storageReportsDir: 'storage/reports',
    public: {
      appName: 'Swiss Tenant Assistant',
      apiBase: '/api'
    }
  },
  i18n: {
    defaultLocale: 'de',
    langDir: 'locales',
    locales: [
      { code: 'de', name: 'Deutsch', file: 'de.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'it', name: 'Italiano', file: 'it.json' }
    ],
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'sta_locale',
      redirectOn: 'root'
    },
    vueI18n: './i18n.config.ts'
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },
  vite: {
    plugins: [tailwindcss()]
  }
})
