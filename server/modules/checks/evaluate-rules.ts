type RuleFindingInput = {
  ruleCode: string
  severity: 'info' | 'warning' | 'high'
  title: string
  description: string
  matchedValue?: string | null
  metadataJson?: Record<string, unknown> | null
}

type EvaluatedRulesResult = {
  findings: RuleFindingInput[]
  riskScore: 'low' | 'medium' | 'high'
  summaryText: string
  ruleResultJson: Record<string, unknown>
}

function normalizeForRules(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function parseMoney(rawValue: string) {
  const cleaned = rawValue
    .replace(/chf/gi, '')
    .replace(/[^0-9,.'-]/g, '')
    .trim()

  if (!cleaned) {
    return null
  }

  let normalized = cleaned.replace(/'/g, '')

  if (normalized.endsWith('.-')) {
    normalized = normalized.slice(0, -2)
  }

  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/,/g, '')
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.')
  }

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

function firstMoneyMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (!match?.[2]) {
      continue
    }

    const value = parseMoney(match[2])

    if (value !== null) {
      return {
        raw: match[2],
        value
      }
    }
  }

  return null
}

function evaluateMietvertragRules(text: string) {
  const findings: RuleFindingInput[] = []

  const depositAmount = firstMoneyMatch(text, [
    /(kaution|depot)[^0-9]{0,40}((?:chf\s*)?[0-9][0-9'.,-]*)/i,
    /((?:chf\s*)?[0-9][0-9'.,-]*)[^a-z0-9]{0,20}(kaution|depot)/i
  ])

  const rentAmount = firstMoneyMatch(text, [
    /(nettomiete|mietzins|miete)[^0-9]{0,40}((?:chf\s*)?[0-9][0-9'.,-]*)/i,
    /((?:chf\s*)?[0-9][0-9'.,-]*)[^a-z0-9]{0,20}(nettomiete|mietzins|miete)/i
  ])

  if (depositAmount && rentAmount && depositAmount.value > rentAmount.value * 3) {
    findings.push({
      ruleCode: 'mietvertrag.deposit_above_three_months',
      severity: 'high',
      title: 'Deposit appears higher than three monthly rents',
      description: 'Swiss rental deposits are usually capped at three months of net rent. Review this clause before signing.',
      matchedValue: depositAmount.raw,
      metadataJson: {
        depositAmount: depositAmount.value,
        monthlyRent: rentAmount.value
      }
    })
  }

  const renovationMatch = text.match(
    /(endreinigung|fachmannisch|fachmaennisch|frisch gestrichen|neu gestrichen|vollstandig gestrichen|professionell gereinigt)/
  )

  if (renovationMatch) {
    findings.push({
      ruleCode: 'mietvertrag.professional_cleaning_clause',
      severity: 'warning',
      title: 'Potential mandatory cleaning or renovation clause',
      description: 'Clauses that require professional final cleaning or fixed repainting obligations can be problematic and should be reviewed.',
      matchedValue: renovationMatch[1]
    })
  }

  const noticePeriodMatch = text.match(/kundigungsfrist[^0-9]{0,20}([4-9]|1[0-2])\s*monat/)

  if (noticePeriodMatch) {
    findings.push({
      ruleCode: 'mietvertrag.notice_period_longer_than_three_months',
      severity: 'warning',
      title: 'Notice period appears longer than three months',
      description: 'The detected notice period is longer than the common three-month standard and should be checked carefully.',
      matchedValue: `${noticePeriodMatch[1]} months`
    })
  }

  return findings
}

function evaluateNebenkostenRules(text: string) {
  const findings: RuleFindingInput[] = []

  const adminMatch = text.match(/(verwaltungskosten|administrationskosten|bearbeitungsgebuhr|mahngebuhr)/)

  if (adminMatch) {
    findings.push({
      ruleCode: 'nebenkosten.admin_fee_detected',
      severity: 'warning',
      title: 'Administrative fee detected in service charges',
      description: 'Administrative or handling fees in a service charge statement can require closer review.',
      matchedValue: adminMatch[1]
    })
  }

  const reserveMatch = text.match(/(reservefonds|ruckstellung|rueckstellung|erneuerungsfonds)/)

  if (reserveMatch) {
    findings.push({
      ruleCode: 'nebenkosten.reserve_fund_detected',
      severity: 'warning',
      title: 'Reserve or fund allocation detected',
      description: 'Reserve or fund-related positions in service charges should be checked against the lease and supporting documents.',
      matchedValue: reserveMatch[1]
    })
  }

  const additionalPaymentMatch = text.match(
    /(nachzahlung|saldo zu ihren lasten|zu ihren lasten)[^0-9]{0,40}((?:chf\s*)?[0-9][0-9'.,-]*)/
  )

  if (additionalPaymentMatch?.[2]) {
    const amount = parseMoney(additionalPaymentMatch[2])

    if (amount !== null && amount >= 1000) {
      findings.push({
        ruleCode: 'nebenkosten.large_additional_payment',
        severity: 'high',
        title: 'Large additional payment detected',
        description: 'A high additional payment was detected in the statement. Review the detailed positions and request supporting receipts if needed.',
        matchedValue: additionalPaymentMatch[2],
        metadataJson: {
          amount
        }
      })
    } else if (amount !== null && amount >= 500) {
      findings.push({
        ruleCode: 'nebenkosten.additional_payment_detected',
        severity: 'warning',
        title: 'Additional payment detected',
        description: 'An additional payment was detected in the statement. Review the billed positions and compare them with the contract.',
        matchedValue: additionalPaymentMatch[2],
        metadataJson: {
          amount
        }
      })
    }
  }

  return findings
}

function buildSummary(checkType: string, findings: RuleFindingInput[], normalizedText: string) {
  if (!findings.length) {
    if (checkType === 'mietvertrag_check') {
      return 'Initial contract heuristics found no immediate rule flags. Review deposit, notice period, and cleaning clauses manually.'
    }

    if (checkType === 'nebenkosten_check') {
      return 'Initial service charge heuristics found no immediate rule flags. Review line items and supporting receipts manually.'
    }

    return normalizedText.slice(0, 280) || 'Extraction completed.'
  }

  const lead = findings
    .slice(0, 2)
    .map(finding => finding.title)
    .join('; ')

  return `Initial rule evaluation flagged ${findings.length} issue(s): ${lead}.`
}

export function evaluateRulesForCheck(input: {
  checkType: string
  rawText: string | null
  normalizedText: string | null
}) : EvaluatedRulesResult {
  const sourceText = input.normalizedText || input.rawText || ''
  const normalizedText = normalizeForRules(sourceText)

  let findings: RuleFindingInput[] = []

  if (input.checkType === 'mietvertrag_check') {
    findings = evaluateMietvertragRules(normalizedText)
  } else if (input.checkType === 'nebenkosten_check') {
    findings = evaluateNebenkostenRules(normalizedText)
  }

  const riskScore =
    findings.some(finding => finding.severity === 'high')
      ? 'high'
      : findings.some(finding => finding.severity === 'warning')
        ? 'medium'
        : 'low'

  return {
    findings,
    riskScore,
    summaryText: buildSummary(input.checkType, findings, sourceText.replace(/\s+/g, ' ').trim()),
    ruleResultJson: {
      evaluatedAt: new Date().toISOString(),
      findingsCount: findings.length,
      rulesTriggered: findings.map(finding => finding.ruleCode)
    }
  }
}
