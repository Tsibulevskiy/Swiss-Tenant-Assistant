import { sql } from 'drizzle-orm'
import { bigint, datetime, index, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'

import { users } from './users'

export const passwordResetTokens = mysqlTable(
  'password_reset_tokens',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
    usedAt: datetime('used_at', { mode: 'date' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  table => ({
    userIdIdx: index('password_reset_tokens_user_id_idx').on(table.userId),
    expiresAtIdx: index('password_reset_tokens_expires_at_idx').on(table.expiresAt),
    tokenHashUniqueIdx: uniqueIndex('password_reset_tokens_token_hash_unique_idx').on(table.tokenHash)
  })
)
