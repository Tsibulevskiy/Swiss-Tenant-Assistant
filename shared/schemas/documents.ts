import { z } from 'zod'

import { documentKindValues } from '../../server/db/schema/enums'

export const documentUploadFieldsSchema = z.object({
  kind: z.enum(documentKindValues),
  caseId: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .optional()
    .transform(value => (value ? Number(value) : undefined))
})

export const documentSignedLinkRequestSchema = z.object({
  expiresInMinutes: z.coerce.number().int().min(1).optional()
})

export const normalizationMetadataSchema = z.object({
  originalLength: z.number().int().nonnegative(),
  normalizedLength: z.number().int().nonnegative(),
  replacements: z.object({
    ocrNoiseFixes: z.number().int().nonnegative(),
    currencyNormalizations: z.number().int().nonnegative(),
    amountNormalizations: z.number().int().nonnegative(),
    dateNormalizations: z.number().int().nonnegative(),
    whitespaceCollapses: z.number().int().nonnegative()
  }),
  detected: z.object({
    dates: z.array(z.string()),
    amounts: z.array(z.string()),
    currencies: z.array(z.string())
  })
})

const nullableStringSchema = z.string().trim().min(1).nullable()
const nullableNumberSchema = z.number().finite().nullable()

export const mietvertragStructuredExtractionSchema = z.object({
  schema: z.literal('mietvertrag.v1'),
  documentKind: z.literal('mietvertrag'),
  extractor: z.object({
    status: z.enum(['initialized', 'partial', 'complete']),
    sourceEngine: z.enum(['pdf_text', 'ocr', 'manual']),
    normalizedTextLength: z.number().int().nonnegative()
  }),
  normalization: normalizationMetadataSchema,
  candidates: z.object({
    dates: z.array(z.string()),
    amounts: z.array(z.object({
      raw: z.string(),
      currency: z.literal('CHF'),
      value: z.number().finite()
    })),
    currencies: z.array(z.string())
  }),
  extracted: z.object({
    tenantNames: z.array(z.string()),
    landlordNames: z.array(z.string()),
    propertyAddress: nullableStringSchema,
    postalCode: nullableStringSchema,
    city: nullableStringSchema,
    canton: nullableStringSchema,
    roomCount: nullableNumberSchema,
    leaseStartDate: nullableStringSchema,
    leaseEndDate: nullableStringSchema,
    fixedTerm: z.boolean().nullable(),
    minimumTermMonths: nullableNumberSchema,
    noticePeriodMonths: nullableNumberSchema,
    monthlyRentChf: nullableNumberSchema,
    additionalCostsChf: nullableNumberSchema,
    grossMonthlyRentChf: nullableNumberSchema,
    depositAmountChf: nullableNumberSchema,
    depositMonthsEquivalent: nullableNumberSchema,
    professionalCleaningClause: z.boolean().nullable(),
    repaintingClause: z.boolean().nullable()
  }),
  completeness: z.object({
    hasPartyNames: z.boolean(),
    hasLeaseDates: z.boolean(),
    hasFinancialTerms: z.boolean()
  })
})

export const nebenkostenLineItemSchema = z.object({
  label: z.string().trim().min(1),
  amountChf: nullableNumberSchema,
  category: z.enum([
    'heating',
    'water',
    'waste',
    'caretaker',
    'administration',
    'reserve_fund',
    'tax',
    'other'
  ]),
  suspicious: z.boolean()
})

export const nebenkostenStructuredExtractionSchema = z.object({
  schema: z.literal('nebenkostenabrechnung.v1'),
  documentKind: z.literal('nebenkostenabrechnung'),
  extractor: z.object({
    status: z.enum(['initialized', 'partial', 'complete']),
    sourceEngine: z.enum(['pdf_text', 'ocr', 'manual']),
    normalizedTextLength: z.number().int().nonnegative()
  }),
  normalization: normalizationMetadataSchema,
  candidates: z.object({
    dates: z.array(z.string()),
    amounts: z.array(z.object({
      raw: z.string(),
      currency: z.literal('CHF'),
      value: z.number().finite()
    })),
    currencies: z.array(z.string())
  }),
  extracted: z.object({
    propertyAddress: nullableStringSchema,
    billingPeriodStart: nullableStringSchema,
    billingPeriodEnd: nullableStringSchema,
    issueDate: nullableStringSchema,
    dueDate: nullableStringSchema,
    tenantSharePercent: nullableNumberSchema,
    advancePaymentsChf: nullableNumberSchema,
    totalChargesChf: nullableNumberSchema,
    balanceChf: nullableNumberSchema,
    balanceDirection: z.enum(['credit', 'debit']).nullable(),
    heatingCostsChf: nullableNumberSchema,
    waterCostsChf: nullableNumberSchema,
    administrationCostsChf: nullableNumberSchema,
    reserveFundChf: nullableNumberSchema,
    lineItems: z.array(nebenkostenLineItemSchema)
  }),
  completeness: z.object({
    hasBillingPeriod: z.boolean(),
    hasTotals: z.boolean(),
    hasLineItems: z.boolean()
  })
})

export const anyStructuredExtractionSchema = z.union([
  mietvertragStructuredExtractionSchema,
  nebenkostenStructuredExtractionSchema
])

export type MietvertragStructuredExtraction = z.infer<typeof mietvertragStructuredExtractionSchema>
export type NebenkostenStructuredExtraction = z.infer<typeof nebenkostenStructuredExtractionSchema>
export type AnyStructuredExtraction = z.infer<typeof anyStructuredExtractionSchema>
