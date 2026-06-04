import { sql } from 'drizzle-orm'
import { bigint, datetime, index, longtext, mysqlEnum, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'

import { errorScopeValues, errorStatusValues } from './enums'

export const systemErrors = mysqlTable(
  'system_errors',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    scope: mysqlEnum('scope', errorScopeValues).notNull(),
    relatedEntityType: varchar('related_entity_type', { length: 100 }),
    relatedEntityId: bigint('related_entity_id', { mode: 'number', unsigned: true }),
    message: text('message').notNull(),
    stackTrace: longtext('stack_trace'),
    status: mysqlEnum('status', errorStatusValues).notNull().default('open'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    resolvedAt: datetime('resolved_at', { mode: 'date' })
  },
  table => ({
    scopeIdx: index('system_errors_scope_idx').on(table.scope),
    relatedEntityIdx: index('system_errors_related_entity_idx').on(table.relatedEntityType, table.relatedEntityId),
    statusIdx: index('system_errors_status_idx').on(table.status)
  })
)
