import { sql } from 'drizzle-orm'
import { bigint, datetime, index, json, mysqlEnum, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'

import { checks } from './checks'
import { findingSeverityValues } from './enums'

export const ruleFindings = mysqlTable(
  'rule_findings',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    checkId: bigint('check_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => checks.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ruleCode: varchar('rule_code', { length: 100 }).notNull(),
    severity: mysqlEnum('severity', findingSeverityValues).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    matchedValue: varchar('matched_value', { length: 255 }),
    metadataJson: json('metadata_json'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  table => ({
    checkIdIdx: index('rule_findings_check_id_idx').on(table.checkId),
    ruleCodeIdx: index('rule_findings_rule_code_idx').on(table.ruleCode),
    severityIdx: index('rule_findings_severity_idx').on(table.severity)
  })
)
