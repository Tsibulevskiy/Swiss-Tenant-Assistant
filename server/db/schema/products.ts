import { sql } from 'drizzle-orm'
import { bigint, boolean, char, datetime, decimal, json, mysqlEnum, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'

import { productTypeValues } from './enums'

export const products = mysqlTable(
  'products',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: mysqlEnum('type', productTypeValues).notNull(),
    priceChf: decimal('price_chf', { precision: 10, scale: 2 }).notNull(),
    currency: char('currency', { length: 3 }).notNull().default('CHF'),
    isActive: boolean('is_active').notNull().default(true),
    metadataJson: json('metadata_json'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date())
  },
  table => ({
    codeUniqueIdx: uniqueIndex('products_code_unique_idx').on(table.code)
  })
)
