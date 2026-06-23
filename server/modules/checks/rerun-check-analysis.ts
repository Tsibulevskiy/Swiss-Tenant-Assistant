import { and, eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { checkDocuments, documents } from '../../db/schema'
import type { AuthUser } from '../auth/types'
import { createCheckFromDocument } from './create-check-from-document'
import type { RerunCheckAnalysisInput } from '../../../shared/schemas/checks'

export async function rerunCheckAnalysis(options: {
  checkId: number
  user: AuthUser
  retryMode: RerunCheckAnalysisInput['retryMode']
}) {
  const db = getDb()
  const { checkId, user, retryMode } = options

  const existingCheck = await db.query.checks.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, checkId), eq(table.userId, user.id)),
    columns: {
      id: true,
      caseId: true,
      type: true
    }
  })

  if (!existingCheck) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Check not found'
    })
  }

  const [primaryDocument] = await db
    .select({
      id: documents.id
    })
    .from(checkDocuments)
    .innerJoin(documents, eq(checkDocuments.documentId, documents.id))
    .where(
      and(
        eq(checkDocuments.checkId, existingCheck.id),
        eq(checkDocuments.role, 'primary'),
        eq(documents.userId, user.id)
      )
    )
    .limit(1)

  if (!primaryDocument) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Primary document not found for this check'
    })
  }

  return createCheckFromDocument({
    documentId: primaryDocument.id,
    user,
    reuseExisting: false,
    extractionMode: retryMode,
    trigger: {
      type: 'rerun',
      sourceCheckId: existingCheck.id,
      retryMode
    }
  })
}
