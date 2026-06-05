import { createHash, randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { documentUploadFieldsSchema } from '../../../shared/schemas/documents'
import { getDb } from '../../db/client'
import { auditLogs, cases, documents } from '../../db/schema'
import type { AuthUser } from '../auth/types'
import { resolveStorageRoot } from './storage'

type UploadFields = z.infer<typeof documentUploadFieldsSchema>

type UploadFileInput = {
  data: Buffer
  filename: string
  type?: string
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
])

const extensionMimeMap: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp']
}

function sanitizeFilename(filename: string) {
  const baseName = path.basename(filename)

  return baseName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function validateUploadFile(file: UploadFileInput) {
  if (!file.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required'
    })
  }

  if (!Buffer.isBuffer(file.data) || file.data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File is required'
    })
  }

  if (file.data.length > MAX_UPLOAD_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File exceeds 20 MB limit'
    })
  }

  const extension = path.extname(file.filename).toLowerCase()
  const mimeType = file.type?.toLowerCase() || ''

  if (!extensionMimeMap[extension]) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported file extension'
    })
  }

  if (!allowedMimeTypes.has(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported file type'
    })
  }

  if (!extensionMimeMap[extension].includes(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File extension does not match file type'
    })
  }

  return {
    extension,
    mimeType
  }
}

async function assertCaseOwnership(userId: number, caseId?: number) {
  if (!caseId) {
    return null
  }

  const db = getDb()

  const caseRecord = await db.query.cases.findFirst({
    where: and(eq(cases.id, caseId), eq(cases.userId, userId)),
    columns: {
      id: true
    }
  })

  if (!caseRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Case not found'
    })
  }

  return caseRecord
}

export async function createUploadedDocument(options: {
  user: AuthUser
  fields: UploadFields
  file: UploadFileInput
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const db = getDb()
  const config = useRuntimeConfig()
  const { user, fields, file, ipAddress, userAgent } = options
  const { extension, mimeType } = validateUploadFile(file)

  await assertCaseOwnership(user.id, fields.caseId)

  const originalName = sanitizeFilename(file.filename)
  const sha256 = createHash('sha256').update(file.data).digest('hex')
  const now = new Date()
  const folder = path.join(
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0')
  )
  const fileName = `${randomUUID()}${extension}`
  const relativeStoragePath = path.posix.join(folder.replace(/\\/g, '/'), fileName)

  const storageRoot = resolveStorageRoot(config.storageUploadsDir)
  const targetDirectory = path.join(storageRoot, folder)
  const absoluteStoragePath = path.join(targetDirectory, fileName)

  await mkdir(targetDirectory, { recursive: true })
  await writeFile(absoluteStoragePath, file.data)

  const insertResult = await db.insert(documents).values({
    userId: user.id,
    caseId: fields.caseId,
    kind: fields.kind,
    originalName,
    storagePath: relativeStoragePath,
    mimeType,
    fileSize: file.data.length,
    sha256,
    uploadedBy: user.id,
    status: 'uploaded'
  })

  const documentId = Number(insertResult[0].insertId)

  await db.insert(auditLogs).values({
    userId: user.id,
    actorType: user.role === 'admin' ? 'admin' : 'user',
    action: 'document.uploaded',
    entityType: 'document',
    entityId: documentId,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    metadataJson: {
      kind: fields.kind,
      originalName,
      mimeType,
      fileSize: file.data.length,
      caseId: fields.caseId || null
    }
  })

  const createdDocument = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
    columns: {
      id: true,
      userId: true,
      caseId: true,
      kind: true,
      originalName: true,
      storagePath: true,
      mimeType: true,
      fileSize: true,
      sha256: true,
      status: true,
      createdAt: true
    }
  })

  if (!createdDocument) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create document record'
    })
  }

  return createdDocument
}
