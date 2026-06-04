import { sql } from 'drizzle-orm'
import { bigint, boolean, datetime, index, mysqlEnum, mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { cases } from './cases'
import { documentKindValues, documentStatusValues } from './enums'
import { users } from './users'

export const documents = mysqlTable(
  'documents',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    caseId: bigint('case_id', { mode: 'number', unsigned: true }).references(() => cases.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    kind: mysqlEnum('kind', documentKindValues).notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    storagePath: varchar('storage_path', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSize: bigint('file_size', { mode: 'number', unsigned: true }).notNull(),
    sha256: varchar('sha256', { length: 64 }).notNull(),
    isEncrypted: boolean('is_encrypted').notNull().default(false),
    encryptionKeyRef: varchar('encryption_key_ref', { length: 255 }),
    uploadedBy: bigint('uploaded_by', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: mysqlEnum('status', documentStatusValues).notNull().default('uploaded'),
    deleteAfterAt: datetime('delete_after_at', { mode: 'date' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
    deletedAt: datetime('deleted_at', { mode: 'date' })
  },
  table => ({
    userIdIdx: index('documents_user_id_idx').on(table.userId),
    caseIdIdx: index('documents_case_id_idx').on(table.caseId),
    kindIdx: index('documents_kind_idx').on(table.kind),
    statusIdx: index('documents_status_idx').on(table.status),
    deleteAfterAtIdx: index('documents_delete_after_at_idx').on(table.deleteAfterAt),
    sha256Idx: index('documents_sha256_idx').on(table.sha256)
  })
)
