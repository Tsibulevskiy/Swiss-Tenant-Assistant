import { sql } from 'drizzle-orm'
import { bigint, datetime, index, int, json, mysqlEnum, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'

import { cases } from './cases'
import { checks } from './checks'
import { aiPurposeValues, genericRunStatusValues } from './enums'
import { users } from './users'

export const aiRuns = mysqlTable(
  'ai_runs',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    caseId: bigint('case_id', { mode: 'number', unsigned: true }).references(() => cases.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    checkId: bigint('check_id', { mode: 'number', unsigned: true }).references(() => checks.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    purpose: mysqlEnum('purpose', aiPurposeValues).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    promptVersion: varchar('prompt_version', { length: 100 }).notNull(),
    inputJson: json('input_json'),
    outputJson: json('output_json'),
    status: mysqlEnum('status', genericRunStatusValues).notNull().default('pending'),
    tokenInput: int('token_input', { unsigned: true }),
    tokenOutput: int('token_output', { unsigned: true }),
    errorMessage: text('error_message'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    finishedAt: datetime('finished_at', { mode: 'date' })
  },
  table => ({
    checkIdIdx: index('ai_runs_check_id_idx').on(table.checkId),
    purposeIdx: index('ai_runs_purpose_idx').on(table.purpose),
    statusIdx: index('ai_runs_status_idx').on(table.status),
    createdAtIdx: index('ai_runs_created_at_idx').on(table.createdAt)
  })
)
