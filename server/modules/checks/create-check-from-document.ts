import { and, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { cases, checkDocuments, checks, documents, ruleFindings } from '../../db/schema'
import type { AuthUser } from '../auth/types'
import { saveDocumentExtraction } from '../documents/save-document-extraction'
import { evaluateRulesForCheck } from './evaluate-rules'

const documentKindToCheckType = {
  mietvertrag: 'mietvertrag_check',
  nebenkostenabrechnung: 'nebenkosten_check',
  rent_increase_letter: 'rent_increase_check',
  deduction_list: 'deposit_return_check'
} as const

const checkTypeToCaseType = {
  mietvertrag_check: 'mietvertrag',
  nebenkosten_check: 'nebenkosten',
  rent_increase_check: 'mietzinserhoehung',
  deposit_return_check: 'deposit_return'
} as const

type SupportedCheckType = (typeof documentKindToCheckType)[keyof typeof documentKindToCheckType]

function buildCaseTitle(originalName: string, checkType: SupportedCheckType) {
  const cleanName = originalName.replace(/\.[^.]+$/, '')

  switch (checkType) {
    case 'mietvertrag_check':
      return `Mietvertrag: ${cleanName}`
    case 'nebenkosten_check':
      return `Nebenkosten: ${cleanName}`
    case 'rent_increase_check':
      return `Mietzinserhoehung: ${cleanName}`
    case 'deposit_return_check':
      return `Deposit return: ${cleanName}`
  }
}

export async function createCheckFromDocument(options: {
  documentId: number
  user: AuthUser
}) {
  const db = getDb()
  const { documentId, user } = options

  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, user.id), isNull(documents.deletedAt)),
    columns: {
      id: true,
      userId: true,
      caseId: true,
      kind: true,
      originalName: true,
      status: true
    }
  })

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  const checkType = documentKindToCheckType[document.kind as keyof typeof documentKindToCheckType]

  if (!checkType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This document type does not support check creation yet'
    })
  }

  const existingLinkedCheck = await db
    .select({
      id: checks.id
    })
    .from(checkDocuments)
    .innerJoin(checks, eq(checkDocuments.checkId, checks.id))
    .where(
      and(
        eq(checkDocuments.documentId, document.id),
        eq(checkDocuments.role, 'primary'),
        eq(checks.type, checkType),
        eq(checks.userId, user.id)
      )
    )
    .orderBy(desc(checks.createdAt))
    .limit(1)

  if (existingLinkedCheck[0]) {
    return {
      caseId: document.caseId,
      checkId: existingLinkedCheck[0].id,
      reused: true
    }
  }

  let caseId = document.caseId

  if (!caseId) {
    const caseInsert = await db.insert(cases).values({
      userId: user.id,
      type: checkTypeToCaseType[checkType],
      title: buildCaseTitle(document.originalName, checkType),
      status: 'draft',
      locale: user.locale
    })

    caseId = Number(caseInsert[0].insertId)

    await db
      .update(documents)
      .set({
        caseId
      })
      .where(eq(documents.id, document.id))
  }

  await db
    .update(documents)
    .set({
      status: 'processing'
    })
    .where(eq(documents.id, document.id))

  const checkInsert = await db.insert(checks).values({
    userId: user.id,
    caseId,
    type: checkType,
    status: 'extracting',
    startedAt: new Date()
  })

  const checkId = Number(checkInsert[0].insertId)

  await db.insert(checkDocuments).values({
    checkId,
    documentId: document.id,
    role: 'primary'
  })

  try {
    const extraction = await saveDocumentExtraction(document.id)

    await db
      .update(checks)
      .set({
        status: 'analyzing'
      })
      .where(eq(checks.id, checkId))

    const evaluated = evaluateRulesForCheck({
      checkType,
      rawText: extraction.rawText,
      normalizedText: extraction.normalizedText
    })

    if (evaluated.findings.length) {
      await db.insert(ruleFindings).values(
        evaluated.findings.map(finding => ({
          checkId,
          ruleCode: finding.ruleCode,
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
          matchedValue: finding.matchedValue || null,
          metadataJson: finding.metadataJson || null
        }))
      )
    }

    await db
      .update(documents)
      .set({
        status: 'ready'
      })
      .where(eq(documents.id, document.id))

    await db
      .update(checks)
      .set({
        status: 'ready',
        summaryText: evaluated.summaryText,
        structuredInputJson: extraction.structuredDataJson ?? null,
        ruleResultJson: evaluated.ruleResultJson,
        riskScore: evaluated.riskScore,
        finishedAt: new Date()
      })
      .where(eq(checks.id, checkId))

    await db
      .update(cases)
      .set({
        status: 'ready'
      })
      .where(eq(cases.id, caseId))

    return {
      caseId,
      checkId,
      reused: false
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction failed'

    await db
      .update(documents)
      .set({
        status: 'failed'
      })
      .where(eq(documents.id, document.id))

    await db
      .update(checks)
      .set({
        status: 'failed',
        errorMessage: message,
        finishedAt: new Date()
      })
      .where(eq(checks.id, checkId))

    await db
      .update(cases)
      .set({
        status: 'failed'
      })
      .where(eq(cases.id, caseId))

    throw error
  }
}
