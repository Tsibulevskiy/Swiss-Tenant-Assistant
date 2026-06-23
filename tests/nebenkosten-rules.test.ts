import test from 'node:test'
import assert from 'node:assert/strict'

import { evaluateRulesForCheck } from '../server/modules/checks/evaluate-rules'

function buildNebenkostenStructuredExtraction(overrides?: Partial<{
  billingPeriodStart: string | null
  billingPeriodEnd: string | null
  advancePaymentsChf: number | null
  totalChargesChf: number | null
  balanceChf: number | null
  balanceDirection: 'credit' | 'debit' | null
  administrationCostsChf: number | null
  reserveFundChf: number | null
  lineItems: Array<{
    label: string
    amountChf: number | null
    category: 'heating' | 'water' | 'waste' | 'caretaker' | 'administration' | 'reserve_fund' | 'tax' | 'other'
    suspicious: boolean
  }>
}>) {
  return {
    schema: 'nebenkostenabrechnung.v1',
    documentKind: 'nebenkostenabrechnung',
    extractor: {
      status: 'complete',
      sourceEngine: 'pdf_text',
      normalizedTextLength: 500
    },
    normalization: {
      originalLength: 500,
      normalizedLength: 500,
      replacements: {
        ocrNoiseFixes: 0,
        currencyNormalizations: 0,
        amountNormalizations: 0,
        dateNormalizations: 0,
        whitespaceCollapses: 0
      },
      detected: {
        dates: ['2025-01-01', '2025-12-31', '2026-01-31'],
        amounts: ['CHF 2400.00', 'CHF 1800.00', 'CHF 600.00'],
        currencies: ['CHF']
      }
    },
    candidates: {
      dates: ['2025-01-01', '2025-12-31', '2026-01-31'],
      amounts: [
        { raw: 'CHF 2400.00', currency: 'CHF', value: 2400 },
        { raw: 'CHF 1800.00', currency: 'CHF', value: 1800 },
        { raw: 'CHF 600.00', currency: 'CHF', value: 600 }
      ],
      currencies: ['CHF']
    },
    extracted: {
      propertyAddress: 'Musterstrasse 10, 8000 Zurich',
      billingPeriodStart: '2025-01-01',
      billingPeriodEnd: '2025-12-31',
      issueDate: '2026-01-15',
      dueDate: '2026-01-31',
      tenantSharePercent: 100,
      advancePaymentsChf: 1800,
      totalChargesChf: 2400,
      balanceChf: 600,
      balanceDirection: 'debit',
      heatingCostsChf: 1200,
      waterCostsChf: 250,
      administrationCostsChf: 250,
      reserveFundChf: 0,
      lineItems: [
        {
          label: 'Verwaltungskosten',
          amountChf: 250,
          category: 'administration',
          suspicious: true
        }
      ]
    },
    completeness: {
      hasBillingPeriod: true,
      hasTotals: true,
      hasLineItems: true
    },
    ...(
      overrides
        ? {
          extracted: {
            propertyAddress: 'Musterstrasse 10, 8000 Zurich',
            billingPeriodStart: '2025-01-01',
            billingPeriodEnd: '2025-12-31',
            issueDate: '2026-01-15',
            dueDate: '2026-01-31',
            tenantSharePercent: 100,
            advancePaymentsChf: 1800,
            totalChargesChf: 2400,
            balanceChf: 600,
            balanceDirection: 'debit',
            heatingCostsChf: 1200,
            waterCostsChf: 250,
            administrationCostsChf: 250,
            reserveFundChf: 0,
            lineItems: [
              {
                label: 'Verwaltungskosten',
                amountChf: 250,
                category: 'administration' as const,
                suspicious: true
              }
            ],
            ...overrides
          }
        }
        : {}
    )
  }
}

function buildMietvertragStructuredExtraction(contractTextMentionsAdmin: boolean) {
  return {
    schema: 'mietvertrag.v1',
    documentKind: 'mietvertrag',
    extractor: {
      status: 'partial',
      sourceEngine: 'pdf_text',
      normalizedTextLength: 200
    },
    normalization: {
      originalLength: 200,
      normalizedLength: 200,
      replacements: {
        ocrNoiseFixes: 0,
        currencyNormalizations: 0,
        amountNormalizations: 0,
        dateNormalizations: 0,
        whitespaceCollapses: 0
      },
      detected: {
        dates: ['2024-01-01'],
        amounts: ['CHF 1800.00'],
        currencies: ['CHF']
      }
    },
    candidates: {
      dates: ['2024-01-01'],
      amounts: [
        { raw: 'CHF 1800.00', currency: 'CHF', value: 1800 }
      ],
      currencies: ['CHF']
    },
    extracted: {
      tenantNames: [],
      landlordNames: [],
      propertyAddress: null,
      postalCode: null,
      city: null,
      canton: null,
      roomCount: null,
      leaseStartDate: '2024-01-01',
      leaseEndDate: null,
      fixedTerm: false,
      minimumTermMonths: null,
      noticePeriodMonths: 3,
      monthlyRentChf: 1500,
      additionalCostsChf: 300,
      grossMonthlyRentChf: 1800,
      depositAmountChf: 3000,
      depositMonthsEquivalent: 2,
      professionalCleaningClause: null,
      repaintingClause: null
    },
    completeness: {
      hasPartyNames: false,
      hasLeaseDates: true,
      hasFinancialTerms: true
    },
    _normalizedText: contractTextMentionsAdmin
      ? 'nebenkosten inklusive verwaltungskosten gemaess mietvertrag'
      : 'nebenkosten akonto heizkosten wasser'
  }
}

function buildRuleInput(input: {
  primary: ReturnType<typeof buildNebenkostenStructuredExtraction>
  contractReference?: ReturnType<typeof buildMietvertragStructuredExtraction>
  previousYearReference?: ReturnType<typeof buildNebenkostenStructuredExtraction>
}) {
  return {
    checkType: 'nebenkosten_check',
    rawText: 'Nebenkostenabrechnung Muster',
    normalizedText: 'Nebenkostenabrechnung Muster Verwaltungskosten Nachzahlung',
    structuredDataJson: {
      structuredExtraction: input.primary,
      referenceDocuments: [
        ...(input.contractReference
          ? [{
            role: 'contract_reference',
            normalizedText: input.contractReference._normalizedText,
            structuredExtraction: {
              ...input.contractReference,
              _normalizedText: undefined
            }
          }]
          : []),
        ...(input.previousYearReference
          ? [{
            role: 'previous_year_reference',
            normalizedText: 'Nebenkostenabrechnung Vorjahr',
            structuredExtraction: input.previousYearReference
          }]
          : [])
      ]
    }
  }
}

test('flags contract mismatch when admin charges are not clearly covered by contract reference', () => {
  const result = evaluateRulesForCheck(buildRuleInput({
    primary: buildNebenkostenStructuredExtraction(),
    contractReference: buildMietvertragStructuredExtraction(false)
  }))

  assert.ok(result.findings.some(finding => finding.ruleCode === 'nebenkosten.contract_mismatch_detected'))
})

test('flags significant total increase compared with previous-year reference', () => {
  const result = evaluateRulesForCheck(buildRuleInput({
    primary: buildNebenkostenStructuredExtraction({
      totalChargesChf: 2400,
      advancePaymentsChf: 1800,
      balanceChf: 600
    }),
    previousYearReference: buildNebenkostenStructuredExtraction({
      totalChargesChf: 1500,
      advancePaymentsChf: 1400,
      balanceChf: 100
    })
  }))

  assert.ok(result.findings.some(finding => finding.ruleCode === 'nebenkosten.previous_year_increase_detected'))
})

test('sample-like nebenkosten input keeps existing anomaly and keyword detection active', () => {
  const result = evaluateRulesForCheck({
    checkType: 'nebenkosten_check',
    rawText: 'Pauschalbetrag Verwaltungskosten Nachzahlung',
    normalizedText: 'Pauschalbetrag Verwaltungskosten Nachzahlung CHF 1500.00',
    structuredDataJson: {
      structuredExtraction: buildNebenkostenStructuredExtraction({
        balanceChf: 1500,
        balanceDirection: 'debit',
        administrationCostsChf: 350,
        totalChargesChf: 2800,
        advancePaymentsChf: 1300
      })
    }
  })

  assert.ok(result.findings.some(finding => finding.ruleCode === 'nebenkosten.suspicious_keywords_detected'))
  assert.ok(result.findings.some(finding => finding.ruleCode === 'nebenkosten.large_additional_payment'))
})
