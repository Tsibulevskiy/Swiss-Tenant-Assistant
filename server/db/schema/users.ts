import { sql } from 'drizzle-orm'
import { bigint, datetime, mysqlEnum, mysqlTable, uniqueIndex, varchar, index } from 'drizzle-orm/mysql-core'

import { userRoleValues } from './enums'

export const users = mysqlTable(
  'users',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    email: varchar('email', { length: 254 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: mysqlEnum('role', userRoleValues).notNull().default('user'),
    locale: varchar('locale', { length: 10 }).notNull().default('de'),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    emailVerifiedAt: datetime('email_verified_at', { mode: 'date' }),
    termsAcceptedAt: datetime('terms_accepted_at', { mode: 'date' }),
    privacyAcceptedAt: datetime('privacy_accepted_at', { mode: 'date' }),
    disclaimerAcceptedAt: datetime('disclaimer_accepted_at', { mode: 'date' }),
    marketingConsentAt: datetime('marketing_consent_at', { mode: 'date' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
    deletedAt: datetime('deleted_at', { mode: 'date' })
  },
  table => ({
    emailUniqueIdx: uniqueIndex('users_email_unique_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt)
  })
)
