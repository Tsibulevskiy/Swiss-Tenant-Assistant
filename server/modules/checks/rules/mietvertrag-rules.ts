import type { RuleDefinition } from './runtime'
import { buildFinding } from './runtime'

function getMietvertragExtraction(context: Parameters<RuleDefinition['evaluate']>[0]) {
  const structured = context.structuredExtraction

  if (!structured || structured.documentKind !== 'mietvertrag') {
    return null
  }

  return structured
}

function hasClauseRiskKeywords(text: string) {
  return /(haftet fur alle schaden|haftet fuer alle schaden|verzicht auf|ohne widerspruch|pauschal haftung|generell ausgeschlossen)/.test(text)
}

export const mietvertragRules: RuleDefinition[] = [
  {
    code: 'mietvertrag.deposit_above_three_months',
    weight: 5,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      const structured = getMietvertragExtraction(context)

      if (!structured) {
        return []
      }

      const depositAmount = structured.extracted.depositAmountChf
      const monthlyRent = structured.extracted.monthlyRentChf
      const monthsEquivalent = structured.extracted.depositMonthsEquivalent

      if (depositAmount === null || monthlyRent === null || depositAmount <= monthlyRent * 3) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.deposit_above_three_months',
          severity: 'high',
          title: 'Deposit appears higher than three monthly rents',
          description: 'Swiss rental deposits are usually capped at three months of net rent.',
          explanation: 'The extracted deposit exceeds three times the extracted monthly rent and should be reviewed before signing.',
          matchedValue: depositAmount.toFixed(2),
          metadataJson: {
            depositAmount,
            monthlyRent,
            depositMonthsEquivalent: monthsEquivalent
          }
        })
      ]
    }
  },
  {
    code: 'mietvertrag.nebenkosten_clarity_missing',
    weight: 2,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      const structured = getMietvertragExtraction(context)

      if (!structured) {
        return []
      }

      const mentionsNebenkosten = /(nebenkosten|akonto|heizkosten|betriebskosten)/.test(context.searchableText)
      const hasClarity =
        structured.extracted.additionalCostsChf !== null
        || structured.extracted.grossMonthlyRentChf !== null

      if (!mentionsNebenkosten || hasClarity) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.nebenkosten_clarity_missing',
          severity: 'warning',
          title: 'Additional costs are mentioned but not clearly quantified',
          description: 'The contract appears to mention Nebenkosten or related costs without a clear amount.',
          explanation: 'The extracted text references additional costs, but the structured extraction could not determine a clear charge value.',
          matchedValue: null,
          metadataJson: {
            additionalCostsChf: structured.extracted.additionalCostsChf,
            grossMonthlyRentChf: structured.extracted.grossMonthlyRentChf
          }
        })
      ]
    }
  },
  {
    code: 'mietvertrag.notice_period_longer_than_three_months',
    weight: 3,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      const structured = getMietvertragExtraction(context)
      const noticePeriodMonths = structured?.extracted.noticePeriodMonths ?? null

      if (noticePeriodMonths === null || noticePeriodMonths <= 3) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.notice_period_longer_than_three_months',
          severity: 'warning',
          title: 'Notice period appears longer than three months',
          description: 'The detected notice period is longer than the common three-month standard.',
          explanation: 'The structured extraction found a notice period longer than three months, which should be checked carefully.',
          matchedValue: `${noticePeriodMonths} months`,
          metadataJson: {
            noticePeriodMonths
          }
        })
      ]
    }
  },
  {
    code: 'mietvertrag.notice_period_missing',
    weight: 2,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      const structured = getMietvertragExtraction(context)

      if (!structured || structured.extracted.noticePeriodMonths !== null) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.notice_period_missing',
          severity: 'warning',
          title: 'Notice period could not be determined',
          description: 'The contract should state or imply a clear notice period.',
          explanation: 'The structured extraction could not determine the notice period, so termination conditions should be reviewed manually.',
          matchedValue: null,
          metadataJson: null
        })
      ]
    }
  },
  {
    code: 'mietvertrag.fixed_term_without_end_date',
    weight: 5,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      const structured = getMietvertragExtraction(context)

      if (!structured || structured.extracted.fixedTerm !== true || structured.extracted.leaseEndDate !== null) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.fixed_term_without_end_date',
          severity: 'high',
          title: 'Fixed-term lease appears to miss an end date',
          description: 'A fixed-term lease should clearly specify when the contract ends.',
          explanation: 'The structured extraction indicates a fixed-term lease, but no lease end date could be identified.',
          matchedValue: null,
          metadataJson: {
            fixedTerm: structured.extracted.fixedTerm,
            leaseEndDate: structured.extracted.leaseEndDate
          }
        })
      ]
    }
  },
  {
    code: 'mietvertrag.minimum_term_long',
    weight: 3,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      const structured = getMietvertragExtraction(context)
      const minimumTermMonths = structured?.extracted.minimumTermMonths ?? null

      if (minimumTermMonths === null || minimumTermMonths <= 12) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.minimum_term_long',
          severity: minimumTermMonths > 24 ? 'high' : 'warning',
          title: 'Minimum lease term appears long',
          description: 'A long minimum lease term can materially limit tenant flexibility.',
          explanation: 'The structured extraction found a minimum lease term longer than one year, which should be reviewed for practical impact.',
          matchedValue: `${minimumTermMonths} months`,
          metadataJson: {
            minimumTermMonths
          }
        })
      ]
    }
  },
  {
    code: 'mietvertrag.professional_cleaning_clause',
    weight: 2,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      const structured = getMietvertragExtraction(context)
      const hasClause =
        structured &&
        (structured.extracted.professionalCleaningClause === true || structured.extracted.repaintingClause === true)

      if (!hasClause && !/(endreinigung|fachmannisch|fachmaennisch|frisch gestrichen|neu gestrichen|vollstandig gestrichen|professionell gereinigt)/.test(context.searchableText)) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.professional_cleaning_clause',
          severity: 'warning',
          title: 'Potential mandatory cleaning or renovation clause',
          description: 'Clauses that require professional final cleaning or fixed repainting obligations can be problematic.',
          explanation: 'The extracted contract text indicates a cleaning or repainting obligation that merits manual review.',
          matchedValue: structured
            ? structured.extracted.professionalCleaningClause
              ? 'professionalCleaningClause'
              : structured.extracted.repaintingClause
                ? 'repaintingClause'
                : null
            : null,
          metadataJson: structured
            ? {
                professionalCleaningClause: structured.extracted.professionalCleaningClause,
                repaintingClause: structured.extracted.repaintingClause
              }
            : null
        })
      ]
    }
  },
  {
    code: 'mietvertrag.clause_risk_keywords_detected',
    weight: 3,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      if (!hasClauseRiskKeywords(context.searchableText)) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.clause_risk_keywords_detected',
          severity: 'warning',
          title: 'Potentially risky contract wording detected',
          description: 'The contract contains wording that can indicate unusually broad tenant obligations or waivers.',
          explanation: 'The extracted text contains clause-risk keywords that should be reviewed carefully in context.',
          matchedValue: null,
          metadataJson: null
        })
      ]
    }
  },
  {
    code: 'mietvertrag.financial_terms_incomplete',
    weight: 2,
    appliesTo: context => context.checkType === 'mietvertrag_check',
    evaluate: context => {
      const structured = getMietvertragExtraction(context)

      if (!structured) {
        return []
      }

      const hasRent = structured.extracted.monthlyRentChf !== null
      const hasDeposit = structured.extracted.depositAmountChf !== null

      if (hasRent && hasDeposit) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'mietvertrag.financial_terms_incomplete',
          severity: 'warning',
          title: 'Key financial terms are incomplete',
          description: 'The contract does not yield a complete set of core financial terms from extraction.',
          explanation: 'The structured extraction could not determine both the monthly rent and deposit clearly, so the financial section should be reviewed manually.',
          matchedValue: null,
          metadataJson: {
            monthlyRentChf: structured.extracted.monthlyRentChf,
            depositAmountChf: structured.extracted.depositAmountChf,
            additionalCostsChf: structured.extracted.additionalCostsChf
          }
        })
      ]
    }
  }
]
