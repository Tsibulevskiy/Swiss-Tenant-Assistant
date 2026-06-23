import { purgeExpiredDocuments } from '../modules/documents/retention'

const RETENTION_SWEEP_LOCK_KEY = 'document-retention:last-sweep'

export default defineEventHandler(async event => {
  if (!event.path.startsWith('/api/')) {
    return
  }

  const config = useRuntimeConfig()
  const sweepIntervalMinutes = Number.isInteger(config.documentRetentionSweepIntervalMinutes) && config.documentRetentionSweepIntervalMinutes > 0
    ? config.documentRetentionSweepIntervalMinutes
    : 60
  const now = Date.now()
  const storage = useStorage<number>('cache')
  const lastSweep = await storage.getItem(RETENTION_SWEEP_LOCK_KEY)

  if (typeof lastSweep === 'number' && now - lastSweep < sweepIntervalMinutes * 60 * 1000) {
    return
  }

  await storage.setItem(RETENTION_SWEEP_LOCK_KEY, now)

  try {
    await purgeExpiredDocuments()
  } catch (error) {
    console.error('Document retention sweep failed', error)
  }
})
