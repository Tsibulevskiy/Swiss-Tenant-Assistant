import { sql } from 'drizzle-orm'
import { bigint, datetime, decimal, index, json, longtext, mysqlEnum, mysqlTable, text } from 'drizzle-orm/mysql-core'

import { documents } from './documents'
import { extractionEngineValues, extractionStatusValues } from './enums'

export const documentExtractions = mysqlTable(
  'document_extractions',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    documentId: bigint('document_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    engine: mysqlEnum('engine', extractionEngineValues).notNull(),
    status: mysqlEnum('status', extractionStatusValues).notNull().default('pending'),
    rawText: longtext('raw_text'),
    normalizedText: longtext('normalized_text'),
    structuredDataJson: json('structured_data_json'),
    confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }),
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
    documentIdIdx: index('document_extractions_document_id_idx').on(table.documentId),
    statusIdx: index('document_extractions_status_idx').on(table.status)
  })
)
