import type { NebenkostenStructuredExtraction } from '../../../../shared/schemas/documents'

import type { RuleDefinition } from './runtime'
import { buildFinding } from './runtime'

function getNebenkostenExtraction(context: Parameters<RuleDefinition['evaluate']>[0]) {
  const structured = context.structuredExtraction

  if (!structured || structured.documentKind !== 'nebenkostenabrechnung') {
    return null
  }

  return structured
}

function getAdminLineItems(structured: NebenkostenStructuredExtraction) {
  return structured.extracted.lineItems.filter(item => item.category === 'administration')
}

function getReserveLineItems(structured: NebenkostenStructuredExtraction) {
  return structured.extracted.lineItems.filter(item => item.category === 'reserve_fund')
}

function hasSuspiciousKeywords(text: string) {
  return /(pauschal|pauschalbetrag|schatzung|schaetzung|ohne belege|ohne beleg|allgemeinkosten|diverses|sonstiges)/.test(text)
}

function calculateBalanceMismatch(structured: NebenkostenStructuredExtraction) {
  const totalCharges = structured.extracted.totalChargesChf
  const advancePayments = structured.extracted.advancePaymentsChf
  const balance = structured.extracted.balanceChf
  const direction = structured.extracted.balanceDirection

  if (
    totalCharges === null
    || advancePayments === null
    || balance === null
    || direction === null
  ) {
    return null
  }

  const expectedBalance = direction === 'debit'
    ? totalCharges - advancePayments
    : advancePayments - totalCharges
  const difference = Number(Math.abs(expectedBalance - balance).toFixed(2))

  return {
    expectedBalance: Number(expectedBalance.toFixed(2)),
    difference
  }
}

function hasContractCoverageForCharge(searchableText: string, chargeType: 'administration' | 'reserve_fund') {
  if (chargeType === 'administration') {
    return /(verwaltung|administration|bearbeitung|mahngebuhr|nebenkosten|betriebskosten|heizkosten|akonto)/.test(searchableText)
  }

  return /(reservefonds|ruckstellung|rueckstellung|erneuerungsfonds)/.test(searchableText)
}

function getPreviousYearNebenkostenExtraction(context: Parameters<RuleDefinition['evaluate']>[0]) {
  const structured = context.previousYearReference?.structuredExtraction

  if (!structured || structured.documentKind !== 'nebenkostenabrechnung') {
    return null
  }

  return structured
}

export const nebenkostenRules: RuleDefinition[] = [
  {
    code: 'nebenkosten.billing_period_missing',
    weight: 3,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)

      if (
        !structured
        || (structured.extracted.billingPeriodStart !== null && structured.extracted.billingPeriodEnd !== null)
      ) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.billing_period_missing',
          severity: 'warning',
          title: 'Billing period is incomplete or missing',
          description: 'The statement should clearly define the billing period.',
          explanation: 'The structured extraction could not determine both the billing period start and end dates, which makes the statement harder to verify.',
          matchedValue: null,
          metadataJson: {
            billingPeriodStart: structured.extracted.billingPeriodStart,
            billingPeriodEnd: structured.extracted.billingPeriodEnd
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.line_items_missing',
    weight: 4,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)

      if (!structured || structured.extracted.lineItems.length > 0) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.line_items_missing',
          severity: 'warning',
          title: 'Service charge statement lacks line item breakdown',
          description: 'A service charge statement should contain enough detail to review the billed positions.',
          explanation: 'The extracted statement contains totals but no usable itemized breakdown, which limits auditability.',
          matchedValue: null,
          metadataJson: {
            totalChargesChf: structured.extracted.totalChargesChf
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.advance_payments_missing',
    weight: 3,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)

      if (!structured || structured.extracted.advancePaymentsChf !== null) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.advance_payments_missing',
          severity: 'warning',
          title: 'Advance payments are missing from the statement',
          description: 'The statement should usually show the tenant advance payments used for the final balance.',
          explanation: 'The structured extraction did not find any clear advance payment amount, so the final balance is harder to validate.',
          matchedValue: null,
          metadataJson: {
            balanceChf: structured.extracted.balanceChf,
            totalChargesChf: structured.extracted.totalChargesChf
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.admin_fee_detected',
    weight: 2,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)
      const adminLineItems = structured ? getAdminLineItems(structured) : []

      if (!adminLineItems.length && !/(verwaltungskosten|administrationskosten|bearbeitungsgebuhr|mahngebuhr)/.test(context.searchableText)) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.admin_fee_detected',
          severity: 'warning',
          title: 'Administrative fee detected in service charges',
          description: 'Administrative or handling fees in a service charge statement can require closer review.',
          explanation: 'The extracted line items or text contain an administrative fee indicator that should be checked against the lease.',
          matchedValue: adminLineItems[0]?.label || null,
          metadataJson: {
            lineItems: adminLineItems
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.high_admin_cost_ratio',
    weight: 3,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)

      if (
        !structured
        || structured.extracted.administrationCostsChf === null
        || structured.extracted.totalChargesChf === null
        || structured.extracted.totalChargesChf <= 0
      ) {
        return []
      }

      const ratio = structured.extracted.administrationCostsChf / structured.extracted.totalChargesChf

      if (ratio < 0.1 && structured.extracted.administrationCostsChf < 200) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.high_admin_cost_ratio',
          severity: 'warning',
          title: 'Administrative costs appear unusually high',
          description: 'Administrative costs form a large share of the total service charges.',
          explanation: 'The extracted administration-related costs are high relative to the total charges and should be reviewed against the contract and receipts.',
          matchedValue: structured.extracted.administrationCostsChf.toFixed(2),
          metadataJson: {
            administrationCostsChf: structured.extracted.administrationCostsChf,
            totalChargesChf: structured.extracted.totalChargesChf,
            ratio: Number(ratio.toFixed(4))
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.reserve_fund_detected',
    weight: 3,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)
      const reserveLineItems = structured ? getReserveLineItems(structured) : []

      if (!reserveLineItems.length && !/(reservefonds|ruckstellung|rueckstellung|erneuerungsfonds)/.test(context.searchableText)) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.reserve_fund_detected',
          severity: 'warning',
          title: 'Reserve or fund allocation detected',
          description: 'Reserve or fund-related positions in service charges should be checked against the lease and supporting documents.',
          explanation: 'The extracted statement contains a reserve or fund-related line item that is often disputed and should be verified.',
          matchedValue: reserveLineItems[0]?.label || null,
          metadataJson: {
            lineItems: reserveLineItems
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.contract_mismatch_detected',
    weight: 4,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)
      const contractReference = context.contractReference

      if (!structured || !contractReference?.structuredExtraction || contractReference.structuredExtraction.documentKind !== 'mietvertrag') {
        return []
      }

      const uncoveredChargeTypes: string[] = []

      if (
        (getAdminLineItems(structured).length > 0 || structured.extracted.administrationCostsChf !== null)
        && !hasContractCoverageForCharge(contractReference.searchableText, 'administration')
      ) {
        uncoveredChargeTypes.push('administration')
      }

      if (
        (getReserveLineItems(structured).length > 0 || structured.extracted.reserveFundChf !== null)
        && !hasContractCoverageForCharge(contractReference.searchableText, 'reserve_fund')
      ) {
        uncoveredChargeTypes.push('reserve_fund')
      }

      if (!uncoveredChargeTypes.length) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.contract_mismatch_detected',
          severity: uncoveredChargeTypes.includes('reserve_fund') ? 'high' : 'warning',
          title: 'Charged positions do not clearly match the contract reference',
          description: 'The statement contains billed positions that are not clearly supported by the linked lease contract.',
          explanation: 'The current service charge statement includes administration or reserve-related items, but the contract reference does not appear to mention these cost positions clearly enough for straightforward validation.',
          matchedValue: uncoveredChargeTypes.join(', '),
          metadataJson: {
            uncoveredChargeTypes,
            contractMonthlyAdditionalCostsChf: contractReference.structuredExtraction.extracted.additionalCostsChf,
            administrationCostsChf: structured.extracted.administrationCostsChf,
            reserveFundChf: structured.extracted.reserveFundChf
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.balance_inconsistent_with_totals',
    weight: 5,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)

      if (!structured) {
        return []
      }

      const mismatch = calculateBalanceMismatch(structured)

      if (!mismatch || mismatch.difference <= 5) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.balance_inconsistent_with_totals',
          severity: mismatch.difference >= 50 ? 'high' : 'warning',
          title: 'Final balance appears inconsistent with totals',
          description: 'The extracted final balance does not line up with the extracted totals and advance payments.',
          explanation: 'The structured extraction suggests a mismatch between total charges, advance payments, and the reported balance, which should be verified manually.',
          matchedValue: structured.extracted.balanceChf?.toFixed(2) || null,
          metadataJson: {
            totalChargesChf: structured.extracted.totalChargesChf,
            advancePaymentsChf: structured.extracted.advancePaymentsChf,
            balanceChf: structured.extracted.balanceChf,
            balanceDirection: structured.extracted.balanceDirection,
            expectedBalanceChf: mismatch.expectedBalance,
            differenceChf: mismatch.difference
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.previous_year_increase_detected',
    weight: 4,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)
      const previousYear = getPreviousYearNebenkostenExtraction(context)

      if (
        !structured
        || !previousYear
        || structured.extracted.totalChargesChf === null
        || previousYear.extracted.totalChargesChf === null
        || previousYear.extracted.totalChargesChf <= 0
      ) {
        return []
      }

      const difference = Number((structured.extracted.totalChargesChf - previousYear.extracted.totalChargesChf).toFixed(2))
      const ratio = Number((structured.extracted.totalChargesChf / previousYear.extracted.totalChargesChf).toFixed(4))

      if (difference < 200 || ratio < 1.25) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.previous_year_increase_detected',
          severity: difference >= 500 || ratio >= 1.5 ? 'high' : 'warning',
          title: 'Charges increased significantly compared with the previous year',
          description: 'The total charges in the current statement are materially higher than in the linked previous-year reference.',
          explanation: 'The linked previous-year statement shows substantially lower total charges. The increase should be checked against billing period changes, new cost positions, and underlying receipts.',
          matchedValue: structured.extracted.totalChargesChf.toFixed(2),
          metadataJson: {
            currentTotalChargesChf: structured.extracted.totalChargesChf,
            previousYearTotalChargesChf: previousYear.extracted.totalChargesChf,
            differenceChf: difference,
            ratio
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.tenant_share_out_of_range',
    weight: 5,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)
      const tenantSharePercent = structured?.extracted.tenantSharePercent ?? null

      if (tenantSharePercent === null || (tenantSharePercent > 0 && tenantSharePercent <= 100)) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.tenant_share_out_of_range',
          severity: 'high',
          title: 'Tenant cost share appears outside a valid range',
          description: 'The extracted tenant share percentage falls outside a plausible 0-100% range.',
          explanation: 'The structured extraction found a tenant share percentage that looks invalid and should be checked against the statement logic.',
          matchedValue: `${tenantSharePercent}%`,
          metadataJson: {
            tenantSharePercent
          }
        })
      ]
    }
  },
  {
    code: 'nebenkosten.suspicious_keywords_detected',
    weight: 2,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      if (!hasSuspiciousKeywords(context.searchableText)) {
        return []
      }

      return [
        buildFinding({
          ruleCode: 'nebenkosten.suspicious_keywords_detected',
          severity: 'warning',
          title: 'Suspicious wording detected in the statement',
          description: 'The statement contains wording that can indicate estimates, flat charges, or weak itemization.',
          explanation: 'The extracted text contains keywords often associated with hard-to-audit service charge positions and should be reviewed carefully.',
          matchedValue: null,
          metadataJson: null
        })
      ]
    }
  },
  {
    code: 'nebenkosten.additional_payment_detected',
    weight: 4,
    appliesTo: context => context.checkType === 'nebenkosten_check',
    evaluate: context => {
      const structured = getNebenkostenExtraction(context)
      const balance = structured?.extracted.balanceChf ?? null
      const direction = structured?.extracted.balanceDirection ?? null

      if (balance === null || direction !== 'debit' || balance < 500) {
        return []
      }

      const severity = balance >= 1000 ? 'high' : 'warning'
      const ruleCode = balance >= 1000
        ? 'nebenkosten.large_additional_payment'
        : 'nebenkosten.additional_payment_detected'
      const title = balance >= 1000
        ? 'Large additional payment detected'
        : 'Additional payment detected'
      const description = balance >= 1000
        ? 'A high additional payment was detected in the statement.'
        : 'An additional payment was detected in the statement.'

      return [
        buildFinding({
          ruleCode,
          severity,
          title,
          description,
          explanation: 'The structured extraction shows a payable balance for the tenant, which should be checked against the billed positions and contract.',
          matchedValue: balance.toFixed(2),
          metadataJson: {
            amount: balance,
            balanceDirection: direction
          }
        })
      ]
    }
  }
]
