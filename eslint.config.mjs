import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'app/**',
      '.nuxt/**',
      '.output/**',
      '.data/**',
      '.nitro/**',
      '.cache/**',
      'dist/**',
      'node_modules/**',
      'storage/**',
      'drizzle/**',
      'fixtures/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'server/**/*.{js,mjs,cjs,ts,mts,cts}',
      'shared/**/*.{js,mjs,cjs,ts,mts,cts}',
      'scripts/**/*.{js,mjs,cjs,ts,mts,cts}',
      'nuxt.config.ts',
      'drizzle.config.ts'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
)
