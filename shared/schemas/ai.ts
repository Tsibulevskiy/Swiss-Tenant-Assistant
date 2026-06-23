import { z } from 'zod'

export const aiSummaryOutputSchema = z.object({
  summaryText: z.string().trim().min(1),
  disclaimerText: z.string().trim().min(1)
})

export const aiRecommendationLevelSchema = z.enum(['positive', 'info', 'warning', 'attention'])

export const aiRecommendationOutputSchema = z.object({
  level: aiRecommendationLevelSchema,
  title: z.string().trim().min(1),
  body: z.string().trim().min(1)
})

export const aiLetterOutputVariableSchema = z.object({
  key: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1)
})

export const aiLetterGenerationOutputSchema = z.object({
  subject: z.string().trim().min(1).max(255),
  bodyText: z.string().trim().min(1),
  variables: z.array(aiLetterOutputVariableSchema).max(20)
})

export type AiSummaryOutput = z.infer<typeof aiSummaryOutputSchema>
export type AiRecommendationOutput = z.infer<typeof aiRecommendationOutputSchema>
export type AiLetterGenerationOutput = z.infer<typeof aiLetterGenerationOutputSchema>
