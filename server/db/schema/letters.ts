import { sql } from 'drizzle-orm'
import { bigint, datetime, index, longtext, mysqlEnum, mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { cases } from './cases'
import { checks } from './checks'
import { documents } from './documents'
import { letterStatusValues, letterTypeValues } from './enums'
import { users } from './users'

export const letters = mysqlTable(
  'letters',
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
    type: mysqlEnum('type', letterTypeValues).notNull(),
    locale: varchar('locale', { length: 10 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    bodyText: longtext('body_text').notNull(),
    bodyHtml: longtext('body_html'),
    pdfDocumentId: bigint('pdf_document_id', { mode: 'number', unsigned: true }).references(() => documents.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    emailDocumentId: bigint('email_document_id', { mode: 'number', unsigned: true }).references(() => documents.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    status: mysqlEnum('status', letterStatusValues).notNull().default('generated'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date())
  },
  table => ({
    userIdIdx: index('letters_user_id_idx').on(table.userId),
    caseIdIdx: index('letters_case_id_idx').on(table.caseId),
    checkIdIdx: index('letters_check_id_idx').on(table.checkId),
    typeIdx: index('letters_type_idx').on(table.type)
  })
)
