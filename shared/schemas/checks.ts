import { z } from 'zod'

export const createCheckFromDocumentSchema = z.object({
  documentId: z.coerce.number().int().positive()
})

export const rerunCheckAnalysisSchema = z.object({
  retryMode: z.enum(['reuse_extraction', 'force_reextract']).optional().default('reuse_extraction')
})

export const ruleSeveritySchema = z.enum(['info', 'warning', 'high'])

export const ruleFindingSchema = z.object({
  ruleCode: z.string().trim().min(1).max(100),
  severity: ruleSeveritySchema,
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  matchedValue: z.string().trim().min(1).nullable().optional(),
  metadataJson: z.record(z.string(), z.unknown()).nullable().optional()
})

export const weightedRuleFindingSchema = z.object({
  ruleCode: z.string().trim().min(1).max(100),
  severity: ruleSeveritySchema,
  ruleWeight: z.number().finite().nonnegative(),
  severityMultiplier: z.number().finite().nonnegative(),
  score: z.number().finite().nonnegative()
})

export const persistedRuleFindingMetadataSchema = z.object({
  schema: z.literal('rule_finding.v1'),
  explanation: z.string().trim().min(1),
  scoring: weightedRuleFindingSchema.nullable(),
  details: z.record(z.string(), z.unknown()).nullable()
})

export const ruleResultSchema = z.object({
  evaluatedAt: z.string().trim().min(1),
  findingsCount: z.number().int().nonnegative(),
  riskScore: z.enum(['low', 'medium', 'high']),
  riskScoreTotal: z.number().finite().nonnegative(),
  riskScoreModel: z.object({
    thresholds: z.object({
      low: z.string(),
      medium: z.string(),
      high: z.string()
    })
  }),
  weightedFindings: z.array(weightedRuleFindingSchema),
  rulesTriggered: z.array(z.string()),
  ruleDefinitionsEvaluated: z.array(z.object({
    code: z.string(),
    weight: z.number().finite().nonnegative()
  }))
})

export const ruleEvaluationInputSchema = z.object({
  checkType: z.string().trim().min(1),
  rawText: z.string().nullable(),
  normalizedText: z.string().nullable(),
  structuredDataJson: z.unknown().nullable().optional()
})

export type RuleSeverity = z.infer<typeof ruleSeveritySchema>
export type RuleFinding = z.infer<typeof ruleFindingSchema>
export type RuleEvaluationInput = z.infer<typeof ruleEvaluationInputSchema>
export type WeightedRuleFinding = z.infer<typeof weightedRuleFindingSchema>
export type PersistedRuleFindingMetadata = z.infer<typeof persistedRuleFindingMetadataSchema>
export type RuleResult = z.infer<typeof ruleResultSchema>
export type RerunCheckAnalysisInput = z.infer<typeof rerunCheckAnalysisSchema>
