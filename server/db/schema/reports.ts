import { sql } from 'drizzle-orm'
import { bigint, datetime, index, int, mysqlEnum, mysqlTable } from 'drizzle-orm/mysql-core'

import { cases } from './cases'
import { checks } from './checks'
import { documents } from './documents'
import { reportStatusValues, reportTypeValues } from './enums'
import { users } from './users'

export const reports = mysqlTable(
  'reports',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    caseId: bigint('case_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    checkId: bigint('check_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => checks.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    documentId: bigint('document_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    type: mysqlEnum('type', reportTypeValues).notNull(),
    version: int('version', { unsigned: true }).notNull().default(1),
    status: mysqlEnum('status', reportStatusValues).notNull().default('generating'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date())
  },
  table => ({
    checkIdIdx: index('reports_check_id_idx').on(table.checkId),
    caseIdIdx: index('reports_case_id_idx').on(table.caseId),
    statusIdx: index('reports_status_idx').on(table.status)
  })
)
