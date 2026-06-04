import { sql } from 'drizzle-orm'
import { bigint, datetime, index, mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { users } from './users'

export const userSessions = mysqlTable(
  'user_sessions',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    revokedAt: datetime('revoked_at', { mode: 'date' })
  },
  table => ({
    userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('user_sessions_expires_at_idx').on(table.expiresAt)
  })
)
