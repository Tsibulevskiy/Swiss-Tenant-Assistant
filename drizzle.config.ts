import 'dotenv/config'

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './server/db/schema/**/*.ts',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'sta_app',
    password: process.env.MYSQL_PASSWORD || 'sta_app_password',
    database: process.env.MYSQL_DATABASE || 'swiss_tenant_assistant'
  },
  strict: true,
  verbose: true
})
