import { sql } from 'drizzle-orm'
import { bigint, datetime, index, json, mysqlEnum, mysqlTable, text } from 'drizzle-orm/mysql-core'

import { cases } from './cases'
import { checkStatusValues, checkTypeValues, riskScoreValues } from './enums'
import { users } from './users'

export const checks = mysqlTable(
  'checks',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    caseId: bigint('case_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    type: mysqlEnum('type', checkTypeValues).notNull(),
    status: mysqlEnum('status', checkStatusValues).notNull().default('draft'),
    inputPayloadJson: json('input_payload_json'),
    structuredInputJson: json('structured_input_json'),
    ruleResultJson: json('rule_result_json'),
    aiResultJson: json('ai_result_json'),
    riskScore: mysqlEnum('risk_score', riskScoreValues),
    summaryText: text('summary_text'),
    disclaimerText: text('disclaimer_text'),
    errorMessage: text('error_message'),
    startedAt: datetime('started_at', { mode: 'date' }),
    finishedAt: datetime('finished_at', { mode: 'date' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date())
  },
  table => ({
    userIdIdx: index('checks_user_id_idx').on(table.userId),
    caseIdIdx: index('checks_case_id_idx').on(table.caseId),
    typeStatusIdx: index('checks_type_status_idx').on(table.type, table.status),
    createdAtIdx: index('checks_created_at_idx').on(table.createdAt)
  })
)
