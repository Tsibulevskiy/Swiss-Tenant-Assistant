import { sql } from 'drizzle-orm'
import { bigint, datetime, index, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'

import { documents } from './documents'
import { users } from './users'

export const signedLinks = mysqlTable(
  'signed_links',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    documentId: bigint('document_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
    usedAt: datetime('used_at', { mode: 'date' }),
    createdByUserId: bigint('created_by_user_id', { mode: 'number', unsigned: true }).references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  table => ({
    documentIdIdx: index('signed_links_document_id_idx').on(table.documentId),
    expiresAtIdx: index('signed_links_expires_at_idx').on(table.expiresAt),
    tokenHashUniqueIdx: uniqueIndex('signed_links_token_hash_unique_idx').on(table.tokenHash)
  })
)
