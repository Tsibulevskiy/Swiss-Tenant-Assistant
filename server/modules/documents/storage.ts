import path from 'node:path'

export function resolveStorageRoot(storageDir: string) {
  return path.isAbsolute(storageDir)
    ? storageDir
    : path.resolve(process.cwd(), storageDir)
}

export function getDocumentStorageDir(kind: string) {
  const config = useRuntimeConfig()

  if (kind === 'generated_letter_pdf' || kind === 'generated_report_pdf') {
    return config.storageReportsDir
  }

  return config.storageUploadsDir
}

export function resolveStoredDocumentPath(storageRoot: string, storagePath: string) {
  const normalizedStoragePath = storagePath.replace(/\//g, path.sep)

  return path.join(resolveStorageRoot(storageRoot), normalizedStoragePath)
}
