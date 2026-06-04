import { sql } from 'drizzle-orm'
import { bigint, datetime, index, mysqlEnum, mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { caseStatusValues, caseTypeValues } from './enums'
import { users } from './users'

export const cases = mysqlTable(
  'cases',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    type: mysqlEnum('type', caseTypeValues).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    status: mysqlEnum('status', caseStatusValues).notNull().default('draft'),
    locale: varchar('locale', { length: 10 }).notNull().default('de'),
    openedAt: datetime('opened_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    closedAt: datetime('closed_at', { mode: 'date' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date())
  },
  table => ({
    userStatusIdx: index('cases_user_status_idx').on(table.userId, table.status),
    typeIdx: index('cases_type_idx').on(table.type),
    createdAtIdx: index('cases_created_at_idx').on(table.createdAt)
  })
)
