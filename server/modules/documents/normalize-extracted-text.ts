type NormalizationMetadata = {
  originalLength: number
  normalizedLength: number
  replacements: {
    ocrNoiseFixes: number
    currencyNormalizations: number
    amountNormalizations: number
    dateNormalizations: number
    whitespaceCollapses: number
  }
  detected: {
    dates: string[]
    amounts: string[]
    currencies: string[]
  }
}

type TextNormalizationResult = {
  normalizedText: string
  metadata: NormalizationMetadata
}

function dedupe(values: string[]) {
  return Array.from(new Set(values))
}

function normalizeDigitsForOcr(value: string) {
  return value
    .replace(/[oO]/g, '0')
    .replace(/[I|l]/g, '1')
}

function normalizeAmountValue(value: string) {
  let normalized = normalizeDigitsForOcr(value)
    .replace(/\s+/g, '')
    .replace(/'/g, '')

  normalized = normalized.replace(/[,-]\s*$/g, '')
  normalized = normalized.replace(/\.-$/g, '')

  const lastComma = normalized.lastIndexOf(',')
  const lastDot = normalized.lastIndexOf('.')

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'

    normalized = decimalSeparator === ','
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '')
  } else if (lastComma >= 0) {
    const decimalDigits = normalized.length - lastComma - 1
    normalized = decimalDigits > 0 && decimalDigits <= 2
      ? normalized.replace(',', '.')
      : normalized.replace(/,/g, '')
  } else if (lastDot >= 0) {
    const decimalDigits = normalized.length - lastDot - 1
    normalized = decimalDigits > 0 && decimalDigits <= 2
      ? normalized
      : normalized.replace(/\./g, '')
  }

  return normalized
}

function toIsoDate(day: string, month: string, year: string) {
  const normalizedYear = year.length === 2
    ? `${Number.parseInt(year, 10) >= 70 ? '19' : '20'}${year}`
    : year

  const normalizedMonth = month.padStart(2, '0')
  const normalizedDay = day.padStart(2, '0')

  return `${normalizedYear}-${normalizedMonth}-${normalizedDay}`
}

export function normalizeExtractedText(rawText: string): TextNormalizationResult {
  const replacements = {
    ocrNoiseFixes: 0,
    currencyNormalizations: 0,
    amountNormalizations: 0,
    dateNormalizations: 0,
    whitespaceCollapses: 0
  }
  const detectedDates: string[] = []
  const detectedAmounts: string[] = []
  const detectedCurrencies: string[] = []

  let normalizedText = rawText
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2000-\u200b]/g, ' ')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/([A-Za-zÀ-ÿ])-\n([A-Za-zÀ-ÿ])/g, '$1$2')

  normalizedText = normalizedText.replace(/\b(?:c\s*h\s*f|chf|fr\.?|sfr\.?|sfr|s\.fr\.?)\b/gi, match => {
    replacements.currencyNormalizations += 1
    detectedCurrencies.push(match)
    return 'CHF'
  })

    normalizedText = normalizedText.replace(
    /\bCHF[ \t]*([0-9OIl|][0-9OIl|'., \t-]*)\b/g,
    (_match, amountValue: string) => {
      replacements.amountNormalizations += 1
      detectedAmounts.push(`CHF ${amountValue.trim()}`)
      return `CHF ${normalizeAmountValue(amountValue)}`
    }
  )

  normalizedText = normalizedText.replace(
    /\b([0-9OIl|][0-9OIl|'., \t-]*)[ \t]*CHF\b/g,
    (_match, amountValue: string) => {
      replacements.amountNormalizations += 1
      detectedAmounts.push(`${amountValue.trim()} CHF`)
      return `CHF ${normalizeAmountValue(amountValue)}`
    }
  )

  normalizedText = normalizedText.replace(
    /\b([0-9]{1,3}(?:[ '\u00a0.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]+[.,][0-9]{1,2})\b/g,
    (match: string) => {
      const normalizedNumber = normalizeAmountValue(match)

      if (normalizedNumber === match) {
        return match
      }

      replacements.amountNormalizations += 1
      detectedAmounts.push(match)
      return normalizedNumber
    }
  )

  normalizedText = normalizedText.replace(
    /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/g,
    (_match, day: string, month: string, year: string) => {
      const isoDate = toIsoDate(day, month, year)
      replacements.dateNormalizations += 1
      detectedDates.push(`${day}.${month}.${year}`)
      return isoDate
    }
  )

  normalizedText = normalizedText.replace(/(?<=\d)[oO](?=\d)|(?<=\d)[I|l](?=\d)/g, match => {
    replacements.ocrNoiseFixes += 1
    return match === 'o' || match === 'O' ? '0' : '1'
  })

  const beforeWhitespaceNormalization = normalizedText
  normalizedText = normalizedText
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  if (beforeWhitespaceNormalization !== normalizedText) {
    replacements.whitespaceCollapses += 1
  }

  return {
    normalizedText,
    metadata: {
      originalLength: rawText.length,
      normalizedLength: normalizedText.length,
      replacements,
      detected: {
        dates: dedupe(detectedDates),
        amounts: dedupe(detectedAmounts),
        currencies: dedupe(detectedCurrencies)
      }
    }
  }
}

export type { NormalizationMetadata, TextNormalizationResult }
