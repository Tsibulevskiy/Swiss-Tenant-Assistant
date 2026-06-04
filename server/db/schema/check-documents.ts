import { sql } from 'drizzle-orm'
import { bigint, datetime, index, mysqlEnum, mysqlTable, uniqueIndex } from 'drizzle-orm/mysql-core'

import { checks } from './checks'
import { documents } from './documents'
import { checkDocumentRoleValues } from './enums'

export const checkDocuments = mysqlTable(
  'check_documents',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    checkId: bigint('check_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => checks.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    documentId: bigint('document_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    role: mysqlEnum('role', checkDocumentRoleValues).notNull(),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  table => ({
    checkDocumentRoleUniqueIdx: uniqueIndex('check_documents_check_document_role_unique_idx').on(
      table.checkId,
      table.documentId,
      table.role
    ),
    documentIdIdx: index('check_documents_document_id_idx').on(table.documentId)
  })
)
