import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/tailwind.css'],
  modules: ['@pinia/nuxt', 'shadcn-nuxt', '@nuxtjs/i18n'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    compressPublicAssets: true,
    externals: {
      external: ['tesseract.js', 'tesseract.js-core']
    }
  },
  routeRules: {
    '/api/**': {
      headers: {
        'cache-control': 'no-store'
      }
    }
  },
  runtimeConfig: {
    appUrl: process.env.NUXT_APP_URL || '',
    mysqlHost: process.env.MYSQL_HOST || '127.0.0.1',
    mysqlPort: Number(process.env.MYSQL_PORT || 3306),
    mysqlDatabase: process.env.MYSQL_DATABASE || '',
    mysqlUser: process.env.MYSQL_USER || '',
    mysqlPassword: process.env.MYSQL_PASSWORD || '',
    openAiApiKey: process.env.NUXT_OPENAI_API_KEY || '',
    stripeSecretKey: process.env.NUXT_STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.NUXT_STRIPE_WEBHOOK_SECRET || '',
    brevoApiKey: process.env.NUXT_BREVO_API_KEY || '',
    storageUploadsDir: process.env.NUXT_STORAGE_UPLOADS_DIR || 'storage/uploads',
    storageReportsDir: process.env.NUXT_STORAGE_REPORTS_DIR || 'storage/reports',
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
