import { sql } from 'drizzle-orm'
import { bigint, datetime, index, json, mysqlEnum, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'

import { cases } from './cases'
import { emailProviderValues, emailStatusValues } from './enums'
import { users } from './users'

export const emailMessages = mysqlTable(
  'email_messages',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    caseId: bigint('case_id', { mode: 'number', unsigned: true }).references(() => cases.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    templateCode: varchar('template_code', { length: 100 }).notNull(),
    recipientEmail: varchar('recipient_email', { length: 254 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    payloadJson: json('payload_json'),
    provider: mysqlEnum('provider', emailProviderValues).notNull(),
    providerMessageId: varchar('provider_message_id', { length: 255 }),
    status: mysqlEnum('status', emailStatusValues).notNull().default('pending'),
    errorMessage: text('error_message'),
    sentAt: datetime('sent_at', { mode: 'date' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date())
  },
  table => ({
    userIdIdx: index('email_messages_user_id_idx').on(table.userId),
    templateCodeIdx: index('email_messages_template_code_idx').on(table.templateCode),
    statusIdx: index('email_messages_status_idx').on(table.status)
  })
)
