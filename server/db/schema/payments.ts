import { sql } from 'drizzle-orm'
import { bigint, char, datetime, decimal, index, json, mysqlEnum, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'

import { cases } from './cases'
import { checks } from './checks'
import { paymentProviderValues, paymentStatusValues } from './enums'
import { products } from './products'
import { users } from './users'

export const payments = mysqlTable(
  'payments',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    caseId: bigint('case_id', { mode: 'number', unsigned: true }).references(() => cases.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    checkId: bigint('check_id', { mode: 'number', unsigned: true }).references(() => checks.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    productId: bigint('product_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => products.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    provider: mysqlEnum('provider', paymentProviderValues).notNull(),
    providerSessionId: varchar('provider_session_id', { length: 255 }),
    providerPaymentIntentId: varchar('provider_payment_intent_id', { length: 255 }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: char('currency', { length: 3 }).notNull().default('CHF'),
    status: mysqlEnum('status', paymentStatusValues).notNull().default('pending'),
    paidAt: datetime('paid_at', { mode: 'date' }),
    rawWebhookJson: json('raw_webhook_json'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date())
  },
  table => ({
    userIdIdx: index('payments_user_id_idx').on(table.userId),
    checkIdIdx: index('payments_check_id_idx').on(table.checkId),
    statusIdx: index('payments_status_idx').on(table.status),
    providerSessionUniqueIdx: uniqueIndex('payments_provider_session_unique_idx').on(table.providerSessionId),
    providerPaymentIntentUniqueIdx: uniqueIndex('payments_provider_payment_intent_unique_idx').on(
      table.providerPaymentIntentId
    )
  })
)
