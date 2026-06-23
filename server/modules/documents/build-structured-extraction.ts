import { z } from 'zod'

import {
  type NebenkostenStructuredExtraction,
  type MietvertragStructuredExtraction,
  mietvertragStructuredExtractionSchema,
  nebenkostenStructuredExtractionSchema,
  normalizationMetadataSchema
} from '../../../shared/schemas/documents'

type NormalizationMetadata = z.infer<typeof normalizationMetadataSchema>

type AmountCandidate = {
  raw: string
  currency: 'CHF'
  value: number
}

function parseChfAmount(rawValue: string) {
  const normalized = rawValue
    .replace(/\s+/g, '')
    .replace(/CHF/gi, '')
    .replace(/'/g, '')

  const parsed = Number.parseFloat(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

function buildAmountCandidates(rawAmounts: string[]) {
  return rawAmounts
    .map(raw => {
      const value = parseChfAmount(raw)

      if (value === null) {
        return null
      }

      return {
        raw,
        currency: 'CHF' as const,
        value
      }
    })
    .filter((item): item is AmountCandidate => item !== null)
}

function firstDefined<T>(...values: Array<T | null | undefined>) {
  return values.find(value => value !== null && typeof value !== 'undefined') ?? null
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match) {
      return match
    }
  }

  return null
}

function firstDateMatch(text: string, patterns: RegExp[]) {
  const match = firstMatch(text, patterns)

  return match?.[1] || null
}

function firstNumberMatch(text: string, patterns: RegExp[]) {
  const match = firstMatch(text, patterns)

  if (!match?.[1]) {
    return null
  }

  const value = Number.parseFloat(match[1].replace(',', '.'))

  return Number.isFinite(value) ? value : null
}

function firstAmountMatch(text: string, patterns: RegExp[]) {
  const match = firstMatch(text, patterns)

  if (!match) {
    return null
  }

  const raw = firstDefined(match[1], match[2])

  if (!raw) {
    return null
  }

  const value = parseChfAmount(raw)

  if (value === null) {
    return null
  }

  return {
    raw,
    value
  }
}

function extractNameList(value: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(/\s*(?:,|;| und | and )\s*/i)
    .map(item => item.trim())
    .filter(Boolean)
}

function extractPartyNames(text: string, keywords: string[]) {
  const pattern = new RegExp(`(?:${keywords.join('|')})\\s*:?\\s*([^\\n]+)`, 'i')
  const match = text.match(pattern)

  return extractNameList(match?.[1] || null)
}

function extractAddress(text: string) {
  const match = text.match(
    /(?:mietobjekt|objekt|adresse|wohnungsadresse)\s*:?\s*([^\n,]+?),?\s*(\d{4})\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ -]*)/i
  )

  if (!match?.[1] || !match?.[2] || !match?.[3]) {
    return {
      propertyAddress: null,
      postalCode: null,
      city: null
    }
  }

  return {
    propertyAddress: `${match[1].trim()}, ${match[2]} ${match[3].trim()}`,
    postalCode: match[2],
    city: match[3].trim()
  }
}

function extractRoomCount(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:zimmer|zi\.)/i)

  if (!match?.[1]) {
    return null
  }

  const value = Number.parseFloat(match[1].replace(',', '.'))

  return Number.isFinite(value) ? value : null
}

function extractDateCandidates(normalization: NormalizationMetadata) {
  return normalization.detected.dates
    .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value))
}

function extractMietvertragEntities(text: string, amountCandidates: AmountCandidate[], normalization: NormalizationMetadata) {
  const tenantNames = extractPartyNames(text, ['mieter', 'mieterin', 'mieterschaft'])
  const landlordNames = extractPartyNames(text, ['vermieter', 'vermieterin', 'verwaltung'])
  const address = extractAddress(text)
  const leaseStartDate = firstDateMatch(text, [
    /(?:mietbeginn|beginn des mietverhaltnisses|beginn)\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
    /(?:einzug|bezugsdatum)\s*:?\s*(\d{4}-\d{2}-\d{2})/i
  ])
  const leaseEndDate = firstDateMatch(text, [
    /(?:mietende|ende des mietverhaltnisses|ende)\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
    /(?:befristet bis)\s*:?\s*(\d{4}-\d{2}-\d{2})/i
  ])
  const noticePeriodMonths = firstNumberMatch(text, [
    /kundigungsfrist[^0-9]{0,20}(\d+(?:[.,]\d+)?)\s*monat/i,
    /kuendigungsfrist[^0-9]{0,20}(\d+(?:[.,]\d+)?)\s*monat/i
  ])
  const minimumTermMonths = firstNumberMatch(text, [
    /mindestmietdauer[^0-9]{0,20}(\d+(?:[.,]\d+)?)\s*monat/i,
    /mindestens[^0-9]{0,20}(\d+(?:[.,]\d+)?)\s*monat/i
  ])
  const monthlyRent = firstAmountMatch(text, [
    /(?:nettomiete|mietzins|miete)\D{0,40}(CHF\s*[0-9'.]+)/i,
    /(CHF\s*[0-9'.]+)\D{0,20}(?:nettomiete|mietzins|miete)/i
  ])
  const additionalCosts = firstAmountMatch(text, [
    /(?:nebenkosten|akonto|heizkosten)\D{0,40}(CHF\s*[0-9'.]+)/i,
    /(CHF\s*[0-9'.]+)\D{0,20}(?:nebenkosten|akonto|heizkosten)/i
  ])
  const grossMonthlyRent = firstAmountMatch(text, [
    /(?:bruttomiete|total miete|gesamtmiete)\D{0,40}(CHF\s*[0-9'.]+)/i,
    /(CHF\s*[0-9'.]+)\D{0,20}(?:bruttomiete|total miete|gesamtmiete)/i
  ])
  const deposit = firstAmountMatch(text, [
    /(?:kaution|depot)\D{0,40}(CHF\s*[0-9'.]+)/i,
    /(CHF\s*[0-9'.]+)\D{0,20}(?:kaution|depot)/i
  ])
  const fixedTerm = /unbefristet/i.test(text)
    ? false
    : /befristet/i.test(text)
      ? true
      : null
  const professionalCleaningClause = /(endreinigung|fachmannisch|fachmaennisch|professionell gereinigt)/i.test(text)
    ? true
    : null
  const repaintingClause = /(frisch gestrichen|neu gestrichen|vollstandig gestrichen)/i.test(text)
    ? true
    : null
  const monthlyRentChf = monthlyRent?.value ?? null
  const additionalCostsChf = additionalCosts?.value ?? null
  const grossMonthlyRentChf = firstDefined(
    grossMonthlyRent?.value,
    monthlyRentChf !== null && additionalCostsChf !== null ? monthlyRentChf + additionalCostsChf : null
  )
  const depositAmountChf = deposit?.value ?? null
  const depositMonthsEquivalent =
    depositAmountChf !== null && monthlyRentChf !== null && monthlyRentChf > 0
      ? Number((depositAmountChf / monthlyRentChf).toFixed(2))
      : null
  const dateCandidates = extractDateCandidates(normalization)

  return {
    tenantNames,
    landlordNames,
    propertyAddress: address.propertyAddress,
    postalCode: address.postalCode,
    city: address.city,
    canton: null,
    roomCount: extractRoomCount(text),
    leaseStartDate: firstDefined(leaseStartDate, dateCandidates[0]),
    leaseEndDate: firstDefined(leaseEndDate, fixedTerm ? dateCandidates[1] : null),
    fixedTerm,
    minimumTermMonths,
    noticePeriodMonths,
    monthlyRentChf,
    additionalCostsChf,
    grossMonthlyRentChf,
    depositAmountChf,
    depositMonthsEquivalent,
    professionalCleaningClause,
    repaintingClause,
    hasPartyNames: tenantNames.length > 0 || landlordNames.length > 0,
    hasLeaseDates: dateCandidates.length > 0,
    hasFinancialTerms: amountCandidates.length > 0
  }
}

function categorizeNebenkostenItem(label: string) {
  const normalized = label.toLowerCase()

  if (/heizung|heiz|warmwasser/.test(normalized)) {
    return 'heating' as const
  }

  if (/wasser|abwasser/.test(normalized)) {
    return 'water' as const
  }

  if (/kehricht|abfall|entsorgung/.test(normalized)) {
    return 'waste' as const
  }

  if (/hauswart|abwart|caretaker/.test(normalized)) {
    return 'caretaker' as const
  }

  if (/verwaltung|administration|bearbeitung|mahngebuhr/.test(normalized)) {
    return 'administration' as const
  }

  if (/reservefonds|ruckstellung|rueckstellung|erneuerungsfonds/.test(normalized)) {
    return 'reserve_fund' as const
  }

  if (/steuer|tax/.test(normalized)) {
    return 'tax' as const
  }

  return 'other' as const
}

function extractNebenkostenLineItems(text: string) {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  return lines
    .map(line => {
      const match = line.match(/^(.{3,}?)\s+(CHF\s*[0-9'.]+(?:\.[0-9]{1,2})?)$/i)

      if (!match?.[1] || !match?.[2]) {
        return null
      }

      const amountChf = parseChfAmount(match[2])
      const label = match[1].trim()
      const category = categorizeNebenkostenItem(label)

      return {
        label,
        amountChf,
        category,
        suspicious: category === 'administration' || category === 'reserve_fund'
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function sumByCategory(
  lineItems: Array<{ category: string, amountChf: number | null }>,
  category: string
) {
  const values = lineItems
    .filter(item => item.category === category && item.amountChf !== null)
    .map(item => item.amountChf as number)

  if (!values.length) {
    return null
  }

  return Number(values.reduce((sum, value) => sum + value, 0).toFixed(2))
}

function extractNebenkostenEntities(text: string, amountCandidates: AmountCandidate[], normalization: NormalizationMetadata) {
  const dateCandidates = extractDateCandidates(normalization)
  const lineItems = extractNebenkostenLineItems(text)
  const billingPeriodMatch = firstMatch(text, [
    /(?:periode|abrechnungsperiode|vom)\s*(\d{4}-\d{2}-\d{2})\s*(?:bis|-|to)\s*(\d{4}-\d{2}-\d{2})/i,
    /(\d{4}-\d{2}-\d{2})\s*(?:bis|-|to)\s*(\d{4}-\d{2}-\d{2})/i
  ])
  const advancePayments = firstAmountMatch(text, [
    /(?:akonto|vorauszahlung|vorauszahlungen|geleistete akontozahlungen)\D{0,40}(CHF\s*[0-9'.]+)/i
  ])
  const totalCharges = firstAmountMatch(text, [
    /(?:gesamtkosten|total|total kosten|summe nebenkosten)\D{0,40}(CHF\s*[0-9'.]+)/i
  ])
  const debitBalance = firstAmountMatch(text, [
    /(?:nachzahlung|saldo zu ihren lasten|zu ihren lasten)\D{0,40}(CHF\s*[0-9'.]+)/i
  ])
  const creditBalance = firstAmountMatch(text, [
    /(?:guthaben|saldo zu ihren gunsten|zu ihren gunsten|ruckerstattung|rueckerstattung)\D{0,40}(CHF\s*[0-9'.]+)/i
  ])
  const tenantSharePercent = firstNumberMatch(text, [
    /(?:ihr anteil|anteil mieter|kostenanteil)\D{0,20}(\d+(?:[.,]\d+)?)\s*%/i
  ])
  const issueDate = firstDateMatch(text, [
    /(?:datum|erstellt am|rechnungsdatum)\D{0,20}(\d{4}-\d{2}-\d{2})/i
  ])
  const dueDate = firstDateMatch(text, [
    /(?:fallig bis|faellig bis|zahlbar bis)\D{0,20}(\d{4}-\d{2}-\d{2})/i
  ])
  const address = extractAddress(text)
  const balance = firstDefined(debitBalance?.value, creditBalance?.value)
  const balanceDirection = debitBalance
    ? 'debit'
    : creditBalance
      ? 'credit'
      : null

  return {
    propertyAddress: address.propertyAddress,
    billingPeriodStart: billingPeriodMatch?.[1] || dateCandidates[0] || null,
    billingPeriodEnd: billingPeriodMatch?.[2] || dateCandidates[1] || null,
    issueDate: firstDefined(issueDate, dateCandidates[2]),
    dueDate,
    tenantSharePercent,
    advancePaymentsChf: advancePayments?.value ?? null,
    totalChargesChf: totalCharges?.value ?? null,
    balanceChf: balance,
    balanceDirection,
    heatingCostsChf: sumByCategory(lineItems, 'heating'),
    waterCostsChf: sumByCategory(lineItems, 'water'),
    administrationCostsChf: sumByCategory(lineItems, 'administration'),
    reserveFundChf: sumByCategory(lineItems, 'reserve_fund'),
    lineItems: lineItems.length ? lineItems : amountCandidates.slice(0, 12).map(candidate => ({
      label: candidate.raw,
      amountChf: candidate.value,
      category: categorizeNebenkostenItem(candidate.raw),
      suspicious: /verwaltung|administration|bearbeitung|mahngebuhr|reservefonds|ruckstellung|rueckstellung|erneuerungsfonds/i.test(candidate.raw)
    })),
    hasBillingPeriod: Boolean((billingPeriodMatch?.[1] && billingPeriodMatch?.[2]) || dateCandidates.length >= 2),
    hasTotals: Boolean(totalCharges || advancePayments || balance || amountCandidates.length > 0),
    hasLineItems: lineItems.length > 0 || amountCandidates.length > 0
  }
}

function buildMietvertragStructuredExtraction(input: {
  sourceEngine: 'pdf_text' | 'ocr' | 'manual'
  normalizedText: string
  normalization: NormalizationMetadata
}): MietvertragStructuredExtraction {
  const amountCandidates = buildAmountCandidates(input.normalization.detected.amounts)
  const extracted = extractMietvertragEntities(input.normalizedText, amountCandidates, input.normalization)
  const completeSignals = [
    extracted.monthlyRentChf !== null,
    extracted.depositAmountChf !== null,
    extracted.leaseStartDate !== null,
    extracted.noticePeriodMonths !== null
  ].filter(Boolean).length

  return mietvertragStructuredExtractionSchema.parse({
    schema: 'mietvertrag.v1',
    documentKind: 'mietvertrag',
    extractor: {
      status: completeSignals >= 3 ? 'complete' : extracted.hasLeaseDates || extracted.hasFinancialTerms ? 'partial' : 'initialized',
      sourceEngine: input.sourceEngine,
      normalizedTextLength: input.normalizedText.length
    },
    normalization: input.normalization,
    candidates: {
      dates: input.normalization.detected.dates,
      amounts: amountCandidates,
      currencies: input.normalization.detected.currencies
    },
    extracted: {
      tenantNames: extracted.tenantNames,
      landlordNames: extracted.landlordNames,
      propertyAddress: extracted.propertyAddress,
      postalCode: extracted.postalCode,
      city: extracted.city,
      canton: extracted.canton,
      roomCount: extracted.roomCount,
      leaseStartDate: extracted.leaseStartDate,
      leaseEndDate: extracted.leaseEndDate,
      fixedTerm: extracted.fixedTerm,
      minimumTermMonths: extracted.minimumTermMonths,
      noticePeriodMonths: extracted.noticePeriodMonths,
      monthlyRentChf: extracted.monthlyRentChf,
      additionalCostsChf: extracted.additionalCostsChf,
      grossMonthlyRentChf: extracted.grossMonthlyRentChf,
      depositAmountChf: extracted.depositAmountChf,
      depositMonthsEquivalent: extracted.depositMonthsEquivalent,
      professionalCleaningClause: extracted.professionalCleaningClause,
      repaintingClause: extracted.repaintingClause
    },
    completeness: {
      hasPartyNames: extracted.hasPartyNames,
      hasLeaseDates: extracted.hasLeaseDates,
      hasFinancialTerms: extracted.hasFinancialTerms
    }
  })
}

function buildNebenkostenStructuredExtraction(input: {
  sourceEngine: 'pdf_text' | 'ocr' | 'manual'
  normalizedText: string
  normalization: NormalizationMetadata
}): NebenkostenStructuredExtraction {
  const amountCandidates = buildAmountCandidates(input.normalization.detected.amounts)
  const extracted = extractNebenkostenEntities(input.normalizedText, amountCandidates, input.normalization)
  const completeSignals = [
    extracted.billingPeriodStart !== null,
    extracted.billingPeriodEnd !== null,
    extracted.totalChargesChf !== null,
    extracted.balanceChf !== null,
    extracted.lineItems.length > 0
  ].filter(Boolean).length

  return nebenkostenStructuredExtractionSchema.parse({
    schema: 'nebenkostenabrechnung.v1',
    documentKind: 'nebenkostenabrechnung',
    extractor: {
      status: completeSignals >= 4 ? 'complete' : extracted.hasBillingPeriod || extracted.hasTotals ? 'partial' : 'initialized',
      sourceEngine: input.sourceEngine,
      normalizedTextLength: input.normalizedText.length
    },
    normalization: input.normalization,
    candidates: {
      dates: input.normalization.detected.dates,
      amounts: amountCandidates,
      currencies: input.normalization.detected.currencies
    },
    extracted: {
      propertyAddress: extracted.propertyAddress,
      billingPeriodStart: extracted.billingPeriodStart,
      billingPeriodEnd: extracted.billingPeriodEnd,
      issueDate: extracted.issueDate,
      dueDate: extracted.dueDate,
      tenantSharePercent: extracted.tenantSharePercent,
      advancePaymentsChf: extracted.advancePaymentsChf,
      totalChargesChf: extracted.totalChargesChf,
      balanceChf: extracted.balanceChf,
      balanceDirection: extracted.balanceDirection,
      heatingCostsChf: extracted.heatingCostsChf,
      waterCostsChf: extracted.waterCostsChf,
      administrationCostsChf: extracted.administrationCostsChf,
      reserveFundChf: extracted.reserveFundChf,
      lineItems: extracted.lineItems
    },
    completeness: {
      hasBillingPeriod: extracted.hasBillingPeriod,
      hasTotals: extracted.hasTotals,
      hasLineItems: extracted.hasLineItems
    }
  })
}

export function buildStructuredExtraction(input: {
  documentKind: string
  sourceEngine: 'pdf_text' | 'ocr' | 'manual'
  normalizedText: string
  normalization: NormalizationMetadata
}) {
  if (input.documentKind === 'mietvertrag') {
    return buildMietvertragStructuredExtraction({
      sourceEngine: input.sourceEngine,
      normalizedText: input.normalizedText,
      normalization: input.normalization
    })
  }

  if (input.documentKind === 'nebenkostenabrechnung' || input.documentKind === 'previous_nebenkostenabrechnung') {
    return buildNebenkostenStructuredExtraction({
      sourceEngine: input.sourceEngine,
      normalizedText: input.normalizedText,
      normalization: input.normalization
    })
  }

  return null
}
