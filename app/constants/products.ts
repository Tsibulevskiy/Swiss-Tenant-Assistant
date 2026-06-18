export const standaloneProductCodes = [
  'mietvertrag_check',
  'nebenkosten_check',
  'mietzinserhoehung_check',
  'deposit_return_check',
  'letter_generator'
] as const

export const allProductCodes = [
  ...standaloneProductCodes,
  'tenant_bundle'
] as const

export type StandaloneProductCode = typeof standaloneProductCodes[number]
export type ProductCode = typeof allProductCodes[number]

export function isProductCode(value: string): value is ProductCode {
  return (allProductCodes as readonly string[]).includes(value)
}
