import { sql } from 'drizzle-orm'
import { bigint, datetime, index, json, mysqlEnum, mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { actorTypeValues } from './enums'
import { users } from './users'

export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    actorType: mysqlEnum('actor_type', actorTypeValues).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: bigint('entity_id', { mode: 'number', unsigned: true }),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: varchar('user_agent', { length: 500 }),
    metadataJson: json('metadata_json'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  table => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt)
  })
)
